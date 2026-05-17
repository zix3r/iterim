import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Lock, ArrowRight, MessageSquare } from 'lucide-react';
import type { WorkItem } from '@/lib/api';
import { TagBadge } from '@/components/shared/TagBadge';
import { Checkbox } from '@/components/ui/checkbox';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Story: { label: 'STORY', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Task: { label: 'TASK', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  Bug: { label: 'BUG', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  Critical: { color: 'text-red-600' },
  High: { color: 'text-orange-500' },
  Medium: { color: 'text-yellow-500' },
  Low: { color: 'text-gray-400' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Backlog: { label: 'Backlog', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  Todo: { label: 'To Do', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  InProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  Review: { label: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  Done: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

interface Props {
  item: WorkItem;
  readOnly?: boolean;
  onClick: (item: WorkItem) => void;
  isSelected?: boolean;
  onToggleSelection?: (id: number) => void;
}

export function WorkItemRow({ item, readOnly = false, onClick, isSelected = false, onToggleSelection }: Props) {
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
      ref={readOnly ? undefined : setNodeRef}
      style={style}
      // PAKEITIMAS: Uždėti attributes ir listeners ant konteinerio (jei ne readOnly).
      {...(readOnly ? {} : attributes)}
      {...(readOnly ? {} : listeners)}
      className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-card transition-colors group ${
        readOnly ? '' : 'cursor-grab active:cursor-grabbing hover:bg-muted/40'
      } ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary/30 z-10' : ''}`}
    >
      {/* Checkbox (rodomas, jei ne readOnly) */}
      {!readOnly && (
        <div 
          className="shrink-0 flex items-center justify-center cursor-default"
          // Sustabdome draginimą ir atidarymą kai spaudžiame Checkbox
          onPointerDown={(e) => e.stopPropagation()} 
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection?.(item.id)}
            aria-label={`Select ${item.title}`}
          />
        </div>
      )}

      {/* Type badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${typeConfig.color}`}>
        {typeConfig.label}
      </span>

      
      {/* Title - Pataisyta: leidžiame tempti per vidurį */}
      <div className="flex-1 min-w-0 flex items-center">
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClick(item);
          }}
          className="text-sm font-medium truncate hover:underline text-left cursor-pointer"
        >
          {item.title}
        </span>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <span className="flex items-center gap-0.5 shrink-0">
          {item.tags.slice(0, 3).map(tag => (
            <TagBadge key={tag.id} tag={tag} size="xs" />
          ))}
          {item.tags.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{item.tags.length - 3}</span>
          )}
        </span>
      )}

      {/* Dependency badges */}
      {item.blockerCount > 0 && (
        <span
          className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          title={`${item.blockerCount} bloker${item.blockerCount === 1 ? 'is' : 'iai'}`}
        >
          <Lock className="h-2.5 w-2.5" />
          {item.blockerCount}
        </span>
      )}
      {item.blocksCount > 0 && (
        <span
          className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          title={`Blokuoja ${item.blocksCount}`}
        >
          <ArrowRight className="h-2.5 w-2.5" />
          {item.blocksCount}
        </span>
      )}

      {/* Comment count */}
      {item.commentCount > 0 && (
        <span
          className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
          title={`${item.commentCount} comment${item.commentCount === 1 ? '' : 's'}`}
        >
          <MessageSquare className="h-2.5 w-2.5" />
          {item.commentCount}
        </span>
      )}

      {/* Status */}
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded shrink-0 ${statusConfig.color}`}>
        {statusConfig.label}
      </span>

      {/* Assignee */}
      <span className="text-xs text-muted-foreground shrink-0 w-24 truncate text-right flex items-center justify-end gap-1">
        {item.assignedMember ? (
          <>
            <User className="h-3 w-3" />
            {item.assignedMember.userName.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' ')}
          </>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </span>

      {/* Points */}
      <span className={`text-xs font-mono font-semibold shrink-0 w-8 text-center rounded py-0.5 ${item.points ? 'bg-secondary/50 text-foreground/80' : 'text-muted-foreground/30'
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