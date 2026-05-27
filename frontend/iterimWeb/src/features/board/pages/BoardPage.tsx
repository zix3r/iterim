import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '../components/KanbanBoard';
import { getBoardByIterationId, getActiveBoard, getTeamById, getOrganizationById, getWorkItemById, type BoardData, type TeamDetail, type OrganizationDetail, type WorkItem } from '@/lib/api';
import { EditWorkItemModal } from '@/features/backlog/components/EditWorkItemModal';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, LayoutGrid, LayoutList, ListTodo, ArrowLeft } from 'lucide-react';
import { addRecentPage } from '@/lib/recentPages';
import { useLanguage } from '@/context/LanguageContext';

export function BoardPage() {
  const { t } = useLanguage();
  const { orgId, productId, teamId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Nuskaitome iterationId iš URL, jei jis ten yra
  const urlIterationId = searchParams.get('iterationId');

  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editItem, setEditItem] = useState<WorkItem | null>(null);

  const tid = Number(teamId);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setError(null);

      // Jei turime ID iš URL – krauname konkrečią iteraciją, kitaip – aktyvią
      const boardPromise = urlIterationId
        ? getBoardByIterationId(tid, Number(urlIterationId))
        : getActiveBoard(tid);

      const [board, teamData, orgData] = await Promise.all([
        boardPromise,
        getTeamById(tid),
        getOrganizationById(Number(orgId)),
      ]);
      setBoardData(board);
      setTeam(teamData);
      setOrg(orgData);
    } catch (err) {
      console.error('Failed to load board:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load board data.';
      setError(errorMessage);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [tid, orgId, urlIterationId]);

  const refreshSilent = useCallback(() => loadData(true), [loadData]);

  useEffect(() => {
    if (teamId && orgId) loadData();
  }, [teamId, orgId, loadData]);

  useEffect(() => {
    if (team && orgId && productId && teamId) {
      addRecentPage({
        path: `/org/${orgId}/products/${productId}/teams/${teamId}/board`,
        label: `${team.name} — Board`,
        iconType: 'Team',
      });
    }
  }, [team, orgId, productId, teamId]);

  const handleCardClick = async (id: number) => {
    try {
      const fullItem = await getWorkItemById(id);
      setEditItem(fullItem);
    } catch (err) {
      console.error(err);
      toast({ variant: 'error', title: t('common.error'), description: t('backlog.failedLoad') });
    }
  };

  const isIterationEmpty = boardData && boardData.columns.every(col => col.workItems.length === 0);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full px-4 py-3 max-w-[1600px] mx-auto space-y-3">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col gap-4 bg-muted/10 p-4 rounded-xl border border-dashed">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-28 w-full rounded-lg" />
              {i % 2 === 0 && <Skeleton className="h-24 w-full rounded-lg" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !team || !org) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">{t('board.failedLoad')}</h3>
          <p className="text-sm text-red-700">{error || t('common.notFound')}</p>
          <Button onClick={() => loadData()} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">
            {t('common.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  const canTransferWorkItems = team.currentUserId === team.createdBy || team.members.some(
    (member) => member.userId === team.currentUserId && member.role === 'Admin'
  );

  return (
    <div className="flex flex-col h-full px-4 py-3 w-fit max-w-[1600px] mx-auto space-y-3 overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          {/* PAKEITIMAS: Pridėtas mygtukas grįžti atgal į planą, jei atidaryta sena iteracija */}
          {urlIterationId && (
            <Button asChild size="sm" variant="ghost" className="mr-2">
              <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/quarter`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Link>
            </Button>
          )}
          <h1 className="text-xl font-bold">{t('board.title')}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {boardData?.iteration.name ? boardData.iteration.name : team.name}
            {boardData?.iteration.status && (
              <span className="ml-2 text-[10px] uppercase font-bold bg-muted px-2 py-0.5 rounded">
                {boardData.iteration.status}
              </span>
            )}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/backlog`}>
            <ListTodo className="h-4 w-4 mr-2" />
            {t('products.backlog')}
          </Link>
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        {!boardData ? (
          <EmptyState
            title={t('board.noActiveIteration')}
            description={t('backlog.failedLoad')}
            icon={<LayoutGrid className="h-8 w-8" />}
            action={
              <Button asChild>
                <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/backlog`}>
                  {t('products.backlog')}
                </Link>
              </Button>
            }
          />
        ) : isIterationEmpty ? (
          <EmptyState
            title={t('board.noItemsInColumn')}
            description={t('backlog.failedLoad')}
            icon={<LayoutList className="h-8 w-8" />}
            action={
              <Button asChild>
                <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/backlog`}>
                  {t('products.backlog')}
                </Link>
              </Button>
            }
          />
        ) : (
          <KanbanBoard
            boardData={boardData}
            setBoardData={setBoardData}
            onBoardUpdate={refreshSilent}
            onCardClick={handleCardClick}
          />
        )}
      </div>

      <EditWorkItemModal
        item={editItem}
        orgId={Number(orgId)}
        members={team.members}
        canTransferWorkItem={canTransferWorkItems}
        open={!!editItem}
        onOpenChange={(v) => { if (!v) setEditItem(null); }}
        onUpdated={refreshSilent}
      />
    </div>
  );
}