import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/context/ThemeContext';
import type { VelocityData } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  data: VelocityData | null;
  loading: boolean;
  highlightIterationId?: number | null;
}

export function VelocityChart({ data, loading, highlightIterationId }: Props) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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
  const avg = data ? Math.round(data.averageVelocity * 10) / 10 : 0;

  const chartData = (data?.sprints ?? []).map((s) => ({
    name: s.name ?? `#${s.iterationId}`,
    iterationId: s.iterationId,
    status: s.status,
    isActive: s.status === 'Active',
    Planned: s.plannedPoints,
    Completed: s.completedPoints,
  }));

  const hasActiveSprint = chartData.some((s) => s.isActive);

  const colors = {
    planned: isDark ? '#b7b7c1' : '#d4d4d8',
    plannedActive: isDark ? '#8f8f99' : '#a1a1aa',
    completed: isDark ? '#ffffff' : '#52525b',
    completedActive: isDark ? '#a1a1aa' : '#18181b',
    tick: 'var(--muted-foreground)',
    grid: 'var(--border)',
    tooltipBg: 'var(--popover)',
    tooltipText: isDark ? '#ffffff' : 'var(--popover-foreground)',
    cursor: 'var(--accent)',
  };

  // Pattern fills used for in-progress (Active) sprints — same base color
  // as completed sprints but with diagonal stripes so they are visually distinct.
  const plannedPatternId = 'velocity-planned-stripes';
  const completedPatternId = 'velocity-completed-stripes';

  const fillFor = (entry: { iterationId: number; isActive: boolean }, kind: 'Planned' | 'Completed') => {
    const isHighlighted = entry.iterationId === highlightIterationId;
    if (entry.isActive) {
      return kind === 'Planned' ? `url(#${plannedPatternId})` : `url(#${completedPatternId})`;
    }
    if (kind === 'Planned') {
      return isHighlighted ? colors.plannedActive : colors.planned;
    }
    return isHighlighted ? colors.completedActive : colors.completed;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{t('metrics.velocity')}</CardTitle>
            <CardDescription className="mt-0.5">{t('metrics.velocityDescription')}</CardDescription>
          </div>
          {hasData && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-foreground">{avg}</p>
              <p className="text-xs text-muted-foreground">{t('metrics.points')}</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
            {t('metrics.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <defs>
                {/* Diagonal-stripe patterns mark sprints that are still in progress */}
                <pattern
                  id={plannedPatternId}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill={colors.planned} />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={colors.completed} strokeWidth="2" strokeOpacity="0.55" />
                </pattern>
                <pattern
                  id={completedPatternId}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill={colors.completed} />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={colors.planned} strokeWidth="2" strokeOpacity="0.7" />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 13) + '…' : v}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: colors.cursor }}
                contentStyle={{
                  borderRadius: '8px',
                  border: `1px solid ${colors.grid}`,
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  backgroundColor: colors.tooltipBg,
                  color: colors.tooltipText,
                }}
                labelStyle={{ color: colors.tooltipText }}
                itemStyle={{ color: colors.tooltipText }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12, color: colors.tick }}
                content={() => (
                  <div className="mt-3 flex items-center justify-center gap-4 text-xs flex-wrap" style={{ color: colors.tick }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: colors.planned }} />
                      {t('metrics.committed')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: colors.completed }} />
                      {t('metrics.completed')}
                    </span>
                    {hasActiveSprint && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-sm"
                          style={{
                            backgroundImage: `repeating-linear-gradient(45deg, ${colors.completed} 0 2px, ${colors.planned} 2px 4px)`,
                          }}
                        />
                        {t('metrics.inProgress')}
                      </span>
                    )}
                  </div>
                )}
              />
              {/* Average velocity reference line */}
              {avg > 0 && (
                <ReferenceLine
                  y={avg}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  label={{
                    value: `Avg ${avg}`,
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: '#f59e0b',
                  }}
                />
              )}
              <Bar dataKey="Planned" name="Planned" radius={[3, 3, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.iterationId}
                    fill={fillFor(entry, 'Planned')}
                  />
                ))}
              </Bar>
              <Bar dataKey="Completed" name="Completed" radius={[3, 3, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.iterationId}
                    fill={fillFor(entry, 'Completed')}
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
