import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import type { FeedbackSummary } from '@/lib/api';

interface Props {
    summary: FeedbackSummary;
}

const SATISFACTION_COLORS = ['#22c55e', '#ef4444']; // green, red

export function FeedbackSummaryCharts({ summary }: Props) {
    const { t } = useLanguage();

    const satisfactionData = [
        { name: t('feedback.admin.filter.satisfied'), value: summary.satisfiedCount },
        { name: t('feedback.admin.filter.unsatisfied'), value: summary.unsatisfiedCount },
    ];

    const ratingData = [1, 2, 3, 4, 5].map((n) => ({
        rating: `${n}★`,
        count: summary.ratingDistribution[String(n)] ?? 0,
    }));

    const reasonsData = Object.entries(summary.dissatisfactionReasonCounts)
        .map(([reason, count]) => ({
            reason: t(`feedback.reason.${reason}` as TranslationKey),
            count,
        }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('feedback.admin.charts.satisfaction')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={satisfactionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {satisfactionData.map((_, i) => (
                                    <Cell key={i} fill={SATISFACTION_COLORS[i]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                formatter={(value, entry) => {
                                    const payload = entry?.payload as { value?: number } | undefined;
                                    return `${value}: ${payload?.value ?? 0}`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('feedback.admin.charts.ratings')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={ratingData}>
                            <XAxis dataKey="rating" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('feedback.admin.charts.reasons')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {reasonsData.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-12 text-center">—</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={reasonsData} layout="vertical">
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="reason" width={140} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}