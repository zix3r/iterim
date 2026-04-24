import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/context/ThemeContext';
import type { SprintMetrics } from '@/lib/api';

interface Props {
  data: SprintMetrics | null;
  loading: boolean;
}

export function BurndownChart({ data, loading }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-52 mt-1" />
        </CardHeader>
        <CardContent><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  // Filter out burndown points that have no meaningful data
  const burndownPoints = (data?.burndown ?? []).filter(
    (p) => p.remainingPoints > 0 || p.idealPoints > 0
  );

  const hasData = burndownPoints.length > 0;

  const colors = {
    ideal: isDark ? '#b7b7c1' : '#c4c4ce',
    actual: isDark ? '#ffffff' : '#18181b',
    tick: 'var(--muted-foreground)',
    grid: 'var(--border)',
    tooltipBg: 'var(--popover)',
    tooltipText: 'var(--popover-foreground)',
  };

  const chartData = burndownPoints.map((p) => ({
    date: fmtDay(p.date),
    'Actual': p.remainingPoints,
    'Ideal': p.idealPoints,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Burndown</CardTitle>
            <CardDescription className="mt-0.5">
              Remaining points per day {' '}
              <span className="text-muted-foreground">(dashed = ideal, solid = actual)</span>
            </CardDescription>
          </div>
          {data && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-foreground">{data.remainingPoints}</p>
              <p className="text-xs text-muted-foreground">pts remaining</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-56 gap-2">
            <p className="text-sm text-muted-foreground">No burndown data yet.</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Burndown is built from work item status change history.
              Move items to <strong>Done</strong> during the iteration to see the chart fill in.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: `1px solid ${colors.grid}`,
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  backgroundColor: colors.tooltipBg,
                  color: colors.tooltipText,
                }}
                formatter={(value: unknown, name: unknown) => [`${value} pts`, String(name)]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12, color: colors.tick }}
                content={() => (
                  <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: colors.tick }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-0.5 w-3" style={{ backgroundColor: colors.ideal }} />
                      Ideal
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-0.5 w-3" style={{ backgroundColor: colors.actual }} />
                      Actual
                    </span>
                  </div>
                )}
              />
              {/* Ideal: dashed grey */}
              <Line
                type="linear"
                dataKey="Ideal"
                stroke={colors.ideal}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={false}
              />
              {/* Actual: solid dark */}
              <Line
                type="monotone"
                dataKey="Actual"
                stroke={colors.actual}
                strokeWidth={2}
                dot={{ r: 3, fill: colors.actual }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

