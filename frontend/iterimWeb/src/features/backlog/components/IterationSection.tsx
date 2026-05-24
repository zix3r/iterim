import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Play, CheckCircle2, Pencil, Trash2, LayoutList, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { startIteration, deleteIteration } from '@/lib/api';
import { WorkItemRow } from './WorkItemRow';
import type { Iteration, WorkItem } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  iteration: Iteration | null;
  workItems: WorkItem[];
  isBacklog?: boolean;
  readOnly?: boolean;
  onEditIteration?: (iteration: Iteration) => void;
  onCompleteIteration?: (iteration: Iteration) => void;
  onWorkItemClick: (item: WorkItem) => void;
  onRefresh: () => void;
  // NAUJI PROPSAI:
  selectedIds?: number[];
  onToggleSelection?: (id: number) => void;
}

export function IterationSection({
  iteration, workItems, isBacklog = false, readOnly = false,
  onEditIteration, onCompleteIteration, onWorkItemClick, onRefresh,
  selectedIds = [], onToggleSelection,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  // IterationSection is always rendered inside the team/iterations route, so
  // these params are guaranteed to be present — used only for the retro link.
  const { orgId, productId, teamId } = useParams();
  const retroPath =
    iteration && orgId && productId && teamId
      ? `/org/${orgId}/products/${productId}/teams/${teamId}/iterations/${iteration.id}/retro`
      : null;
  const showRetroButton =
    !isBacklog &&
    retroPath !== null &&
    (iteration?.status === 'Active' || iteration?.status === 'Completed');

  // Droppable zone for drag-and-drop
  const droppableId = isBacklog ? 'backlog' : `iteration-${iteration?.id}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const totalPoints = workItems.reduce((sum, wi) => sum + (wi.points ?? 0), 0);
  const sortableIds = workItems.map((wi) => `wi-${wi.id}`);

  const handleStart = async () => {
    if (!iteration) return;
    try {
      await startIteration(iteration.id);
      toast({ variant: 'success', title: t('common.success') });
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('backlog.failedUpdate');
      toast({ variant: 'error', title: t('common.error'), description: message });
    }
  };

  const handleDelete = async () => {
    if (!iteration) return;
    setIsDeleting(true);
    try {
      await deleteIteration(iteration.id);
      toast({ variant: 'success', title: t('common.success') });
      setConfirmDelete(false);
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('backlog.failedDelete');
      toast({ variant: 'error', title: t('common.error'), description: message });
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
    <div className={`border rounded-lg overflow-hidden transition-colors ${isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
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
            <span className="font-semibold text-sm">{t('backlog.title')}</span>
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

        {/* Completed summary */}
        {readOnly && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {workItems.filter(wi => wi.status === 'Done').length}/{workItems.length} done
            {' · '}
            {workItems.filter(wi => wi.status === 'Done').reduce((s, wi) => s + (wi.points ?? 0), 0)}/{totalPoints} SP
          </span>
        )}

        {/* Retro link — always available for Active or Completed iterations,
            including the Completed (read-only) section so completed retros stay accessible. */}
        {showRetroButton && retroPath && readOnly && (
          <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link to={retroPath}>
                <MessageSquare className="h-3 w-3 mr-1" />
                {t('retro.button')}
              </Link>
            </Button>
          </div>
        )}

        {/* Actions (stop propagation so clicks don't toggle collapse) */}
        {!isBacklog && !readOnly && iteration && (
          <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            {iteration.status === 'Planning' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleStart}
                  disabled={workItems.length === 0}
                  title={workItems.length === 0 ? 'Add items before starting' : ''}
                >
                  <Play className="h-3 w-3 mr-1" /> Start
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEditIteration?.(iteration)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? t('common.deleting') : t('common.yes')}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setConfirmDelete(false)}>
                      {t('common.no')}
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
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {t('backlog.completeIteration')}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEditIteration?.(iteration)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
            {showRetroButton && retroPath && (
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Link to={retroPath}>
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {t('retro.button')}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Work items list */}
      {!collapsed && (
        <div
          ref={readOnly ? undefined : setNodeRef}
          className={`p-2 space-y-1 min-h-[48px] transition-colors ${isOver && !readOnly ? 'bg-primary/5' : ''
            } ${workItems.length === 0 ? 'flex items-center justify-center' : ''}`}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {workItems.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-4">
                {isBacklog ? t('backlog.noItems') : t('backlog.dragHere')}
              </p>
            ) : (
              workItems.map((item) => (
                <WorkItemRow 
                  key={item.id} 
                  item={item} 
                  readOnly={readOnly} 
                  onClick={onWorkItemClick}
                  // PAKEITIMAS: perduodame state mygtukams
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelection={onToggleSelection}
                />
              ))
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}