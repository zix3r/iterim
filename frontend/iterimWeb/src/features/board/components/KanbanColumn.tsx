import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import type { BoardColumn } from '@/lib/api';

interface KanbanColumnProps {
  column: BoardColumn;
  onCardClick: (id: number) => void;
}

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.status}`,
    data: { status: column.status },
  });

  const formatStatus = (status: string) => {
    switch(status) {
      case 'Todo': return 'To Do';
      case 'InProgress': return 'In Progress';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col min-w-[300px] w-[300px] flex-shrink-0 bg-secondary/30 rounded-lg overflow-hidden border">
      <div className="p-3 bg-secondary/50 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm text-foreground/80">{formatStatus(column.status)}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="bg-background px-1.5 py-0.5 rounded-md border">{column.workItems.length}</span>
          {column.totalPoints > 0 && <span>{column.totalPoints} pts</span>}
        </div>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`p-3 flex-1 overflow-y-auto transition-colors ${isOver ? 'bg-secondary/60 ring-2 ring-primary/20 inset-0' : ''}`}
      >
        {column.workItems.map(item => (
          <KanbanCard 
            key={item.id} 
            item={item} 
            onClick={() => onCardClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
}