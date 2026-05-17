import { Link, useLocation } from 'react-router';
import { PinnedTeams } from './PinnedTeams';
import { LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { RecentPages } from './RecentPages';
import { NavTree } from './nav/NavTree';
import { CollapsibleSection } from './nav/CollapsibleSection';
import { usePinnedTeams } from '@/lib/favorites';

export function SidebarContent() {
  const location = useLocation();
  const { pinnedTeams } = usePinnedTeams();
  const { t } = useLanguage();

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground overflow-hidden">
      {/* Top fixed: Dashboard + Pinned */}
      <div className="shrink-0 pt-3 px-2 space-y-0.5">
        <Link
          to="/dashboard"
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
            location.pathname === '/dashboard'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )}
        >
          <LayoutDashboard
            className={cn(
              'h-3.5 w-3.5',
              location.pathname === '/dashboard' ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60',
            )}
          />
          {t('sidebar.dashboard')}
        </Link>

        {pinnedTeams.length > 0 && (
          <div className="mt-3">
            <CollapsibleSection title={t('sidebar.pinned')} storageKey="nav-collapse-pinned">
              <PinnedTeams />
            </CollapsibleSection>
          </div>
        )}
      </div>

      {/* Scrollable: My Organizations tree only */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 mt-3">
        <div className="px-2 mb-1">
          <h3 className="text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-widest">{t('sidebar.myOrganizations')}</h3>
        </div>
        <NavTree />
      </div>

      {/* Bottom fixed: Recent Pages */}
      <div className="shrink-0 px-2 pt-4 pb-8">
        <CollapsibleSection title={t('sidebar.recentPages')} storageKey="nav-collapse-recent">
          <RecentPages />
        </CollapsibleSection>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-[17.5rem] flex-col z-10">
      <SidebarContent />
    </aside>
  );
}