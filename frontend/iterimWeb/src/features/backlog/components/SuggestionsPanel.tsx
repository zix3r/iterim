import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Check, CheckCheck, Clock4, Loader2, Sparkles, UserMinus, X,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import {
  applyAtpaSuggestions,
  getAtpaSuggestions,
  patchWorkItemAssignee,
  type AtpaCapacityMember,
  type AtpaSuggestion,
  type AtpaSuggestionsResponse,
  type AtpaUnassignedItem,
  type AtpaWarning,
  type Iteration,
} from '@/lib/api';

// ── i18n helpers for ATPA codes ─────────────────────────────────
//
// Backend returns stable codes (e.g. `REASON_TAG_FULL_MATCH`) plus a
// `messageParams` / `reasonParams` dictionary for placeholders. The FE
// strips the `REASON_` / `UNASSIGNED_` prefix and looks up the i18n key
// (`atpa.reason.<X>`, `atpa.unassignedReason.<X>`, `atpa.code.<X>`),
// then interpolates `{name}`-style placeholders. If the code is unknown
// or the FE has no translation, it falls back to the backend's plain
// English `message` / `reason` so nothing renders empty.
type Tx = (k: TranslationKey) => string;

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(params, k) ? params[k] : `{${k}}`,
  );
}

/** Translate a single backend code under a given i18n namespace. */
function translateCode(
  t: Tx,
  namespace: 'reason' | 'unassignedReason' | 'code',
  rawCode: string,
  params?: Record<string, string>,
  fallback?: string,
): string {
  // Strip the conventional prefix the backend uses (`REASON_X` → `X`).
  const stripped = rawCode
    .replace(/^REASON_/, '')
    .replace(/^UNASSIGNED_/, '');
  const key = `atpa.${namespace}.${stripped}` as TranslationKey;
  const raw = t(key);
  // `t()` returns the key itself if no translation is found; fall back to the
  // backend-provided English text in that case.
  if (raw === key) return fallback ?? raw;
  return interpolate(raw, params);
}

function formatReason(s: AtpaSuggestion, t: Tx): string {
  const codes = s.reasonCodes ?? [];
  if (codes.length === 0) return s.reason ?? '';
  return codes
    .map((c) => translateCode(t, 'reason', c, s.reasonParams, s.reason))
    .filter(Boolean)
    .join('; ');
}

function formatWarning(w: AtpaWarning, t: Tx): string {
  return translateCode(t, 'code', w.code, w.messageParams, w.message);
}

function formatUnassignedReason(it: AtpaUnassignedItem, t: Tx): string {
  if (!it.reasonCode) return it.reason ?? '';
  return translateCode(t, 'unassignedReason', it.reasonCode, it.reasonParams, it.reason);
}

interface Props {
  iteration: Iteration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tėvinis komponentas turi perkrauti backlog'ą po sėkmingo pritaikymo. */
  onApplied?: (workItemIds: number[]) => void;
}

/**
 * Slide-over (Sheet) panel'is, rodantis ATPA siūlomus priskyrimus.
 *
 * Akcentuoja:
 *   - Komandos pajėgumo apžvalgą (per narį) viršuje
 *   - Siūlymų korteles su sutampančiomis žymėmis ir confidence bar
 *   - Įspėjimų ir nepriskirtų elementų sekcijas
 */
