import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AlertCircle, ArrowLeft, Lightbulb, Lock, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { addRecentPage } from '@/lib/recentPages';
import {
  createRetroItem,
  deleteRetroItem,
  getRetroBoard,
  toggleRetroVote,
  updateRetroItem,
  type RetroBoard,
  type RetroColumnName,
  type RetroItem,
} from '@/lib/api';
import { RetroColumn } from '../components/RetroColumn';

/**
 * Iteration retrospective page.
 *
 *   /org/:orgId/products/:productId/teams/:teamId/iterations/:iterationId/retro
 *
 * Loads the board once on mount, then mutates state in-place after each
 * action to avoid unnecessary refetches. Vote toggles use optimistic UI —
 * we update the local card first and roll back on error.
 *
 * Read-only mode (`board.isReadOnly`) is driven by the iteration's status
 * on the server; the FE only mirrors that flag into the UI.
 */
export function RetroPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { orgId, productId, teamId, iterationId } = useParams();

  const tid = Number(teamId);
  const iid = Number(iterationId);

  const [board, setBoard] = useState<RetroBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRetroBoard(tid, iid);
      setBoard(data);
    } catch (err) {
      console.error('Failed to load retro board', err);
      setError(err instanceof Error ? err.message : t('retro.failedLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [tid, iid, t]);

  useEffect(() => {
    if (Number.isFinite(tid) && Number.isFinite(iid)) {
      loadBoard();
    }
  }, [tid, iid, loadBoard]);

  // Track in recent pages once we know the iteration name.
  useEffect(() => {
    if (board && orgId && productId && teamId && iterationId) {
      addRecentPage({
        path: `/org/${orgId}/products/${productId}/teams/${teamId}/iterations/${iterationId}/retro`,
        label: `${board.iterationName ?? `Iteration ${board.iterationId}`} — ${t('retro.title')}`,
        iconType: 'Team',
      });
    }
  }, [board, orgId, productId, teamId, iterationId, t]);

  // Group + sort: backend already orders by votes desc, but we re-sort defensively.
  const grouped = useMemo(() => {
    const empty: Record<RetroColumnName, RetroItem[]> = {
      WentWell: [],
      DidntGoWell: [],
      ActionItem: [],
    };
    if (!board) return empty;
    for (const item of board.items) {
      empty[item.column]?.push(item);
    }
    for (const key of Object.keys(empty) as RetroColumnName[]) {
      empty[key].sort((a, b) => b.voteCount - a.voteCount || a.createdAt.localeCompare(b.createdAt));
    }
    return empty;
  }, [board]);

  // ── Actions (parent owns the state, columns just call back) ──────────

  const handleCreate = useCallback(
    async (column: RetroColumnName, content: string) => {
      try {
        const created = await createRetroItem(tid, iid, { column, content });
        setBoard((prev) =>
          prev ? { ...prev, items: [...prev.items, created] } : prev,
        );
      } catch (err) {
        console.error(err);
        toast({
          variant: 'error',
          title: t('common.error'),
          description: err instanceof Error ? err.message : t('retro.failedCreate'),
        });
      }
    },
    [tid, iid, toast, t],
  );

  const handleEdit = useCallback(
    async (item: RetroItem, content: string) => {
      try {
        const updated = await updateRetroItem(tid, iid, item.id, { content });
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((i) => (i.id === updated.id ? updated : i)),
              }
            : prev,
        );
      } catch (err) {
        console.error(err);
        toast({
          variant: 'error',
          title: t('common.error'),
          description: err instanceof Error ? err.message : t('retro.failedUpdate'),
        });
        throw err; // let RetroCard exit edit mode only on success
      }
    },
    [tid, iid, toast, t],
  );

  const handleDelete = useCallback(
    async (item: RetroItem) => {
      try {
        await deleteRetroItem(tid, iid, item.id);
        setBoard((prev) =>
          prev ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) } : prev,
        );
      } catch (err) {
        console.error(err);
        toast({
          variant: 'error',
          title: t('common.error'),
          description: err instanceof Error ? err.message : t('retro.failedDelete'),
        });
        throw err;
      }
    },
    [tid, iid, toast, t],
  );

  const handleVote = useCallback(
    async (item: RetroItem) => {
      // Optimistic toggle — feels instant; we'll reconcile from the server response.
      const optimistic: RetroItem = {
        ...item,
        hasVoted: !item.hasVoted,
        voteCount: item.voteCount + (item.hasVoted ? -1 : 1),
      };
      setBoard((prev) =>
        prev
          ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? optimistic : i)) }
          : prev,
      );

      try {
        const fresh = await toggleRetroVote(tid, iid, item.id);
        setBoard((prev) =>
          prev
            ? { ...prev, items: prev.items.map((i) => (i.id === fresh.id ? fresh : i)) }
            : prev,
        );
      } catch (err) {
        console.error(err);
        // Roll back to the original card on failure.
        setBoard((prev) =>
          prev
            ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? item : i)) }
            : prev,
        );
        toast({
          variant: 'error',
          title: t('common.error'),
          description: err instanceof Error ? err.message : t('retro.failedVote'),
        });
      }
    },
    [tid, iid, toast, t],
  );

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-6 border border-red-200 dark:border-red-900 flex flex-col items-center text-center gap-3">
          <AlertCircle className="h-10 w-10 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            {t('retro.failedLoad')}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300">{error ?? t('common.notFound')}</p>
          <Button onClick={loadBoard} variant="outline" className="mt-2">
            {t('common.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  // Iteration must be Active or Completed for retro to make sense.
  if (board.iterationStatus === 'Planning') {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="mt-6 rounded-xl border bg-muted/20 p-6 text-center space-y-3">
          <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('retro.iterationNotStarted')}</p>
          <Button asChild variant="outline">
            <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/iterations`}>
              <ArrowLeft className="mr-1 h-3 w-3" />
              {t('common.back')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 max-w-[1600px] mx-auto gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('retro.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {board.iterationName ?? `Iteration ${board.iterationId}`}
            {' · '}
            <span className="text-xs">{board.iterationStatus}</span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/iterations`}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            {t('common.back')}
          </Link>
        </Button>
      </div>

      {board.isReadOnly && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          <Lock className="h-4 w-4" />
          {t('retro.readOnlyBanner')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <RetroColumn
          column="WentWell"
          title={t('retro.columnWentWell')}
          icon={<ThumbsUp className="h-4 w-4 text-emerald-600" />}
          accentClassName="border-emerald-200/60"
          items={grouped.WentWell}
          readOnly={board.isReadOnly}
          onCreate={handleCreate}
          onVote={handleVote}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <RetroColumn
          column="DidntGoWell"
          title={t('retro.columnDidntGoWell')}
          icon={<ThumbsDown className="h-4 w-4 text-rose-600" />}
          accentClassName="border-rose-200/60"
          items={grouped.DidntGoWell}
          readOnly={board.isReadOnly}
          onCreate={handleCreate}
          onVote={handleVote}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <RetroColumn
          column="ActionItem"
          title={t('retro.columnActionItem')}
          icon={<Lightbulb className="h-4 w-4 text-amber-600" />}
          accentClassName="border-amber-200/60"
          items={grouped.ActionItem}
          readOnly={board.isReadOnly}
          onCreate={handleCreate}
          onVote={handleVote}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
