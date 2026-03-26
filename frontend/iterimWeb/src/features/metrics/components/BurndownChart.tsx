import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SprintMetrics } from '@/lib/api';

interface Props {
  data: SprintMetrics | null;
  loading: boolean;
}

export function BurndownChart({ data, loading }: Props) {
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
              <span className="text-zinc-400">(dashed = ideal, solid = actual)</span>
            </CardDescription>
          </div>
          {data && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-zinc-900">{data.remainingPoints}</p>
              <p className="text-xs text-muted-foreground">pts remaining</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-56 gap-2">
            <p className="text-sm text-muted-foreground">No burndown data yet.</p>
            <p className="text-xs text-zinc-400 text-center max-w-xs">
              Burndown is built from work item status change history.
              Move items to <strong>Done</strong> during the iteration to see the chart fill in.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e4e4e7',
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                formatter={(value: unknown, name: unknown) => [`${value} pts`, String(name)]}
              />
              <Legend
                iconType="plainline"
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              {/* Ideal: dashed grey */}
              <Line
                type="linear"
                dataKey="Ideal"
                stroke="#d4d4d8"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={false}
              />
              {/* Actual: solid dark */}
              <Line
                type="monotone"
                dataKey="Actual"
                stroke="#18181b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#18181b' }}
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

