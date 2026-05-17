import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { toggleFeedbackReviewed, type FeedbackItem } from '@/lib/api';

interface Props {
  items: FeedbackItem[];
  onChanged: () => void;
}

export function FeedbackList({ items, onChanged }: Props) {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">{t('feedback.admin.empty')}</p>
      </Card>
    );
  }

  const handleToggle = async (id: number) => {
    setBusyId(id);
    try {
      await toggleFeedbackReviewed(id);
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <Card key={item.id} className={cn('overflow-hidden', item.isReviewed && 'opacity-70')}>
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full text-left p-4 hover:bg-accent/30 transition-colors flex items-center gap-3"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{item.userName}</span>
                  <span className="text-xs text-muted-foreground">{item.userEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          'h-3 w-3',
                          n <= item.overallRating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/40',
                        )}
                      />
                    ))}
                  </span>
                  <span>{item.sprintsUsed} sprints</span>
                  <span className={item.wasSatisfied ? 'text-green-600' : 'text-red-600'}>
                    {item.wasSatisfied ? '✓ satisfied' : '✗ unsatisfied'}
                  </span>
                  {item.encounteredBugs && <span className="text-orange-500">bugs</span>}
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>

              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full shrink-0',
                  item.isReviewed
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
                )}
              >
                {item.isReviewed ? t('feedback.admin.filter.reviewed') : t('feedback.admin.filter.unreviewed')}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-3 text-sm">
                {!item.wasSatisfied && item.dissatisfactionReasons.length > 0 && (
                  <Field label={t('feedback.field.dissatisfactionReasons')}>
                    <div className="flex flex-wrap gap-1">
                      {item.dissatisfactionReasons.map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded bg-muted">
                          {t(`feedback.reason.${r}` as TranslationKey)}
                        </span>
                      ))}
                    </div>
                  </Field>
                )}
                {item.missedFunctionalities && (
                  <Field label={t('feedback.field.missedFunctionalities')}>{item.missedFunctionalities}</Field>
                )}
                {item.hardestToFind && (
                  <Field label={t('feedback.field.hardestToFind')}>{item.hardestToFind}</Field>
                )}
                {item.daysToGetUsedTo !== null && item.daysToGetUsedTo !== undefined && (
                  <Field label={t('feedback.field.daysToGetUsedTo')}>{item.daysToGetUsedTo}</Field>
                )}
                {item.missedIntegrations && (
                  <Field label={t('feedback.field.missedIntegrations')}>{item.missedIntegrations}</Field>
                )}
                {item.acceptableMonthlyPricePerUser !== null &&
                  item.acceptableMonthlyPricePerUser !== undefined && (
                    <Field label={t('feedback.field.acceptablePrice')}>
                      {item.acceptableMonthlyPricePerUser} EUR/mo/user
                    </Field>
                  )}
                {item.otherReasonDescription && (
                  <Field label={t('feedback.field.otherReason')}>{item.otherReasonDescription}</Field>
                )}
                {item.unmentionedFlawDescription && (
                  <Field label={t('feedback.field.unmentionedFlaw')}>{item.unmentionedFlawDescription}</Field>
                )}
                {item.mostUsefulFeature && (
                  <Field label={t('feedback.field.mostUsefulFeature')}>{item.mostUsefulFeature}</Field>
                )}
                {item.encounteredBugs && item.bugContext && (
                  <Field label={t('feedback.field.bugContext')}>{item.bugContext}</Field>
                )}
                <Field label={t('feedback.field.wouldTryAgain')}>
                  {item.wouldTryAgain ? t('feedback.yes') : t('feedback.no')}
                </Field>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {item.isReviewed && item.reviewedByUserName
                      ? `${t('feedback.admin.reviewedBy')}: ${item.reviewedByUserName} · ${
                          item.reviewedAt ? formatDate(item.reviewedAt) : ''
                        }`
                      : ''}
                  </span>
                  <Button
                    size="sm"
                    variant={item.isReviewed ? 'outline' : 'default'}
                    onClick={() => handleToggle(item.id)}
                    disabled={busyId === item.id}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {item.isReviewed ? t('feedback.admin.markUnreviewed') : t('feedback.admin.markReviewed')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}