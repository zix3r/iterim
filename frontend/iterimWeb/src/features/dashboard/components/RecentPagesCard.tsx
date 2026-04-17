import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, Building2, Package, Users, LayoutDashboard, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRecentPages, type RecentPage } from '@/lib/recentPages';

function iconForType(iconType: string) {
  switch (iconType) {
    case 'Organization':
      return <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />;
    case 'Product':
      return <Package className="h-4 w-4 text-zinc-400 shrink-0" />;
    case 'Team':
      return <Users className="h-4 w-4 text-zinc-400 shrink-0" />;
    case 'Dashboard':
      return <LayoutDashboard className="h-4 w-4 text-zinc-400 shrink-0" />;
    default:
      return <Compass className="h-4 w-4 text-zinc-400 shrink-0" />;
  }
}

export function RecentPagesCard() {
  const [pages, setPages] = useState<RecentPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    getRecentPages()
      .then((data) => setPages(data.slice(0, 8)))
      .catch(() => setPages([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();

    const handler = () => load();
    window.addEventListener('recentPagesUpdated', handler);
    return () => window.removeEventListener('recentPagesUpdated', handler);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
          <Clock className="h-4 w-4 text-zinc-500" />
          Recent Pages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-200 animate-pulse h-8 rounded-md" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity yet.</p>
        ) : (
          <div className="space-y-1">
            {pages.map((page, idx) => (
              <div
                key={idx}
                onClick={() => navigate(page.path)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                {iconForType(page.iconType)}
                <div className="min-w-0">
                  <p className="text-sm text-zinc-800 truncate">{page.label}</p>
                  <p className="text-xs text-zinc-400 truncate">{page.path}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
