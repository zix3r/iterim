import { useCallback, useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { FeedbackList } from '@/features/admin/components/FeedbackList';
import { FeedbackSummaryCharts } from '@/features/admin/components/FeedbackSummaryCharts';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import {
  getAdminFeedback,
  getAdminFeedbackSummary,
  type FeedbackItem,
  type FeedbackSummary,
} from '@/lib/api';

type ReviewedFilter = 'all' | 'reviewed' | 'unreviewed';
type SatisfiedFilter = 'all' | 'satisfied' | 'unsatisfied';
type BugFilter = 'all' | 'withBugs' | 'withoutBugs';

export function AdminFeedbackPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [reviewedFilter, setReviewedFilter] = useState<ReviewedFilter>('all');
  const [satisfiedFilter, setSatisfiedFilter] = useState<SatisfiedFilter>('all');
  const [bugFilter, setBugFilter] = useState<BugFilter>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, summaryData] = await Promise.all([
        getAdminFeedback({
          page: 1,
          pageSize: 100,
          reviewed:
            reviewedFilter === 'reviewed' ? true : reviewedFilter === 'unreviewed' ? false : undefined,
          satisfied:
            satisfiedFilter === 'satisfied' ? true : satisfiedFilter === 'unsatisfied' ? false : undefined,
          bugs: bugFilter === 'withBugs' ? true : bugFilter === 'withoutBugs' ? false : undefined,
        }),
        getAdminFeedbackSummary(),
      ]);
      setItems(list.items);
      setSummary(summaryData);
    } finally {
      setIsLoading(false);
    }
  }, [reviewedFilter, satisfiedFilter, bugFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t('feedback.admin.title')}</h2>
        </div>

        {isLoading && !summary ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            {summary && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <Kpi label={t('feedback.admin.summary.total')} value={summary.totalCount} />
                  <Kpi
                    label={t('feedback.admin.summary.reviewed')}
                    value={`${summary.reviewedCount}/${summary.totalCount}`}
                  />
                  <Kpi
                    label={t('feedback.admin.summary.avgRating')}
                    value={summary.totalCount > 0 ? summary.averageRating.toFixed(1) : '—'}
                  />
                  <Kpi
                    label={t('feedback.admin.summary.avgSprints')}
                    value={summary.totalCount > 0 ? summary.averageSprintsUsed.toFixed(1) : '—'}
                  />
                  <Kpi
                    label={t('feedback.admin.summary.satisfied')}
                    value={pct(summary.satisfiedCount, summary.totalCount)}
                  />
                  <Kpi
                    label={t('feedback.admin.summary.wouldTryAgain')}
                    value={pct(summary.wouldTryAgainCount, summary.totalCount)}
                  />
                  <Kpi
                    label={t('feedback.admin.summary.bugs')}
                    value={pct(summary.encounteredBugsCount, summary.totalCount)}
                  />
                </div>

                {summary.totalCount > 0 && <FeedbackSummaryCharts summary={summary} />}
              </>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={reviewedFilter === 'all'}
                onClick={() => setReviewedFilter('all')}
                label={t('feedback.admin.filter.all')}
              />
              <FilterChip
                active={reviewedFilter === 'reviewed'}
                onClick={() => setReviewedFilter('reviewed')}
                label={t('feedback.admin.filter.reviewed')}
              />
              <FilterChip
                active={reviewedFilter === 'unreviewed'}
                onClick={() => setReviewedFilter('unreviewed')}
                label={t('feedback.admin.filter.unreviewed')}
              />
              <div className="w-px bg-border mx-1" />
              <FilterChip
                active={satisfiedFilter === 'satisfied'}
                onClick={() =>
                  setSatisfiedFilter(satisfiedFilter === 'satisfied' ? 'all' : 'satisfied')
                }
                label={t('feedback.admin.filter.satisfied')}
              />
              <FilterChip
                active={satisfiedFilter === 'unsatisfied'}
                onClick={() =>
                  setSatisfiedFilter(satisfiedFilter === 'unsatisfied' ? 'all' : 'unsatisfied')
                }
                label={t('feedback.admin.filter.unsatisfied')}
              />
              <div className="w-px bg-border mx-1" />
              <FilterChip
                active={bugFilter === 'withBugs'}
                onClick={() => setBugFilter(bugFilter === 'withBugs' ? 'all' : 'withBugs')}
                label={t('feedback.admin.filter.withBugs')}
              />
              <FilterChip
                active={bugFilter === 'withoutBugs'}
                onClick={() => setBugFilter(bugFilter === 'withoutBugs' ? 'all' : 'withoutBugs')}
                label={t('feedback.admin.filter.withoutBugs')}
              />
            </div>

            <FeedbackList items={items} onChanged={load} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-foreground text-background border-foreground'
          : 'bg-background text-muted-foreground border-border hover:bg-accent',
      )}
    >
      {label}
    </button>
  );
}

function pct(n: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((n / total) * 100)}%`;
}