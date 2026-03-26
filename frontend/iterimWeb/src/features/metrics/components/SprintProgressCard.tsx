import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SprintMetrics } from '@/lib/api';

interface Props {
  data: SprintMetrics | null;
  loading: boolean;
}

const STATUS_ORDER = ['Done', 'InProgress', 'Review', 'Todo', 'Backlog'];

const STATUS_CONFIG: Record<string, { label: string; bar: string; text: string }> = {
  Done:       { label: 'Done',        bar: 'bg-emerald-500', text: 'text-emerald-700' },
  InProgress: { label: 'In Progress', bar: 'bg-blue-500',    text: 'text-blue-700'   },
  Review:     { label: 'Review',      bar: 'bg-violet-500',  text: 'text-violet-700' },
  Todo:       { label: 'To Do',       bar: 'bg-amber-400',   text: 'text-amber-700'  },
  Backlog:    { label: 'Backlog',     bar: 'bg-zinc-300',    text: 'text-zinc-500'   },
};

export function SprintProgressCard({ data, loading }: Props) {
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
        <CardHeader><CardTitle className="text-base">Sprint Progress</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active sprint found.</p>
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
            <CardTitle className="text-base">Sprint Progress</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {data.name ?? `Sprint #${data.iterationId}`}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              data.status === 'Active'
                ? 'shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'shrink-0 bg-zinc-100 text-zinc-600 border-zinc-200'
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
            <span className="text-4xl font-bold text-zinc-900">{pct}</span>
            <span className="text-xl font-bold text-zinc-400">%</span>
          </div>
          <div className="text-right text-sm">
            <span className="font-semibold text-zinc-800">{data.completedPoints}</span>
            <span className="text-zinc-400"> / {data.totalPoints} pts</span>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Status stacked bar + legend */}
        {totalItems > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Items by status
            </p>
            <div className="flex h-2 w-full rounded-full overflow-hidden gap-px bg-zinc-100">
              {statusEntries.map(([status, count]) => {
                const cfg = STATUS_CONFIG[status] ?? { bar: 'bg-zinc-300' };
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
                const cfg = STATUS_CONFIG[status] ?? { label: status, bar: 'bg-zinc-300', text: 'text-zinc-500' };
                return (
                  <div key={status} className="flex items-center gap-1.5 text-xs">
                    <span className={`inline-block h-2 w-2 rounded-sm ${cfg.bar}`} />
                    <span className={cfg.text}>{cfg.label}</span>
                    <span className="text-zinc-400">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex justify-between text-xs text-zinc-400 border-t border-zinc-100 pt-3">
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
