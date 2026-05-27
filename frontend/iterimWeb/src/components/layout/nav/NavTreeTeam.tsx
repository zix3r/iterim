import { useLocation } from 'react-router';
// Pridėta CalendarRange ikona
import { Users2, ClipboardList, LayoutGrid, BarChart2, CalendarRange } from 'lucide-react';
import { useNavExpansion } from '@/hooks/useNavExpansion';
import { NavRow } from './NavRow';
import type { DashboardTeam } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  team: DashboardTeam;
  orgId: number;
  productId: number;
}

export function NavTreeTeam({ team, orgId, productId }: Props) {
  const location = useLocation();
  const { t } = useLanguage();
  const base = `/org/${orgId}/products/${productId}/teams/${team.id}`;
  const autoOpen = location.pathname.includes(`/teams/${team.id}`);
  const [expanded, toggle] = useNavExpansion(`nav-expand-team-${team.id}`, autoOpen);

  return (
    <div>
      <NavRow
        to={base}
        label={team.name}
        icon={Users2}
        depth={4}
        expandable
        expanded={expanded}
        onToggle={toggle}
        matchEnd
      />
      {expanded && (
        <div className="space-y-0.5">
          <NavRow to={`${base}/backlog`} label={t('layout.breadcrumbBacklog')} icon={ClipboardList} depth={5} />
          <NavRow to={`${base}/board`} label={t('layout.breadcrumbBoard')} icon={LayoutGrid} depth={5} />
          
          <NavRow
            to={`${base}/quarter`}
            label={t('quarterPlan.recentPageLabel')}
            icon={CalendarRange}
            depth={5}
          />

          <NavRow to={`${base}/metrics`} label={t('layout.breadcrumbMetrics')} icon={BarChart2} depth={5} />
        </div>
      )}
    </div>
  );
}