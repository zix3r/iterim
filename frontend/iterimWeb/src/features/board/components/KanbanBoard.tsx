import { useState } from 'react';
import { 
  DndContext,  
  DragOverlay, 
  closestCorners 
} from '@dnd-kit/core';
import { 
  updateWorkItem, 
  getWorkItemById, 
  type BoardData, 
  type BoardWorkItem 
} from '@/lib/api';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useToast } from '@/components/ui/toast';
import type{DragEndEvent, DragStartEvent} from '@dnd-kit/core';

interface KanbanBoardProps {
  boardData: BoardData;
  onBoardUpdate: () => void; // Kad galėtume perkrauti duomenis
}

export function KanbanBoard({ boardData, onBoardUpdate }: KanbanBoardProps) {
  const { toast } = useToast();
  // Pataisyta: Naudojame BoardWorkItem tipą vietoj any
  const [activeItem, setActiveItem] = useState<BoardWorkItem | null>(null);

  // Statusų mappinimas atnaujinimui
  const STATUS_MAP: Record<string, number> = { Backlog: 0, Todo: 1, InProgress: 2, Review: 3, Done: 4 };

  // Pataisyta: Naudojame tikslų DragStartEvent tipą vietoj any
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // active.data.current.item gali būti undefined, todėl TypeScript'as praleidžia
    setActiveItem(active.data.current?.item as BoardWorkItem);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;

    if (!over) return; // Numetė už lentos ribų

    const draggedItem = active.data.current?.item as BoardWorkItem | undefined;
    const targetStatus = over.data.current?.status as string | undefined;

    if (!draggedItem || !targetStatus) return;

    // Jei numetė į tą patį stulpelį - nieko nedarom
    const sourceStatus = boardData.columns.find(col => col.workItems.some(wi => wi.id === draggedItem.id))?.status;
    if (sourceStatus === targetStatus) return;

    try {
      // Optimizmas: prieš siunčiant į API, mums iš tikrųjų reikia pilnų kortelės duomenų,
      // nes updateWorkItem prašo pilno UpdateWorkItemRequest. 
      // Kadangi Lenta turi tik dalį info, geriausia pirma paimti pilną item:
      const fullItem = await getWorkItemById(draggedItem.id);
      
      const newStatusNum = STATUS_MAP[targetStatus] ?? 0;

      await updateWorkItem(draggedItem.id, {
        title: fullItem.title,
        description: fullItem.description ?? undefined,
        priority: STATUS_MAP[fullItem.priority] ?? 1, // Čia truputį hacky, bet API.ts priority laukia skaičiaus
        points: fullItem.points ?? undefined,
        assignedTo: fullItem.assignedMember?.id ?? null,
        iterationId: fullItem.iterationId,
        status: newStatusNum, // Naujas statusas!
      });

      // Sėkmingai atnaujinta - perkraunam lentą
      onBoardUpdate();
      
    } catch (error) {
      console.error('Failed to update status', error);
      toast({ variant: 'error', title: 'Error', description: 'Failed to update item status. Try again.' });
    }
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {boardData.columns.map(column => (
          <KanbanColumn key={column.status} column={column} />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <KanbanCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}