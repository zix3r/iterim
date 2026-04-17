import { useNavigate } from 'react-router';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SegmentItem {
  id: string;
  label: string;
  href: string;
}

interface BreadcrumbSegmentProps {
  label: string;
  items: SegmentItem[];
  currentId: string;
  loading?: boolean;
}

export function BreadcrumbSegment({ label, items, currentId, loading }: BreadcrumbSegmentProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-zinc-200 animate-pulse w-20 h-4 rounded" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 h-8 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 gap-1"
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-zinc-400">
            No siblings available
          </DropdownMenuItem>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => navigate(item.href)}
              className={cn(
                'flex items-center gap-2',
                item.id === currentId && 'bg-zinc-100 font-medium',
              )}
            >
              <span className="w-4 shrink-0">
                {item.id === currentId && <Check className="h-3.5 w-3.5 text-zinc-600" />}
              </span>
              {item.label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
