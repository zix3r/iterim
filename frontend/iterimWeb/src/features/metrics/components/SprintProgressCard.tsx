import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SprintMetrics } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface Props {
  data: SprintMetrics | null;
  loading: boolean;
}

const STATUS_ORDER = ['Done', 'InProgress', 'Review', 'Todo', 'Backlog'];

const getStatusConfig = (t: (key: TranslationKey) => string): Record<string, { label: string; bar: string; text: string }> => ({
  Done:       { label: t('board.done'),        bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  InProgress: { label: t('board.inProgress'), bar: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-300'   },
  Review:     { label: t('board.review'),      bar: 'bg-violet-500',  text: 'text-violet-700 dark:text-violet-300' },
  Todo:       { label: t('board.todo'),       bar: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-300'  },
  Backlog:    { label: 'Backlog',     bar: 'bg-muted-foreground/40', text: 'text-muted-foreground'   },
});

export function SprintProgressCard({ data, loading }: Props) {
  const { t } = useLanguage();
  const STATUS_CONFIG = getStatusConfig(t);
  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t('metrics.sprintProgress')}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('board.noActiveIteration')}</p>
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round(data.percentComplete);

  const statusEntries = STATUS_ORDER
    .filter((s) => s in data.byStatus)
    .map((s) => [s, data.byStatus[s]] as [string, number]);
  Object.entries(data.byStatus).forEach(([s, v]) => {
    if (!STATUS_ORDER.includes(s)) statusEntries.push([s, v]);
  });

  const totalItems = statusEntries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{t('metrics.sprintProgress')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {data.name ?? `Iteration #${data.iterationId}`}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              data.status === 'Active'
                ? 'shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'shrink-0 bg-muted text-muted-foreground border-border'
            }
          >
            {data.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Percent + points */}
        <div className="flex items-end justify-between">
          <div className="leading-none">
            <span className="text-4xl font-bold text-foreground">{pct}</span>
            <span className="text-xl font-bold text-muted-foreground">%</span>
          </div>
          <div className="text-right text-sm">
            <span className="font-semibold text-foreground">{data.completedPoints}</span>
            <span className="text-muted-foreground"> / {data.totalPoints} {t('metrics.points')}</span>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Status stacked bar + legend */}
        {totalItems > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              {t('common.status')}
            </p>
            <div className="flex h-2 w-full rounded-full overflow-hidden gap-px bg-muted">
              {statusEntries.map(([status, count]) => {
                const cfg = STATUS_CONFIG[status] ?? { bar: 'bg-muted-foreground/40' };
                return (
                  <div
                    key={status}
                    className={`${cfg.bar}`}
                    style={{ width: `${(count / totalItems) * 100}%` }}
                    title={`${STATUS_CONFIG[status]?.label ?? status}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {statusEntries.map(([status, count]) => {
                const cfg = STATUS_CONFIG[status] ?? { label: status, bar: 'bg-muted-foreground/40', text: 'text-muted-foreground' };
                return (
                  <div key={status} className="flex items-center gap-1.5 text-xs">
                    <span className={`inline-block h-2 w-2 rounded-sm ${cfg.bar}`} />
                    <span className={cfg.text}>{cfg.label}</span>
                    <span className="text-muted-foreground">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span>{fmtDate(data.startDate)}</span>
          <span>{fmtDate(data.endDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' });
}
