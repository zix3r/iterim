import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VelocityData } from '@/lib/api';

interface Props {
  data: VelocityData | null;
  loading: boolean;
  highlightIterationId?: number | null;
}

export function VelocityChart({ data, loading, highlightIterationId }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  const hasData = data && data.sprints.length > 0;

  const chartData = (data?.sprints ?? []).map((s) => ({
    name: s.name ?? `#${s.iterationId}`,
    iterationId: s.iterationId,
    Planned: s.plannedPoints,
    Completed: s.completedPoints,
  }));

  const avg = data?.averageVelocity ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Velocity</CardTitle>
            <CardDescription className="mt-0.5">Planned vs completed points per iteration</CardDescription>
          </div>
          {hasData && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-zinc-900">{avg}</p>
              <p className="text-xs text-muted-foreground">avg pts / iteration</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
            No completed iterations yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 13) + '…' : v}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: '#f4f4f5' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e4e4e7',
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              {/* Average velocity reference line */}
              {avg > 0 && (
                <ReferenceLine
                  y={avg}
                  stroke="#f59e0b"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Avg ${avg}`,
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: '#f59e0b',
                  }}
                />
              )}
              <Bar dataKey="Planned" name="Planned" fill="#d4d4d8" radius={[3, 3, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.iterationId}
                    fill={entry.iterationId === highlightIterationId ? '#a1a1aa' : '#d4d4d8'}
                  />
                ))}
              </Bar>
              <Bar dataKey="Completed" name="Completed" fill="#18181b" radius={[3, 3, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.iterationId}
                    fill={entry.iterationId === highlightIterationId ? '#18181b' : '#52525b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
