import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingPage } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';
import {
  getWorkItemsGrouped, getIterationsByTeam, getTeamById, getOrganizationById,
  updateWorkItem, type WorkItem, type Iteration, type TeamDetail, type OrganizationDetail, type BacklogGroup,
} from '@/lib/api';

import { IterationSection } from '../components/IterationSection';
import { BacklogFilters } from '../components/BacklogFilters';
import { CreateIterationModal } from '../components/CreateIterationModal';
import { EditIterationModal } from '../components/EditIterationModal';
import { CompleteIterationModal } from '../components/CompleteIterationModal';
import { CreateWorkItemModal } from '../components/CreateWorkItemModal';
import { EditWorkItemModal } from '../components/EditWorkItemModal';

// Map backend string status to numeric for PUT
const STATUS_MAP: Record<string, number> = { Backlog: 0, Todo: 1, InProgress: 2, Review: 3, Done: 4 };
const PRIORITY_MAP: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

export function BacklogPage() {
  const { orgId, productId, teamId } = useParams();
  const { toast } = useToast();

  // Data
  const [groups, setGroups] = useState<BacklogGroup[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      const [groupsData, itersData, teamData, orgData] = await Promise.all([
        getWorkItemsGrouped(tid),
        getIterationsByTeam(tid),
        getTeamById(tid),
        getOrganizationById(Number(orgId)),
      ]);
      setGroups(groupsData);
      setIterations(itersData);
      setTeam(teamData);
      setOrg(orgData);
    } catch (error) {
      console.error('Failed to load backlog:', error);
      toast({ variant: 'error', title: 'Error', description: 'Failed to load backlog data' });
    } finally {
      setIsLoading(false);
    }
  }, [tid, orgId]);

  useEffect(() => {
    if (teamId && orgId) loadData();
  }, [teamId, orgId, loadData]);

  // ── Filter logic ───────────────────────────────────────

  const filterItems = (items: WorkItem[]): WorkItem[] => {
    return items.filter((wi) => {
      if (typeFilter && wi.type !== typeFilter) return false;
      if (statusFilter && wi.status !== statusFilter) return false;
      if (assigneeFilter === 'unassigned' && wi.assignedTo !== null) return false;
      if (assigneeFilter && assigneeFilter !== 'unassigned' && wi.assignedTo !== Number(assigneeFilter)) return false;
      if (searchQuery && !wi.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  // ── Organize sections ──────────────────────────────────

  // Active sprints first, then Planning, then Backlog at bottom
  const activeGroup = groups.find(g => g.iterationStatus === 'Active');
  const planningGroups = groups.filter(g => g.iterationStatus === 'Planning');
  const completedGroups = groups.filter(g => g.iterationStatus === 'Completed');
  const backlogGroup = groups.find(g => g.iterationId === null);

  // Find iterations that have no work items yet (still show them)
  const groupedIterationIds = new Set(groups.filter(g => g.iterationId !== null).map(g => g.iterationId));
  const emptyIterations = iterations.filter(i => !groupedIterationIds.has(i.id) && i.status !== 'Completed');

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

    // Determine target iteration
    const overId = over.id.toString();
    let targetIterationId: number | null = null;

    if (overId === 'backlog') {
      targetIterationId = null;
    } else if (overId.startsWith('iteration-')) {
      targetIterationId = Number(overId.replace('iteration-', ''));
    } else if (overId.startsWith('wi-')) {
      // Dropped on another work item — find which section it belongs to
      const targetWiId = Number(overId.replace('wi-', ''));
      for (const group of groups) {
        if (group.workItems.some(wi => wi.id === targetWiId)) {
          targetIterationId = group.iterationId;
          break;
        }
      }
    }

    // Skip if no change
    if (draggedItem.iterationId === targetIterationId) return;

    // Optimistic update
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
        // Create a new group for this iteration
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

    // API call
    try {
      // Auto-promote Backlog → Todo when dragging into a sprint
      const newStatus = (draggedItem.status === 'Backlog' && targetIterationId !== null)
        ? STATUS_MAP['Todo']
        : (draggedItem.status === 'Todo' && targetIterationId === null)
        ? STATUS_MAP['Backlog']
        : STATUS_MAP[draggedItem.status] ?? 0;

      await updateWorkItem(draggedItem.id, {
        title: draggedItem.title,
        description: draggedItem.description ?? undefined,
        priority: PRIORITY_MAP[draggedItem.priority] ?? 1,
        status: newStatus,
        points: draggedItem.points ?? undefined,
        assignedTo: draggedItem.assignedTo,
        iterationId: targetIterationId,
      });
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to move item. Refreshing...' });
      loadData(); // Revert on failure
    }
  };

  // ── Render ─────────────────────────────────────────────

  if (isLoading) return <LoadingPage />;
  if (!team || !org) return <div className="p-8">Team not found</div>;

  const members = team.members;

  const renderSection = (
    iteration: Iteration | null,
    items: WorkItem[],
    isBacklog: boolean = false,
  ) => (
    <IterationSection
      key={isBacklog ? 'backlog' : `iter-${iteration?.id}`}
      iteration={iteration}
      workItems={filterItems(items)}
      isBacklog={isBacklog}
      onEditIteration={setEditIteration}
      onCompleteIteration={setCompleteIteration}
      onWorkItemClick={setEditItem}
      onRefresh={loadData}
    />
  );

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

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backlog</h1>
          <p className="text-muted-foreground">{team.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateIterationModal teamId={tid} onCreated={loadData} />
          <Button size="sm" onClick={() => setCreateItemOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <BacklogFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        assigneeFilter={assigneeFilter}
        searchQuery={searchQuery}
        members={members}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        onAssigneeChange={setAssigneeFilter}
        onSearchChange={setSearchQuery}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>🟦 Story</span>
        <span>🟨 Task</span>
        <span>🟥 Bug</span>
        <span className="ml-auto">💡 Drag items between sections to plan sprints</span>
      </div>

      {/* DnD context wrapping all sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {/* Active sprint */}
          {activeGroup && renderSection(
            iterations.find(i => i.id === activeGroup.iterationId) ?? null,
            activeGroup.workItems,
          )}

          {/* Planning sprints */}
          {planningGroups.map(g => renderSection(
            iterations.find(i => i.id === g.iterationId) ?? null,
            g.workItems,
          ))}

          {/* Empty planning iterations (no work items yet) */}
          {emptyIterations
            .filter(i => i.status === 'Planning' && !planningGroups.some(g => g.iterationId === i.id))
            .map(iter => renderSection(iter, []))}

          {/* Empty active iteration (no work items yet) */}
          {emptyIterations
            .filter(i => i.status === 'Active' && !activeGroup)
            .map(iter => renderSection(iter, []))}

          {/* Backlog (unassigned) */}
          {renderSection(null, backlogGroup?.workItems ?? [], true)}

          {/* Completed sprints (collapsed by default — rendered but section starts collapsed) */}
          {completedGroups.map(g => renderSection(
            iterations.find(i => i.id === g.iterationId) ?? null,
            g.workItems,
          ))}
        </div>

        {/* Drag overlay — ghost of the item being dragged */}
        <DragOverlay>
          {activeItem ? (
            <div className="flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-card shadow-lg opacity-90">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
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

      {/* Modals */}
      <CreateWorkItemModal
        teamId={tid}
        members={members}
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
        onCreated={loadData}
      />

      <EditWorkItemModal
        item={editItem}
        members={members}
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
