import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Play, CheckCircle2, Pencil, Trash2, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { startIteration, deleteIteration } from '@/lib/api';
import { WorkItemRow } from './WorkItemRow';
import type { Iteration, WorkItem } from '@/lib/api';

interface Props {
  iteration: Iteration | null; // null = backlog section
  workItems: WorkItem[];
  isBacklog?: boolean;
  onEditIteration?: (iteration: Iteration) => void;
  onCompleteIteration?: (iteration: Iteration) => void;
  onWorkItemClick: (item: WorkItem) => void;
  onRefresh: () => void;
}

export function IterationSection({
  iteration, workItems, isBacklog = false,
  onEditIteration, onCompleteIteration, onWorkItemClick, onRefresh,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Droppable zone for drag-and-drop
  const droppableId = isBacklog ? 'backlog' : `iteration-${iteration?.id}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const totalPoints = workItems.reduce((sum, wi) => sum + (wi.points ?? 0), 0);
  const sortableIds = workItems.map((wi) => `wi-${wi.id}`);

  const handleStart = async () => {
    if (!iteration) return;
    try {
      await startIteration(iteration.id);
      toast({ variant: 'success', title: 'Iteration started!' });
      onRefresh();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to start iteration' });
    }
  };

  const handleDelete = async () => {
    if (!iteration) return;
    setIsDeleting(true);
    try {
      await deleteIteration(iteration.id);
      toast({ variant: 'success', title: 'Iteration deleted' });
      setConfirmDelete(false);
      onRefresh();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to delete iteration' });
    } finally {
      setIsDeleting(false);
    }
  };

  const statusColor = iteration?.status === 'Active'
    ? 'text-green-600 font-medium dark:text-green-400'
    : iteration?.status === 'Completed'
    ? 'text-zinc-500 bg-zinc-100/50 dark:bg-zinc-800 dark:text-zinc-400'
    : 'text-zinc-600 dark:text-zinc-400';

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${
      isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
    }`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}

        {isBacklog ? (
          <>
            <LayoutList className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-semibold text-sm">Backlog</span>
            <span className="text-xs text-muted-foreground ml-1">{workItems.length} items</span>
          </>
        ) : (
          <>
            <span className="font-semibold text-sm">{iteration?.name ?? `Iteration ${iteration?.id}`}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}`}>
              {iteration?.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {iteration?.startDate} — {iteration?.endDate}
            </span>
          </>
        )}

        {/* Points summary */}
        <span className="ml-auto text-xs font-semibold text-muted-foreground shrink-0">
          {totalPoints} pts
        </span>

        {/* Actions (stop propagation so clicks don't toggle collapse) */}
        {!isBacklog && iteration && (
          <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            {iteration.status === 'Planning' && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleStart}>
                  <Play className="h-3 w-3 mr-1" /> Start
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEditIteration?.(iteration)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? '...' : 'Yes'}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setConfirmDelete(false)}>
                      No
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </>
            )}
            {iteration.status === 'Active' && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onCompleteIteration?.(iteration)}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEditIteration?.(iteration)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Work items list */}
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`p-2 space-y-1 min-h-[48px] transition-colors ${
            isOver ? 'bg-primary/5' : ''
          } ${workItems.length === 0 ? 'flex items-center justify-center' : ''}`}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {workItems.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-4">
                {isBacklog ? 'No unassigned items' : 'Drag items here to plan this iteration'}
              </p>
            ) : (
              workItems.map((item) => (
                <WorkItemRow key={item.id} item={item} onClick={onWorkItemClick} />
              ))
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
