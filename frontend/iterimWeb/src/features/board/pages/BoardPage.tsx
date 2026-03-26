import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingPage } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '../components/KanbanBoard';
import { getActiveBoard, getTeamById, getOrganizationById, getWorkItemById, type BoardData, type TeamDetail, type OrganizationDetail, type WorkItem } from '@/lib/api';
import { EditWorkItemModal } from '@/features/backlog/components/EditWorkItemModal';
import { useToast } from '@/components/ui/toast';

export function BoardPage() {
  const { orgId, productId, teamId } = useParams();
  const { toast } = useToast();
  
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Būsena kortelės redagavimo modalui
  const [editItem, setEditItem] = useState<WorkItem | null>(null);

  const tid = Number(teamId);

  const loadData = useCallback(async () => {
    try {
      const [board, teamData, orgData] = await Promise.all([
        getActiveBoard(tid),
        getTeamById(tid),
        getOrganizationById(Number(orgId)),
      ]);
      setBoardData(board);
      setTeam(teamData);
      setOrg(orgData);
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tid, orgId]);

  useEffect(() => {
    if (teamId && orgId) loadData();
  }, [teamId, orgId, loadData]);

  const handleCardClick = async (id: number) => {
    try {
      const fullItem = await getWorkItemById(id);
      setEditItem(fullItem);
    } catch (err) {
      console.error(err);
      toast({ variant: 'error', title: 'Error', description: 'Failed to load task details' });
    }
  };

  if (isLoading) return <LoadingPage />;
  if (!team || !org) return <div className="p-8">Team not found</div>;

  return (
    <div className="flex flex-col h-full p-6 max-w-[1600px] mx-auto space-y-6 overflow-hidden">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: org.name, href: `/org/${orgId}` },
          { label: 'Products', href: `/org/${orgId}/products` },
          { label: team.productName, href: `/org/${orgId}/products/${productId}` },
          { label: 'Teams', href: `/org/${orgId}/products/${productId}/teams` },
          { label: team.name, href: `/org/${orgId}/products/${productId}/teams/${teamId}` },
          { label: 'Active Iteration board' },
        ]}
      />

      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold">Iteration board</h1>
        <p className="text-muted-foreground">
          {boardData?.iteration.name ? `Active Iteration: ${boardData.iteration.name}` : team.name}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        {!boardData ? (
           <EmptyState
             title="No Active Iteration"
             description="There is currently no active iteration for this team. Start an iteration from the backlog to view the board."
             action={
               <Button asChild>
                 <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/backlog`}>
                   Go to Backlog
                 </Link>
               </Button>
             }
           />
        ) : (
          <KanbanBoard 
            boardData={boardData} 
            setBoardData={setBoardData}
            onBoardUpdate={loadData} 
            onCardClick={handleCardClick} 
          />
        )}
      </div>

      <EditWorkItemModal
        item={editItem}
        members={team.members}
        open={!!editItem}
        onOpenChange={(v) => { if (!v) setEditItem(null); }}
        onUpdated={loadData}
      />
    </div>
  );
}