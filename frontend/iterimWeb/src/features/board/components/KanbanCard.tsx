import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { BoardWorkItem, BoardBlocker, WorkItemDependency } from '@/lib/api';

function blockerToDepForModal(b: BoardBlocker): WorkItemDependency {
  return {
    dependencyId: b.dependencyId,
    workItemId: b.workItemId,
    title: b.title,
    status: b.status,
    type: '',
    description: null,
    points: null,
    teamId: b.teamId,
    teamName: b.teamName,
    productId: b.productId,
    productName: b.productName,
    orgId: b.orgId,
    assignedMember: null,
    tags: [],
    createdAt: '',
    updatedAt: '',
  };
}
import { TagBadge } from '@/components/shared/TagBadge';
import { Lock } from 'lucide-react';
import { DependencyDetailModal } from '@/features/backlog/components/DependencyDetailModal';

interface KanbanCardProps {
  item: BoardWorkItem;
  onClick?: () => void;
}

export function KanbanCard({ item, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { item },
  });

  const [lockPopupOpen, setLockPopupOpen] = useState(false);
  const [detailDep, setDetailDep] = useState<BoardBlocker | null>(null);
  const lockRef = useRef<HTMLButtonElement>(null);

  const blockers = item.blockers ?? [];
  const unfinishedBlockers = blockers.filter((b: BoardBlocker) => b.status !== 'Done');
  const isBlocked = unfinishedBlockers.length > 0;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.8 : 1,
      }
    : {};

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'story': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
      case 'bug': return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
      case 'task': return 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const initials = item.assignedMember?.fullName
    ? item.assignedMember.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '?';

  const formattedAssigneeName = item.assignedMember?.fullName
    ? item.assignedMember.fullName
        .split(' ')
        .filter(Boolean)
        .map((namePart, index) => (index === 0 ? namePart : `${namePart[0]}.`))
        .join(' ')
    : null;

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLockPopupOpen(prev => !prev);
  };

  const STATUS_ICON: Record<string, string> = {
    Done: '✓',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="relative">
      <Card
        onClick={onClick}
        className={`mb-3 border border-black/20 dark:border-white/25 transition-shadow cursor-pointer ${isDragging ? 'shadow-xl' : 'hover:shadow-md hover:border-black/35 dark:hover:border-white/40'}`}
      >
        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
          <div className="font-medium text-sm leading-tight flex-1">{item.title}</div>
          {isBlocked && (
            <button
              ref={lockRef}
              onClick={handleLockClick}
              className="shrink-0 p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-500 dark:text-amber-400 transition-colors"
              title={`Blokuojamas: ${unfinishedBlockers.map(b => b.title).join(', ')}`}
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 flex flex-col gap-2">

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {item.tags.slice(0, 3).map(tag => (
                <TagBadge key={tag.id} tag={tag} size="xs" />
              ))}
              {item.tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground self-center">+{item.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${getBadgeColor(item.type)}`}>
              {item.type.toUpperCase()}
            </Badge>
            {item.points !== null && (
              <span className="text-xs font-mono font-semibold bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground">
                {item.points}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            {item.assignedMember ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={item.assignedMember.avatarUrl ?? undefined} alt={item.assignedMember.fullName} />
                  <AvatarFallback className="text-[9px] bg-primary/10">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-medium truncate max-w-[180px]" title={item.assignedMember.fullName}>
                  {formattedAssigneeName}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Lock popup */}
      {lockPopupOpen && isBlocked && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-64 bg-popover border rounded-lg shadow-lg p-3 space-y-1.5"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-xs font-medium text-muted-foreground mb-2">Blokeriai</div>
          {blockers.map((b: BoardBlocker) => (
            <button
              key={b.dependencyId}
              onClick={() => { setDetailDep(b); setLockPopupOpen(false); }}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 text-sm transition-colors"
            >
              <span className={`text-xs ${b.status === 'Done' ? 'text-green-500' : 'text-amber-500'}`}>
                {STATUS_ICON[b.status] ?? '✗'}
              </span>
              <span className="flex-1 truncate">{b.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">{b.status}</span>
            </button>
          ))}
          <button
            onClick={() => setLockPopupOpen(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground mt-1 pt-1 border-t text-center"
          >
            Uždaryti
          </button>
        </div>
      )}

      <DependencyDetailModal
        dependency={detailDep ? blockerToDepForModal(detailDep) : null}
        direction="blockedBy"
        open={!!detailDep}
        onOpenChange={v => { if (!v) setDetailDep(null); }}
      />
    </div>
  );
}
