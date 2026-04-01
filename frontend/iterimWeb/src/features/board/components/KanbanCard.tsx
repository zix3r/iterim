import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { BoardWorkItem } from '@/lib/api';

interface KanbanCardProps {
  item: BoardWorkItem;
  onClick?: () => void;
}

export function KanbanCard({ item, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { item },
  });

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
    ? item.assignedMember.fullName.substring(0, 2).toUpperCase()
    : '?';

  const formattedAssigneeName = item.assignedMember?.fullName
    ? item.assignedMember.fullName
        .split(' ')
        .filter(Boolean)
        .map((namePart, index) => (index === 0 ? namePart : `${namePart[0]}.`))
        .join(' ')
    : null;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card 
        onClick={onClick} 
        className={`mb-3 transition-shadow cursor-pointer ${isDragging ? 'shadow-xl' : 'hover:shadow-md border-transparent hover:border-primary/20'}`}
      >
        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
          <div className="font-medium text-sm leading-tight">{item.title}</div>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex flex-col gap-2">
          
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
    </div>
  );
}