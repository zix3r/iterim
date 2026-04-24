import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { Building2, Package, Users, Compass, LayoutDashboard } from 'lucide-react';
import { getRecentPages, clearRecentPages, type RecentPage } from '../../lib/recentPages';
import { Button } from '../ui/button';

export function RecentPages() {
  const [pages, setPages] = useState<RecentPage[]>([]);

  const fetchPages = async () => {
    const fetchedPages = await getRecentPages();
    setPages(fetchedPages);
  };

  useEffect(() => {
    fetchPages();

    const handler = () => {
      fetchPages();
    };

    window.addEventListener('recentPagesUpdated', handler);
    return () => window.removeEventListener('recentPagesUpdated', handler);
  }, []);

  const handleClear = async () => {
    await clearRecentPages();
  };

  if (pages.length === 0) {
    return null;
  }

  const getIcon = (type: string, active: boolean) => {
    const className = `h-4 w-4 ${active ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60'}`;
    switch (type) {
      case 'Org': return <Building2 className={className} />;
      case 'Product': return <Package className={className} />;
      case 'Team': return <Users className={className} />;
      case 'Dashboard': return <LayoutDashboard className={className} />;
      default: return <Compass className={className} />;
    }
  };

  return (
    <div>
      <div className="flex justify-end px-2 mb-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>
      <nav className="space-y-1">
        {pages.map((p, idx) => (
          <NavLink
            key={`${p.path}-${idx}`}
            to={p.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {getIcon(p.iconType, isActive)}
                {p.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}