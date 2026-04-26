import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { usePinnedTeams } from '@/lib/favorites';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';

export function PinnedTeams() {
  const { pinnedTeams, togglePin } = usePinnedTeams();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

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
        title: t('common.error'),
        description: 'Failed to unpin team.',
      });
    }
  };

  return (
    <div className="space-y-1">
      {pinnedTeams.map(pt => {
        const teamPath = `/org/${pt.orgId}/products/${pt.productId}/teams/${pt.teamId}`;
        const active = location.pathname === teamPath;
        return (
          <Link
            key={pt.teamId}
            to={teamPath}
            className={cn(
              'group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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
                active ? "text-sidebar-primary-foreground/80 hover:text-sidebar-primary-foreground" : "text-sidebar-foreground/60 hover:text-red-500"
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
