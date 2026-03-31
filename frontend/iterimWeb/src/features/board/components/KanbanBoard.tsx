import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { 
  updateWorkItem, 
  getWorkItemById, 
  type BoardData, 
  type BoardWorkItem 
} from '@/lib/api';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useToast } from '@/components/ui/toast';

interface KanbanBoardProps {
  boardData: BoardData;
  setBoardData: Dispatch<SetStateAction<BoardData | null>>;
  onBoardUpdate: () => void;
  onCardClick: (id: number) => void;
}

export function KanbanBoard({ boardData, setBoardData, onBoardUpdate, onCardClick }: KanbanBoardProps) {
  const { toast } = useToast();
  const [activeItem, setActiveItem] = useState<BoardWorkItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const STATUS_MAP: Record<string, number> = { Backlog: 0, Todo: 1, InProgress: 2, Review: 3, Done: 4 };
  const PRIORITY_MAP: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };
  const TYPE_MAP: Record<string, number> = { Story: 0, Task: 1, Bug: 2 };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveItem(active.data.current?.item as BoardWorkItem);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;

    if (!over) return;

    const draggedItem = active.data.current?.item as BoardWorkItem | undefined;
    const targetStatus = over.data.current?.status as string | undefined;

    if (!draggedItem || !targetStatus) return;

    const sourceStatus = boardData.columns.find(col => col.workItems.some(wi => wi.id === draggedItem.id))?.status;
    if (sourceStatus === targetStatus) return;

    // --- OPTIMISTINIS ATNAUJINIMAS ---
    const previousBoardData = boardData;

    const newBoardData: BoardData = {
      ...boardData,
      columns: boardData.columns.map(col => ({
        ...col,
        workItems: [...col.workItems]
      }))
    };

    const sourceCol = newBoardData.columns.find(c => c.status === sourceStatus);
    const targetCol = newBoardData.columns.find(c => c.status === targetStatus);

    if (sourceCol && targetCol) {
      sourceCol.workItems = sourceCol.workItems.filter(i => i.id !== draggedItem.id);
      targetCol.workItems.push(draggedItem);
      setBoardData(newBoardData);
    }
    // ---------------------------------

    try {
      const fullItem = await getWorkItemById(draggedItem.id);
      const newStatusNum = STATUS_MAP[targetStatus] ?? 0;

      await updateWorkItem(draggedItem.id, {
        title: fullItem.title,
        description: fullItem.description ?? undefined,
        type: TYPE_MAP[fullItem.type] ?? 0,
        priority: PRIORITY_MAP[fullItem.priority] ?? 1,
        points: fullItem.points ?? undefined,
        assignedTo: fullItem.assignedTo,
        iterationId: fullItem.iterationId,
        status: newStatusNum,
      });

      onBoardUpdate();
      
    } catch (error) {
      console.error('Failed to update status', error);
      setBoardData(previousBoardData);
      toast({ variant: 'error', title: 'Error', description: 'Failed to update item status. Try again.' });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {boardData.columns.map(column => (
          <KanbanColumn 
            key={column.status} 
            column={column} 
            onCardClick={onCardClick} 
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <KanbanCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}