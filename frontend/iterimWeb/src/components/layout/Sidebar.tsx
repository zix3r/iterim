import { Link, useLocation, useNavigate } from 'react-router';
import { PinnedTeams } from './PinnedTeams';
import { LayoutDashboard, LogOut, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { RecentPages } from './RecentPages';
import { NavTree } from './nav/NavTree';
import { CollapsibleSection } from './nav/CollapsibleSection';
import { usePinnedTeams } from '@/lib/favorites';

export function SidebarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pinnedTeams } = usePinnedTeams();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-zinc-50 border-r border-zinc-200">
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">

          {/* Dashboard */}
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              location.pathname === '/dashboard'
                ? 'bg-zinc-900 text-white shadow-md'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            )}
          >
            <LayoutDashboard
              className={cn(
                'h-4 w-4',
                location.pathname === '/dashboard' ? 'text-white' : 'text-zinc-400',
              )}
            />
            Dashboard
          </Link>

          {/* Pinned Teams */}
          {pinnedTeams.length > 0 && (
            <div className="mt-4">
              <CollapsibleSection title="Pinned" storageKey="nav-collapse-pinned">
                <PinnedTeams />
              </CollapsibleSection>
            </div>
          )}

          {/* My Organizations tree */}
          <div className="mt-4">
            <div className="px-2 mb-2">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">My Organizations</h3>
            </div>
            <NavTree />
          </div>

          {/* Recent Pages */}
          <div className="mt-4">
            <CollapsibleSection title="Recent Pages" storageKey="nav-collapse-recent">
              <RecentPages />
            </CollapsibleSection>
          </div>

        </div>
      </div>

      {/* BOTTOM: User & Logout */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-100/50">
        {user && (
          <Link
            to="/profile"
            className="mb-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-200/80"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <span className="shrink-0 text-zinc-500">
              <Pencil className="h-4 w-4" />
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 transition-colors gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-80 flex-col z-10">
      <SidebarContent />
    </aside>
  );
}
