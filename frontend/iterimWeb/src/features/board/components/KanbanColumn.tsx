import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import type { BoardColumn } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface KanbanColumnProps {
  column: BoardColumn;
  onCardClick: (id: number) => void;
}

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.status}`,
    data: { status: column.status },
  });

  const formatStatus = (status: string) => {
    switch(status) {
      case 'Todo': return t('board.todo');
      case 'InProgress': return t('board.inProgress');
      case 'Review': return t('board.review');
      case 'Done': return t('board.done');
      case 'Blocked': return t('board.blocked');
      default: return status;
    }
  };

  return (
    <div className="flex flex-col min-w-[260px] w-[260px] flex-shrink-0 bg-secondary/30 rounded-md overflow-hidden border">
      <div className="px-2.5 py-1.5 bg-secondary/50 border-b flex justify-between items-center">
        <h3 className="font-semibold text-xs uppercase tracking-wide text-foreground/70">{formatStatus(column.status)}</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <span className="bg-background px-1.5 py-0 leading-4 rounded border">{column.workItems.length}</span>
          {column.totalPoints > 0 && <span>{column.totalPoints} pts</span>}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`p-1.5 flex-1 overflow-y-auto transition-colors ${isOver ? 'bg-secondary/60 ring-2 ring-primary/20 inset-0' : ''}`}
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