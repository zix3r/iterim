import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CapacityData } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  data: CapacityData | null;
  loading: boolean;
}

export function CapacityCard({ data, loading }: Props) {
  const { t } = useLanguage();
  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t('metrics.capacity')}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('metrics.noData')}</p>
        </CardContent>
      </Card>
    );
  }

  const availabilityPct = data.totalWorkDays > 0
    ? Math.round((data.availableDays / data.totalWorkDays) * 100)
    : 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('metrics.capacity')}</CardTitle>
        <CardDescription>
          {fmtDate(data.fromDate)} – {fmtDate(data.toDate)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label={t('metrics.day')} value={data.totalWorkDays} />
          <StatBox label={t('common.none')} value={data.absenceDays} highlight={data.absenceDays > 0} />
          <StatBox label={t('metrics.remaining')} value={data.availableDays} />
        </div>

        {/* Team availability bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t('teams.capacity')}</span>
            <span className="font-medium text-foreground">{availabilityPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                availabilityPct >= 80
                  ? 'bg-emerald-500'
                  : availabilityPct >= 60
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${availabilityPct}%` }}
            />
          </div>
        </div>

        {/* Per-member list */}
        {data.byMember.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              {t('teams.members')}
            </p>
            <div className="space-y-2">
              {data.byMember.map((m) => {
                const memberPct = m.workDays > 0
                  ? Math.round((m.availableDays / m.workDays) * 100)
                  : 100;
                const hasAbsence = m.absenceDays > 0;

                return (
                  <div
                    key={m.memberId}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                      hasAbsence ? 'bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/25' : 'bg-muted/50'
                    }`}
                  >
                    {/* Avatar */}
                    <Avatar size="sm">
                      <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
                      <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + mini bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                        {hasAbsence && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:bg-amber-500/10 shrink-0"
                          >
                            {m.absenceDays}d off
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${hasAbsence ? 'bg-amber-400' : 'bg-muted-foreground/50'}`}
                          style={{ width: `${memberPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Days */}
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-foreground">{m.availableDays}</span>
                      <span className="text-xs text-muted-foreground">/{m.workDays}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({
  label, value, highlight = false,
}: {
  label: string; value: number; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight && value > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-muted/50'}`}>
      <p className={`text-xl font-bold ${highlight && value > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' });
}