export function SuggestionsPanel({ iteration, open, onOpenChange, onApplied }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [data, setData] = useState<AtpaSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Atmesti siūlymai (nepritaikomi `Apply all` metu). */
  const [rejectedIds, setRejectedIds] = useState<Set<number>>(new Set());
  /** Siūlymai, kurie sėkmingai pritaikyti (nebeprivalu rodyti). */
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  /** Siūlymai, kurių pritaikymas vyksta dabar (rodo spinner mygtukuose). */
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [bulkApplying, setBulkApplying] = useState(false);

  const fetchSuggestions = useCallback(
    async (iterId: number) => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await getAtpaSuggestions(iterId);
        setData(res);
        setRejectedIds(new Set());
        setAppliedIds(new Set());
        setPendingIds(new Set());
      } catch (err) {
        const message = err instanceof Error ? err.message : t('atpa.failedLoad');
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (open && iteration?.id) {
      fetchSuggestions(iteration.id);
    }
    if (!open) {
      // Atstatome state, kad kitą kartą atidarius nelikę senų rezultatų.
      setData(null);
      setLoadError(null);
    }
  }, [open, iteration?.id, fetchSuggestions]);

  // ── Filtruojame siūlymus, kuriuos vartotojas dar gali priimti ──
  const actionable: AtpaSuggestion[] = useMemo(() => {
    if (!data) return [];
    return (data.suggestions ?? []).filter(
      (s) => !rejectedIds.has(s.workItemId) && !appliedIds.has(s.workItemId),
    );
  }, [data, rejectedIds, appliedIds]);

  /** Per-member queued (SP + items) iš dar aktyvių siūlymų. */
  const queuedByMember = useMemo(() => {
    const map = new Map<number, { points: number; count: number }>();
    actionable.forEach((s) => {
      const cur = map.get(s.suggestedMemberId) ?? { points: 0, count: 0 };
      cur.points += s.workItemPoints ?? 0;
      cur.count += 1;
      map.set(s.suggestedMemberId, cur);
    });
    return map;
  }, [actionable]);

  // ── Veiksmai ──────────────────────────────────────────────────

  const handleReject = (workItemId: number) => {
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.add(workItemId);
      return next;
    });
  };

  const handleApplyOne = async (s: AtpaSuggestion) => {
    setPendingIds((prev) => new Set(prev).add(s.workItemId));
    try {
      await patchWorkItemAssignee(s.workItemId, s.suggestedMemberId);
      setAppliedIds((prev) => new Set(prev).add(s.workItemId));
      onApplied?.([s.workItemId]);
    } catch (err) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('atpa.failedApply'),
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(s.workItemId);
        return next;
      });
    }
  };

  const handleApplyAll = async () => {
    if (actionable.length === 0) return;
    setBulkApplying(true);
    const picks = actionable.map((s) => ({
      workItemId: s.workItemId,
      assignedTo: s.suggestedMemberId,
    }));
    try {
      const res = await applyAtpaSuggestions(picks);
      setAppliedIds((prev) => {
        const next = new Set(prev);
        res.applied.forEach((a) => next.add(a.workItemId));
        return next;
      });
      onApplied?.(res.applied.map((a) => a.workItemId));

      if (res.failed.length === 0) {
        toast({
          variant: 'success',
          title: t('atpa.appliedToast'),
          description: `${res.applied.length} / ${picks.length}`,
        });
      } else {
        toast({
          variant: 'warning',
          title: t('atpa.partialAppliedToast'),
          description: `${res.applied.length} / ${picks.length}`,
        });
      }
    } finally {
      setBulkApplying(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b px-6 py-5 gap-2">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg">{t('atpa.title')}</SheetTitle>
              <SheetDescription className="text-xs">
                {iteration?.name ?? `Iteration ${iteration?.id ?? ''}`}
                {' · '}
                {t('atpa.subtitle')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body — scrolls independently */}
        <div className="flex-1 overflow-y-auto">
          {loading && <LoadingState />}

          {!loading && loadError && (
            <div className="p-6">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <p className="font-medium">{t('atpa.failedLoad')}</p>
                <p className="text-xs opacity-80 mt-1">{loadError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => iteration?.id && fetchSuggestions(iteration.id)}
                >
                  {t('common.retry')}
                </Button>
              </div>
            </div>
          )}

          {!loading && !loadError && data && (() => {
            // Defensive defaults — backend payload should match FE types but if a
            // mismatch slips in (e.g. older deploy), these prevent the panel from
            // crashing and falling into the global ErrorBoundary.
            const members = data.memberCapacities ?? [];
            const warnings = data.warnings ?? [];
            const suggestions = data.suggestions ?? [];
            const unassigned = data.unassigned ?? [];
            return (
              <>
                <CapacitySummary
                  members={members}
                  queuedByMember={queuedByMember}
                />

                {warnings.length > 0 && <WarningsSection warnings={warnings} />}

                <SuggestionsList
                  suggestions={suggestions}
                  rejectedIds={rejectedIds}
                  appliedIds={appliedIds}
                  pendingIds={pendingIds}
                  onApply={handleApplyOne}
                  onReject={handleReject}
                  disabled={bulkApplying}
                />

                {unassigned.length > 0 && (
                  <UnassignedSection items={unassigned} />
                )}

                {actionable.length === 0 &&
                  unassigned.length === 0 &&
                  warnings.length === 0 && <AllAssignedState />}
              </>
            );
          })()}
        </div>

        {/* Footer with apply-all */}
        {!loading && !loadError && data && (
          <div className="border-t px-6 py-4 flex items-center justify-between gap-3 bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {actionable.length > 0 ? (
                <span>
                  <strong className="text-foreground">{actionable.length}</strong>
                  {' '}
                  {actionable.length === 1 ? 'siūlymas' : 'siūlymai'}
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {t('common.close')}
              </Button>
              <Button
                size="sm"
                onClick={handleApplyAll}
                disabled={actionable.length === 0 || bulkApplying}
              >
                {bulkApplying ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> {t('atpa.applyingAll')}
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" /> {t('atpa.applyAll')} ({actionable.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Sub-componentai ─────────────────────────────────────────────

function LoadingState() {
  const { t } = useLanguage();
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner size="sm" />
        <span>{t('atpa.loading')}</span>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

function AllAssignedState() {
  const { t } = useLanguage();
  return (
    <div className="p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-3">
        <Check className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">{t('atpa.empty')}</p>
      <p className="text-xs text-muted-foreground mt-1">{t('atpa.allAssigned')}</p>
    </div>
  );
}

// ── Capacity summary ───────────────────────────────────────────

const HOURS_PER_SP = 4; // turi atitikti AtpaService.DefaultHoursPerStoryPoint

function CapacitySummary({
  members,
  queuedByMember,
}: {
  members: AtpaCapacityMember[];
  queuedByMember: Map<number, { points: number; count: number }>;
}) {
  const { t } = useLanguage();

  if (members.length === 0) return null;

  return (
    <section className="px-6 pt-5 pb-3">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('atpa.capacity')}
        </h3>
        <div className="text-[10px] text-muted-foreground flex items-center gap-3">
          <span>{t('atpa.capacityBefore')}</span>
          <span className="opacity-30">→</span>
          <span>{t('atpa.capacityAfter')}</span>
        </div>
      </div>
      <ul className="space-y-2">
        {members.map((m) => {
          const queued = queuedByMember.get(m.memberId) ?? { points: 0, count: 0 };

          // backend grąžina baseCapacityHours kaip "norm" (be pravaikštų skaičiavimo).
          // Used = base - available. After = available - queuedHours.
          const total = m.baseCapacityHours;
          const available = m.availableCapacityHours;
          const usedHours = Math.max(0, total - available);
          const queuedHours = queued.points * HOURS_PER_SP;
          const projectedAvail = Math.max(0, available - queuedHours);

          const usedPct = total > 0 ? Math.min(100, Math.round((usedHours / total) * 100)) : 0;
          const projectedPct = total > 0
            ? Math.min(100, Math.round(((total - projectedAvail) / total) * 100))
            : usedPct;

          const overloaded = projectedPct >= 100;

          return (
            <li
              key={m.memberId}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                overloaded
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-transparent bg-muted/40'
              }`}
            >
              <Avatar size="sm">
                <AvatarImage src={m.avatarUrl ?? undefined} alt={m.memberName} />
                <AvatarFallback className="text-[10px] font-semibold">
                  {initials(m.memberName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{m.memberName}</span>
                  <ScheduleBadge schedule={m.scheduleType} weeklyHours={m.weeklyHours} />
                  {queued.count > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{queued.count} {queued.count === 1 ? 'item' : 'items'}
                      {queued.points > 0 ? ` · ${queued.points} SP` : ''}
                    </span>
                  )}
                </div>
                <CapacityBar before={usedPct} after={projectedPct} />
              </div>

              <div className="text-right shrink-0 text-[11px] leading-tight">
                <div className="font-semibold tabular-nums text-foreground">
                  {Math.round(available)}h
                  <span className="opacity-30 mx-1">→</span>
                  <span className={overloaded ? 'text-destructive' : ''}>
                    {Math.round(projectedAvail)}h
                  </span>
                </div>
                <div className="text-muted-foreground">/ {Math.round(total)}h</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CapacityBar({ before, after }: { before: number; after: number }) {
  const projectedColor =
    after >= 100 ? 'bg-destructive' : after >= 85 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="mt-1 relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-muted-foreground/40"
        style={{ width: `${before}%` }}
      />
      <div
        className={`absolute inset-y-0 ${projectedColor} opacity-90`}
        style={{
          left: `${before}%`,
          width: `${Math.max(0, after - before)}%`,
        }}
      />
    </div>
  );
}

function ScheduleBadge({
  schedule,
  weeklyHours,
}: {
  schedule: AtpaCapacityMember['scheduleType'];
  weeklyHours: number;
}) {
  const { t } = useLanguage();
  const label =
    schedule === 'FullTime'
      ? t('atpa.scheduleFullTime')
      : schedule === 'PartTime'
        ? t('atpa.schedulePartTime')
        : t('atpa.scheduleCustom');
  return (
    <Badge
      variant="outline"
      className="text-[9px] px-1.5 py-0 font-normal text-muted-foreground gap-1"
    >
      <Clock4 className="h-2.5 w-2.5" />
      {label} · {weeklyHours}h/w
    </Badge>
  );
}

// ── Warnings ───────────────────────────────────────────────────

function WarningsSection({ warnings }: { warnings: AtpaWarning[] }) {
  const { t } = useLanguage();
  const titleFor = (code: AtpaWarning['code']): string => {
    switch (code) {
      case 'MEMBER_OVERLOADED':
      case 'ALL_MEMBERS_OVERLOADED':
        return t('atpa.warningOverloaded');
      case 'SP_EXCEEDS_CAPACITY':
        return t('atpa.warningOversized');
      case 'NO_TAG_MATCH':
        return t('atpa.warningUnmatched');
      case 'NO_TEAM_MEMBERS':
        return t('atpa.warningNoCapacity');
      default:
        return t('common.unknown');
    }
  };
  return (
    <section className="px-6 py-3 border-t">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {t('atpa.warnings')} ({warnings.length})
      </h3>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs border ${severityClasses(w.severity)}`}
          >
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{titleFor(w.code)}</p>
              <p className="opacity-80 mt-0.5 break-words">{formatWarning(w, t)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function severityClasses(sev: AtpaWarning['severity']): string {
  if (sev === 'warning') {
    return 'border-amber-300/50 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200';
  }
  // 'info'
  return 'border-border bg-muted/40 text-muted-foreground';
}

// ── Suggestions list ──────────────────────────────────────────

function SuggestionsList({
  suggestions,
  rejectedIds,
  appliedIds,
  pendingIds,
  onApply,
  onReject,
  disabled,
}: {
  suggestions: AtpaSuggestion[];
  rejectedIds: Set<number>;
  appliedIds: Set<number>;
  pendingIds: Set<number>;
  onApply: (s: AtpaSuggestion) => void;
  onReject: (id: number) => void;
  disabled: boolean;
}) {
  if (suggestions.length === 0) return null;

  return (
    <section className="px-6 py-3 border-t">
      <ul className="space-y-3">
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.workItemId}
            suggestion={s}
            rejected={rejectedIds.has(s.workItemId)}
            applied={appliedIds.has(s.workItemId)}
            pending={pendingIds.has(s.workItemId)}
            onApply={() => onApply(s)}
            onReject={() => onReject(s.workItemId)}
            disabled={disabled}
          />
        ))}
      </ul>
    </section>
  );
}

function SuggestionCard({
  suggestion: s,
  rejected,
  applied,
  pending,
  onApply,
  onReject,
  disabled,
}: {
  suggestion: AtpaSuggestion;
  rejected: boolean;
  applied: boolean;
  pending: boolean;
  onApply: () => void;
  onReject: () => void;
  disabled: boolean;
}) {
  const { t } = useLanguage();

  // Defensive defaults — backend may omit fields if its build is older than the FE.
  const matchingTags = s.matchingTags ?? [];
  const matchingInferredTags = s.matchingInferredTags ?? [];
  const memberTags = s.memberTags ?? [];
  const memberInferredTags = s.memberInferredTags ?? [];
  const localizedReason = formatReason(s, t);
  const workItemTags = s.workItemTags ?? [];

  const explicitMatchSet = new Set(matchingTags.map((tag) => tag.toLowerCase()));
  const inferredMatchSet = new Set(matchingInferredTags.map((tag) => tag.toLowerCase()));
  // For member-side rendering — combine both explicit + inferred owned tags.
  const memberOwnedTags = [...memberTags, ...memberInferredTags];
  const inferredOwnedSet = new Set(memberInferredTags.map((tag) => tag.toLowerCase()));

  const cardState = applied
    ? 'opacity-60 border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-500/5'
    : rejected
      ? 'opacity-50 border-dashed'
      : '';

  return (
    <li
      className={`rounded-lg border p-3 transition-all ${cardState}`}
      data-applied={applied || undefined}
      data-rejected={rejected || undefined}
    >
      <div className="flex items-start gap-3">
        {/* LEFT — work item */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <TypeChip type={s.workItemType} />
            <span className="text-sm font-medium truncate">{s.workItemTitle}</span>
            {s.workItemPoints != null && s.workItemPoints > 0 && (
              <span className="text-[11px] font-mono font-semibold bg-secondary/60 px-1.5 py-0.5 rounded">
                {s.workItemPoints} SP
              </span>
            )}
          </div>
          <TagRow
            tags={workItemTags}
            explicitMatch={explicitMatchSet}
            inferredMatch={inferredMatchSet}
          />
        </div>

        {/* MIDDLE — suggested member */}
        <div className="flex flex-col items-center gap-1 shrink-0 px-2 border-l border-r border-dashed">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {t('atpa.suggestedFor')}
          </span>
          <Avatar size="sm">
            <AvatarImage src={s.memberAvatarUrl ?? undefined} alt={s.memberName} />
            <AvatarFallback className="text-[10px] font-semibold">
              {initials(s.memberName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-medium text-center max-w-[100px] truncate">
            {s.memberName}
          </span>
          <TagRow
            tags={memberOwnedTags}
            explicitMatch={explicitMatchSet}
            inferredMatch={inferredMatchSet}
            inferredOwned={inferredOwnedSet}
            compact
          />
        </div>

        {/* RIGHT — actions */}
        <div className="flex flex-col items-stretch gap-1.5 shrink-0 w-24">
          <Button
            size="xs"
            variant="default"
            disabled={disabled || pending || applied || rejected}
            onClick={onApply}
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : applied ? (
              <Check className="h-3 w-3" />
            ) : (
              <>
                <Check className="h-3 w-3" /> {t('atpa.apply')}
              </>
            )}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={disabled || pending || applied || rejected}
            onClick={onReject}
          >
            <X className="h-3 w-3" /> {t('atpa.reject')}
          </Button>
        </div>
      </div>

      {/* Confidence + reason */}
      <div className="mt-2 pl-1 flex items-center gap-3 text-[11px] text-muted-foreground">
        <ConfidenceBar value={s.confidence} />
        <span className="truncate flex-1" title={localizedReason}>
          {localizedReason}
        </span>
      </div>
    </li>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const { t } = useLanguage();
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500';
  const labelColor =
    pct >= 80 ? 'text-emerald-700 dark:text-emerald-300' :
    pct >= 50 ? 'text-amber-700 dark:text-amber-300' :
    'text-red-700 dark:text-red-300';
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[9px] uppercase tracking-wider opacity-70">
        {t('atpa.confidence')}
      </span>
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-semibold tabular-nums ${labelColor}`}>{pct}%</span>
    </div>
  );
}

function TagRow({
  tags,
  explicitMatch,
  inferredMatch,
  inferredOwned,
  compact = false,
}: {
  tags: string[];
  /** Lowercase tag names matched via explicit member tags — strongest highlight. */
  explicitMatch: Set<string>;
  /** Lowercase tag names matched via inferred history — softer highlight. */
  inferredMatch: Set<string>;
  /**
   * (Member-side only) Lowercase tag names the member owns via inference, not
   * via explicit assignment — rendered with a dashed outline to flag "learned".
   */
  inferredOwned?: Set<string>;
  compact?: boolean;
}) {
  if (tags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'justify-center' : ''}`}>
      {tags.map((tag) => {
        const lower = tag.toLowerCase();
        const isExplicitMatch = explicitMatch.has(lower);
        const isInferredMatch = inferredMatch.has(lower);
        const isInferredOwned = inferredOwned?.has(lower) ?? false;

        // Visual hierarchy:
        //   1. Explicit match  → solid primary fill
        //   2. Inferred match  → primary fill + dashed outline (learned-from-history match)
        //   3. Inferred-owned  → dashed muted (member learned this tag, but item doesn't have it)
        //   4. Plain           → muted
        let cls = 'bg-muted text-muted-foreground opacity-70';
        let title: string | undefined;
        if (isExplicitMatch) {
          cls = 'bg-primary text-primary-foreground ring-2 ring-primary/40';
          title = 'matching tag (explicit)';
        } else if (isInferredMatch) {
          cls = 'bg-primary/70 text-primary-foreground border border-dashed border-primary';
          title = 'matching via member history';
        } else if (isInferredOwned) {
          cls = 'bg-muted text-foreground/70 border border-dashed border-muted-foreground/40';
          title = 'inferred from history';
        }

        return (
          <span
            key={tag}
            className={`inline-flex text-[9px] px-1.5 py-0 rounded-full font-medium ${cls}`}
            title={title}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}

function TypeChip({ type }: { type: string }) {
  const cls =
    type === 'Story'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
      : type === 'Bug'
        ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${cls}`}>
      {type}
    </span>
  );
}

// ── Unassigned items ──────────────────────────────────────────

function UnassignedSection({ items }: { items: AtpaUnassignedItem[] }) {
  const { t } = useLanguage();
  return (
    <section className="px-6 py-3 border-t">
      <div className="flex items-center gap-2 mb-2">
        <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('atpa.unassigned')} ({items.length})
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{t('atpa.unassignedHint')}</p>
      <ul className="space-y-1">
        {items.map((it) => {
          const localizedReason = formatUnassignedReason(it, t);
          return (
            <li
              key={it.workItemId}
              className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30 text-xs"
            >
              <span className="font-medium truncate flex-1">{it.workItemTitle}</span>
              {it.workItemPoints > 0 && (
                <span className="text-[10px] font-mono bg-secondary/50 px-1.5 py-0.5 rounded shrink-0">
                  {it.workItemPoints} SP
                </span>
              )}
              {localizedReason && (
                <span
                  className="text-[10px] text-muted-foreground italic truncate max-w-[60%] hidden sm:inline"
                  title={localizedReason}
                >
                  {localizedReason}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}