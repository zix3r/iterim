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

  const getIcon = (type: string) => {
    switch (type) {
      case 'Org': return <Building2 className="w-5 h-5 mr-3 text-slate-300" />;
      case 'Product': return <Package className="w-5 h-5 mr-3 text-slate-300" />;
      case 'Team': return <Users className="w-5 h-5 mr-3 text-slate-300" />;
      case 'Dashboard': return <LayoutDashboard className="w-5 h-5 mr-3 text-slate-300" />;
      default: return <Compass className="w-5 h-5 mr-3 text-slate-300" />;
    }
  };

  return (
    <div className="mt-8 ml-4">
      <div className="flex items-center justify-between mb-2 mr-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Recent Pages
        </h2>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-400 hover:text-white" onClick={handleClear}>
          Clear
        </Button>
      </div>
      <nav className="space-y-1">
        {pages.map((p, idx) => (
          <NavLink
            key={`${p.path}-${idx}`}
            to={p.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {getIcon(p.iconType)}
            {p.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}