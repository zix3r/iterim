import { useLocation } from 'react-router';
import { Users2, ClipboardList, LayoutGrid, BarChart2 } from 'lucide-react';
import { useNavExpansion } from '@/hooks/useNavExpansion';
import { NavRow } from './NavRow';
import type { DashboardTeam } from '@/lib/api';

interface Props {
  team: DashboardTeam;
  orgId: number;
  productId: number;
}

export function NavTreeTeam({ team, orgId, productId }: Props) {
  const location = useLocation();
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
          <NavRow to={`${base}/backlog`} label="Backlog" icon={ClipboardList} depth={5} />
          <NavRow to={`${base}/board`} label="Board" icon={LayoutGrid} depth={5} />
          <NavRow to={`${base}/metrics`} label="Metrics" icon={BarChart2} depth={5} />
        </div>
      )}
    </div>
  );
}
