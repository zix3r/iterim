import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { createFeedback, type FeedbackReason } from '@/lib/api';

const REASONS: FeedbackReason[] = [
  'MissingFunctionality',
  'EasyToGetLost',
  'DifficultToStart',
  'MissingIntegration',
  'NotVisuallyAppealing',
  'NotUpToStandards',
  'TooExpensive',
  'Other',
  'UnmentionedFlaw',
];

export function FeedbackPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [sprintsUsed, setSprintsUsed] = useState('');
  const [overallRating, setOverallRating] = useState<number>(0);
  const [wasSatisfied, setWasSatisfied] = useState<boolean | null>(null);
  const [reasons, setReasons] = useState<Set<FeedbackReason>>(new Set());
  const [missedFunctionalities, setMissedFunctionalities] = useState('');
  const [hardestToFind, setHardestToFind] = useState('');
  const [daysToGetUsedTo, setDaysToGetUsedTo] = useState('');
  const [missedIntegrations, setMissedIntegrations] = useState('');
  const [acceptablePrice, setAcceptablePrice] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [unmentionedFlaw, setUnmentionedFlaw] = useState('');
  const [mostUsefulFeature, setMostUsefulFeature] = useState('');
  const [encounteredBugs, setEncounteredBugs] = useState<boolean | null>(null);
  const [bugContext, setBugContext] = useState('');
  const [wouldTryAgain, setWouldTryAgain] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleReason = (r: FeedbackReason) => {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  const isValid =
    sprintsUsed !== '' &&
    Number(sprintsUsed) >= 0 &&
    overallRating >= 1 &&
    overallRating <= 5 &&
    wasSatisfied !== null &&
    (wasSatisfied === true || reasons.size > 0) &&
    encounteredBugs !== null &&
    wouldTryAgain !== null;

  const handleSubmit = async () => {
    if (!isValid) {
      toast({ variant: 'warning', title: t('feedback.validationError') });
      return;
    }

    setIsSubmitting(true);
    try {
      await createFeedback({
        language,
        sprintsUsed: Number(sprintsUsed),
        overallRating,
        wasSatisfied: wasSatisfied!,
        dissatisfactionReasons: wasSatisfied ? [] : Array.from(reasons),
        missedFunctionalities: reasons.has('MissingFunctionality') ? missedFunctionalities || undefined : undefined,
        hardestToFind: reasons.has('EasyToGetLost') ? hardestToFind || undefined : undefined,
        daysToGetUsedTo: reasons.has('DifficultToStart') && daysToGetUsedTo ? Number(daysToGetUsedTo) : undefined,
        missedIntegrations: reasons.has('MissingIntegration') ? missedIntegrations || undefined : undefined,
        acceptableMonthlyPricePerUser:
          reasons.has('TooExpensive') && acceptablePrice ? Number(acceptablePrice) : undefined,
        otherReasonDescription: reasons.has('Other') ? otherReason || undefined : undefined,
        unmentionedFlawDescription: reasons.has('UnmentionedFlaw') ? unmentionedFlaw || undefined : undefined,
        mostUsefulFeature: mostUsefulFeature || undefined,
        encounteredBugs: encounteredBugs!,
        bugContext: encounteredBugs ? bugContext || undefined : undefined,
        wouldTryAgain: wouldTryAgain!,
      });

      toast({ variant: 'success', title: t('feedback.successToast') });
      navigate('/dashboard');
    } catch (err) {
      toast({
        variant: 'error',
        title: t('feedback.errorToast'),
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('feedback.headerTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('feedback.headerSubtitle')}</p>
      </div>

      {/* Usage + rating */}
      <Card>
        <CardHeader>
          <CardTitle>{t('feedback.section.usage')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              {t('feedback.field.sprintsUsed')} <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min={0}
              max={1000}
              placeholder={t('feedback.field.sprintsUsedHint')}
              value={sprintsUsed}
              onChange={(e) => setSprintsUsed(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              {t('feedback.field.overallRating')} <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setOverallRating(n)}
                  className={cn(
                    'p-1 transition-colors',
                    n <= overallRating ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-300',
                  )}
                  aria-label={`${n} stars`}
                >
                  <Star className="h-7 w-7" fill={n <= overallRating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle>{t('feedback.section.satisfaction')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              {t('feedback.field.wasSatisfied')} <span className="text-destructive">*</span>
            </label>
            <YesNoToggle value={wasSatisfied} onChange={setWasSatisfied} t={t} />
          </div>

          {wasSatisfied === false && (
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('feedback.field.dissatisfactionReasons')} <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors',
                      reasons.has(r)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={reasons.has(r)}
                      onChange={() => toggleReason(r)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{t(`feedback.reason.${r}` as const)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-ups — only shown when relevant reason selected */}
      {wasSatisfied === false && reasons.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('feedback.section.followUps')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reasons.has('MissingFunctionality') && (
              <FollowUpText
                label={t('feedback.field.missedFunctionalities')}
                value={missedFunctionalities}
                onChange={setMissedFunctionalities}
              />
            )}
            {reasons.has('EasyToGetLost') && (
              <FollowUpText
                label={t('feedback.field.hardestToFind')}
                value={hardestToFind}
                onChange={setHardestToFind}
              />
            )}
            {reasons.has('DifficultToStart') && (
              <div>
                <label className="text-sm font-medium block mb-1">
                  {t('feedback.field.daysToGetUsedTo')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={daysToGetUsedTo}
                  onChange={(e) => setDaysToGetUsedTo(e.target.value)}
                />
              </div>
            )}
            {reasons.has('MissingIntegration') && (
              <FollowUpText
                label={t('feedback.field.missedIntegrations')}
                value={missedIntegrations}
                onChange={setMissedIntegrations}
              />
            )}
            {reasons.has('TooExpensive') && (
              <div>
                <label className="text-sm font-medium block mb-1">
                  {t('feedback.field.acceptablePrice')}
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={t('feedback.field.acceptablePriceHint')}
                  value={acceptablePrice}
                  onChange={(e) => setAcceptablePrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('feedback.field.acceptablePriceHint')}
                </p>
              </div>
            )}
            {reasons.has('Other') && (
              <FollowUpText
                label={t('feedback.field.otherReason')}
                value={otherReason}
                onChange={setOtherReason}
              />
            )}
            {reasons.has('UnmentionedFlaw') && (
              <FollowUpText
                label={t('feedback.field.unmentionedFlaw')}
                value={unmentionedFlaw}
                onChange={setUnmentionedFlaw}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Most useful feature */}
      <Card>
        <CardHeader>
          <CardTitle>{t('feedback.section.usefulFeature')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={mostUsefulFeature}
            onChange={(e) => setMostUsefulFeature(e.target.value)}
            placeholder={t('feedback.field.mostUsefulFeature')}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Bugs */}
      <Card>
        <CardHeader>
          <CardTitle>{t('feedback.section.bugs')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              {t('feedback.field.encounteredBugs')} <span className="text-destructive">*</span>
            </label>
            <YesNoToggle value={encounteredBugs} onChange={setEncounteredBugs} t={t} />
          </div>

          {encounteredBugs === true && (
            <FollowUpText
              label={t('feedback.field.bugContext')}
              value={bugContext}
              onChange={setBugContext}
            />
          )}
        </CardContent>
      </Card>

      {/* Future */}
      <Card>
        <CardHeader>
          <CardTitle>{t('feedback.section.future')}</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="text-sm font-medium block mb-2">
            {t('feedback.field.wouldTryAgain')} <span className="text-destructive">*</span>
          </label>
          <YesNoToggle value={wouldTryAgain} onChange={setWouldTryAgain} t={t} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate('/dashboard')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !isValid} className="gap-2">
          <Send className="h-4 w-4" />
          {isSubmitting ? t('feedback.submitting') : t('feedback.submit')}
        </Button>
      </div>
    </div>
  );
}

// ── Small helpers ───────────────────────────────────────

interface YesNoToggleProps {
  value: boolean | null;
  onChange: (v: boolean) => void;
  t: (k: 'feedback.yes' | 'feedback.no') => string;
}

function YesNoToggle({ value, onChange, t }: YesNoToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'px-4 py-2 rounded-md border text-sm transition-colors',
          value === true
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:bg-accent',
        )}
      >
        {t('feedback.yes')}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'px-4 py-2 rounded-md border text-sm transition-colors',
          value === false
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:bg-accent',
        )}
      >
        {t('feedback.no')}
      </button>
    </div>
  );
}

function FollowUpText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </div>
  );
}