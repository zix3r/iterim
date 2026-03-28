import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User } from 'lucide-react';
import type { WorkItem } from '@/lib/api';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Story: { label: 'STORY', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Task:  { label: 'TASK',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  Bug:   { label: 'BUG',   color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  Critical: { color: 'text-red-600' },
  High:     { color: 'text-orange-500' },
  Medium:   { color: 'text-yellow-500' },
  Low:      { color: 'text-gray-400' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Backlog:    { label: 'Backlog',     color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  Todo:       { label: 'To Do',       color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  InProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  Review:     { label: 'Review',      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  Done:       { label: 'Done',        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

interface Props {
  item: WorkItem;
  onClick: (item: WorkItem) => void;
}

export function WorkItemRow({ item, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `wi-${item.id}`,
    data: { type: 'workitem', item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConfig = TYPE_CONFIG[item.type] ?? { label: item.type, color: 'bg-gray-100 text-gray-600' };
  const priorityConfig = PRIORITY_CONFIG[item.priority] ?? { color: 'text-gray-400' };
  const statusConfig = STATUS_CONFIG[item.status] ?? { label: item.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-card hover:bg-muted/40 transition-colors group cursor-pointer ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary/30' : ''
      }`}
      onClick={() => onClick(item)}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Type badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${typeConfig.color}`}>
        {typeConfig.label}
      </span>

      {/* Title */}
      <span className="flex-1 text-sm font-medium truncate">{item.title}</span>

      {/* Status */}
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded shrink-0 ${statusConfig.color}`}>
        {statusConfig.label}
      </span>

      {/* Assignee */}
      <span className="text-xs text-muted-foreground shrink-0 w-24 truncate text-right flex items-center justify-end gap-1">
        {item.assignedMember ? (
          <>
            <User className="h-3 w-3" />
            {item.assignedMember.userName}
          </>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </span>

      {/* Points */}
      <span className={`text-xs font-mono font-semibold shrink-0 w-8 text-center rounded py-0.5 ${
        item.points ? 'bg-secondary/50 text-foreground/80' : 'text-muted-foreground/30'
      }`}>
        {item.points ?? '—'}
      </span>

      {/* Priority dot */}
      <span className={`shrink-0 ${priorityConfig.color}`} title={item.priority}>
        ●
      </span>
    </div>
  );
}
