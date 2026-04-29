import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useToast } from '@/components/ui/toast';
import { Plus, History, AlertCircle, ListTodo } from 'lucide-react';
import {
  getWorkItemsGrouped, getIterationsByTeam, getTeamById, getOrganizationById, getOrgTags,
  updateWorkItem, reorderWorkItems, type WorkItem, type Iteration, type TeamDetail, type OrganizationDetail, type BacklogGroup, type Tag,
} from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

import { IterationSection } from '../components/IterationSection';
import { BacklogFilters } from '../components/BacklogFilters';
import { CreateIterationModal } from '../components/CreateIterationModal';
import { EditIterationModal } from '../components/EditIterationModal';
import { CompleteIterationModal } from '../components/CompleteIterationModal';
import { CreateWorkItemModal } from '../components/CreateWorkItemModal';
import { EditWorkItemModal } from '../components/EditWorkItemModal';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { addRecentPage } from '@/lib/recentPages';

// Map backend string status to numeric for PUT
const STATUS_MAP: Record<string, number> = { Backlog: 0, Todo: 1, InProgress: 2, Review: 3, Done: 4 };
const PRIORITY_MAP: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };
const TYPE_MAP: Record<string, number> = { Story: 0, Task: 1, Bug: 2 };

export function BacklogPage() {
  const { orgId, productId, teamId } = useParams();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Data
  const [groups, setGroups] = useState<BacklogGroup[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [orgTags, setOrgTags] = useState<Tag[]>([]);

  // Modals
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<WorkItem | null>(null);
  const [editIteration, setEditIteration] = useState<Iteration | null>(null);
  const [completeIteration, setCompleteIteration] = useState<Iteration | null>(null);

  // DnD
  const [activeItem, setActiveItem] = useState<WorkItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tid = Number(teamId);

  // ── Load data ──────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [groupsData, itersData, teamData, orgData, tagsData] = await Promise.all([
        getWorkItemsGrouped(tid),
        getIterationsByTeam(tid),
        getTeamById(tid),
        getOrganizationById(Number(orgId)),
        getOrgTags(Number(orgId)),
      ]);
      setGroups(groupsData);
      setIterations(itersData);
      setTeam(teamData);
      setOrg(orgData);
      setOrgTags(tagsData);
    } catch (err) {
      console.error('Failed to load backlog:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load backlog data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tid, orgId]);

  useEffect(() => {
    if (teamId && orgId) loadData();
  }, [teamId, orgId, loadData]);

  useEffect(() => {
    if (team && orgId && productId && teamId) {
      addRecentPage({
        path: `/org/${orgId}/products/${productId}/teams/${teamId}/backlog`,
        label: `${team.name} — Backlog`,
        iconType: 'Team',
      });
    }
  }, [team, orgId, productId, teamId]);

  // ── Filter logic ───────────────────────────────────────

  const filterItems = (items: WorkItem[]): WorkItem[] => {
    return items.filter((wi) => {
      if (typeFilter && wi.type !== typeFilter) return false;
      if (statusFilter && wi.status !== statusFilter) return false;
      if (assigneeFilter === 'unassigned' && wi.assignedTo !== null) return false;
      if (assigneeFilter && assigneeFilter !== 'unassigned' && wi.assignedTo !== Number(assigneeFilter)) return false;
      if (searchQuery && !wi.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (tagFilter && !wi.tags?.some(t => t.id === Number(tagFilter))) return false;
      return true;
    });
  };

  // ── Organize sections ──────────────────────────────────

  const activeGroup = groups.find(g => g.iterationStatus === 'Active');
  const planningGroups = groups.filter(g => g.iterationStatus === 'Planning');
  const completedGroups = groups.filter(g => g.iterationStatus === 'Completed');
  const backlogGroup = groups.find(g => g.iterationId === null);

  const groupedIterationIds = new Set(groups.filter(g => g.iterationId !== null).map(g => g.iterationId));
  const emptyIterations = iterations.filter(i => !groupedIterationIds.has(i.id) && i.status !== 'Completed');

  // Skaičiuojame ar visiškai tuščia (nėra nei užduočių, nei iteracijų)
  const totalItems = groups.reduce((acc, g) => acc + g.workItems.length, 0);
  const isCompletelyEmpty = totalItems === 0 && iterations.length === 0;

  // ── Drag and drop ──────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as WorkItem | undefined;
    if (item) setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const draggedItem = active.data.current?.item as WorkItem | undefined;
    if (!draggedItem) return;

    const overId = over.id.toString();

    let targetIterationId: number | null = null;
    let targetWorkItemId: number | null = null;

    if (overId === 'backlog') {
      targetIterationId = null;
    } else if (overId.startsWith('iteration-')) {
      targetIterationId = Number(overId.replace('iteration-', ''));
    } else if (overId.startsWith('wi-')) {
      targetWorkItemId = Number(overId.replace('wi-', ''));
      for (const group of groups) {
        if (group.workItems.some(wi => wi.id === targetWorkItemId)) {
          targetIterationId = group.iterationId;
          break;
        }
      }
    }

    const sameIteration = draggedItem.iterationId === targetIterationId;

    if (sameIteration && targetWorkItemId !== null) {
      const group = groups.find(g => g.iterationId === targetIterationId);
      if (!group) return;

      const oldIndex = group.workItems.findIndex(wi => wi.id === draggedItem.id);
      const newIndex = group.workItems.findIndex(wi => wi.id === targetWorkItemId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(group.workItems, oldIndex, newIndex);
      setGroups(prev =>
        prev.map(g =>
          g.iterationId === targetIterationId
            ? { ...g, workItems: reordered }
            : g
        )
      );

      try {
        const items = reordered.map((wi: WorkItem, i: number) => ({ id: wi.id, position: i }));
        await reorderWorkItems(tid, items);
      } catch {
        toast({ variant: 'error', title: t('common.error'), description: 'Failed to reorder. Refreshing...' });
        loadData();
      }
      return;
    }

    if (!sameIteration) {
      setGroups(prev => {
        const updated = prev.map(g => ({
          ...g,
          workItems: g.workItems.filter(wi => wi.id !== draggedItem.id),
        }));

        const targetGroup = updated.find(g => g.iterationId === targetIterationId);
        const movedItem = {
          ...draggedItem,
          iterationId: targetIterationId,
          status: (draggedItem.status === 'Backlog' && targetIterationId !== null)
            ? 'Todo'
            : (draggedItem.status === 'Todo' && targetIterationId === null)
              ? 'Backlog'
              : draggedItem.status,
        };

        if (targetGroup) {
          targetGroup.workItems.push(movedItem);
        } else {
          const iter = iterations.find(i => i.id === targetIterationId);
          updated.push({
            iterationId: targetIterationId,
            iterationName: iter?.name ?? 'Backlog',
            iterationStatus: iter?.status ?? null,
            workItems: [movedItem],
          });
        }

        return updated;
      });

      try {
        const newStatus = (draggedItem.status === 'Backlog' && targetIterationId !== null)
          ? STATUS_MAP['Todo']
          : (draggedItem.status === 'Todo' && targetIterationId === null)
            ? STATUS_MAP['Backlog']
            : STATUS_MAP[draggedItem.status] ?? 0;

        await updateWorkItem(draggedItem.id, {
          title: draggedItem.title,
          description: draggedItem.description ?? undefined,
          type: TYPE_MAP[draggedItem.type] ?? 0,
          priority: PRIORITY_MAP[draggedItem.priority] ?? 1,
          status: newStatus,
          points: draggedItem.points ?? undefined,
          assignedTo: draggedItem.assignedTo,
          iterationId: targetIterationId,
        });
      } catch {
        toast({ variant: 'error', title: t('common.error'), description: 'Failed to move item. Refreshing...' });
        loadData();
      }
    }
  };

  // ── Render ─────────────────────────────────────────────

  // 1. SKELETON BŪSENA
  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-4 w-64 mb-6" /> {/* Breadcrumbs */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
        
        {/* Filters Skeleton */}
        <div className="flex gap-4 mb-8">
           <Skeleton className="h-9 w-full max-w-sm rounded-md" />
           <Skeleton className="h-9 w-32 rounded-md" />
           <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        {/* Sections Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-md" /> {/* Section header */}
          <Skeleton className="h-16 w-full rounded-md" /> {/* Work item */}
          <Skeleton className="h-16 w-full rounded-md" /> {/* Work item */}
          <Skeleton className="h-10 w-full rounded-md mt-6" /> {/* Next section */}
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      </div>
    );
  }

  // 2. KLAIDOS BŪSENA
  if (error || !team || !org) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">{t('backlog.failedLoad')}</h3>
          <p className="text-sm text-red-700">{error || "Failed to load team data."}</p>
          <Button onClick={loadData} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const members = team.members;
  const canTransferWorkItems = team.currentUserId === team.createdBy || team.members.some(
    (member) => member.userId === team.currentUserId && member.role === 'Admin'
  );

  const renderSection = (
    iteration: Iteration | null,
    items: WorkItem[],
    isBacklog: boolean = false,
    readOnly: boolean = false,
  ) => (
    <IterationSection
      key={isBacklog ? 'backlog' : `iter-${iteration?.id}`}
      iteration={iteration}
      workItems={filterItems(items)}
      isBacklog={isBacklog}
      readOnly={readOnly}
      onEditIteration={setEditIteration}
      onCompleteIteration={setCompleteIteration}
      onWorkItemClick={setEditItem}
      onRefresh={loadData}
    />
  );

  // 3. SĖKMINGA BŪSENA
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: org.name, href: `/org/${orgId}` },
          { label: 'Products', href: `/org/${orgId}/products` },
          { label: team.productName, href: `/org/${orgId}/products/${productId}` },
          { label: 'Teams', href: `/org/${orgId}/products/${productId}/teams` },
          { label: team.name, href: `/org/${orgId}/products/${productId}/teams/${teamId}` },
          { label: 'Backlog' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('backlog.title')}</h1>
          <p className="text-muted-foreground">{team.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateIterationModal teamId={tid} onCreated={loadData} />
          <Button size="sm" onClick={() => setCreateItemOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('backlog.addItem')}
          </Button>
        </div>
      </div>

      {isCompletelyEmpty ? (
        <EmptyState
          title={t('backlog.noItems')}
          description="Create your first work item or start an iteration to begin planning your work."
          icon={<ListTodo className="h-8 w-8" />}
          action={
            <Button onClick={() => setCreateItemOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t('backlog.addItem')}
            </Button>
          }
          className="mt-8"
        />
      ) : (
        <>
          <BacklogFilters
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            assigneeFilter={assigneeFilter}
            tagFilter={tagFilter}
            searchQuery={searchQuery}
            members={members}
            orgTags={orgTags}
            onTypeChange={setTypeFilter}
            onStatusChange={setStatusFilter}
            onAssigneeChange={setAssigneeFilter}
            onTagChange={setTagFilter}
            onSearchChange={setSearchQuery}
          />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>🟦 {t('backlog.typeStory')}</span>
            <span>🟨 {t('backlog.typeTask')}</span>
            <span>🟥 {t('backlog.typeBug')}</span>
            <span className="ml-auto flex items-center gap-3">
              <span>💡 {t('backlog.dragHelp')}</span>
              {completedGroups.length > 0 && (
                <Button
                  variant={showCompleted ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <History className="h-3 w-3 mr-1" />
                  {showCompleted ? t('common.close') : t('backlog.showCompleted')} ({completedGroups.length})
                </Button>
              )}
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4">
              {activeGroup && renderSection(
                iterations.find(i => i.id === activeGroup.iterationId) ?? null,
                activeGroup.workItems,
              )}

              {planningGroups.map(g => renderSection(
                iterations.find(i => i.id === g.iterationId) ?? null,
                g.workItems,
              ))}

              {emptyIterations
                .filter(i => i.status === 'Planning' && !planningGroups.some(g => g.iterationId === i.id))
                .map(iter => renderSection(iter, []))}

              {emptyIterations
                .filter(i => i.status === 'Active' && !activeGroup)
                .map(iter => renderSection(iter, []))}

              {renderSection(null, backlogGroup?.workItems ?? [], true)}

              {showCompleted && completedGroups.map(g => renderSection(
                iterations.find(i => i.id === g.iterationId) ?? null,
                g.workItems,
                false,
                true,
              ))}
            </div>

            <DragOverlay>
              {activeItem ? (
                <div className="flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-card shadow-lg opacity-90">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded
                      ${activeItem.type === 'Story' ? 'bg-blue-100 text-blue-700' :
                      activeItem.type === 'Bug' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'}`}>
                    {activeItem.type.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium truncate">{activeItem.title}</span>
                  {activeItem.points && (
                    <span className="text-xs font-mono font-semibold bg-secondary/50 px-1.5 py-0.5 rounded">
                      {activeItem.points}
                    </span>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {/* Modals */}
      <CreateWorkItemModal
        teamId={tid}
        orgId={Number(orgId)}
        members={members}
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
        onCreated={loadData}
      />

      <EditWorkItemModal
        item={editItem}
        orgId={Number(orgId)}
        members={members}
        canTransferWorkItem={canTransferWorkItems}
        open={!!editItem}
        onOpenChange={(v) => { if (!v) setEditItem(null); }}
        onUpdated={loadData}
      />

      <EditIterationModal
        iteration={editIteration}
        open={!!editIteration}
        onOpenChange={(v) => { if (!v) setEditIteration(null); }}
        onUpdated={loadData}
      />

      <CompleteIterationModal
        iteration={completeIteration}
        otherIterations={iterations}
        open={!!completeIteration}
        onOpenChange={(v) => { if (!v) setCompleteIteration(null); }}
        onCompleted={loadData}
      />
    </div>
  );
}