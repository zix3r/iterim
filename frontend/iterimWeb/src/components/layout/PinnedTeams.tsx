import { Star, X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { usePinnedTeams } from '@/lib/favorites';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export function PinnedTeams() {
  const { pinnedTeams, isPinned, togglePin } = usePinnedTeams();
  const location = useLocation();
  const { toast } = useToast();

  if (pinnedTeams.length === 0) return null;

  const handleUnpin = async (e: React.MouseEvent, teamId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await togglePin(teamId, true);
      toast({
        variant: 'success',
        title: 'Unpinned',
        description: 'Team removed from pinned list.',
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to unpin team.',
      });
    }
  };

  return (
    <div className="mt-6 space-y-1">
      <div className="px-2 mb-2 flex items-center justify-between group">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-current text-zinc-400" /> Pinned
        </h3>
      </div>
      
      {pinnedTeams.map(pt => {
        const active = location.pathname.includes(pt.path) || location.pathname.includes(`/teams/${pt.teamId}`);
        return (
          <Link
            key={pt.teamId}
            to={pt.path}
            className={cn(
              'group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-zinc-900 text-white shadow-md'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            )}
          >
            <div className="flex items-center gap-3 truncate w-[calc(100%-20px)]">
              {/* Optional: Add a small icon or badge */}
              <span className="truncate">{pt.teamName}</span>
            </div>
            
            <button
              onClick={(e) => handleUnpin(e, pt.teamId)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                active ? "text-zinc-300 hover:text-white" : "text-zinc-400 hover:text-red-500"
              )}
              title="Unpin team"
            >
              <X className="h-4 w-4" />
            </button>
          </Link>
        );
      })}
    </div>
  );
}
