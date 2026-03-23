import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { BoardWorkItem } from '@/lib/api';

interface KanbanCardProps {
  item: BoardWorkItem;
}

export function KanbanCard({ item }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { item }, // Perduodame item duomenis, kad žinotume, ką velkame
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.8 : 1,
        cursor: 'grab',
      }
    : { cursor: 'grab' };

  // Helperis Badge spalvoms
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

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className={`mb-3 hover:shadow-md transition-shadow ${isDragging ? 'shadow-xl' : ''}`}>
        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
          <div className="font-medium text-sm leading-tight">{item.title}</div>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex items-center justify-between">
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
          {item.assignedMember && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/10">{initials}</AvatarFallback>
            </Avatar>
          )}
        </CardContent>
      </Card>
    </div>
  );
}