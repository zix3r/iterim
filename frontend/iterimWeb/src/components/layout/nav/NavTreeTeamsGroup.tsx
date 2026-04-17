import { useLocation } from 'react-router';
import { Users2 } from 'lucide-react';
import { useNavExpansion } from '@/hooks/useNavExpansion';
import { NavRow } from './NavRow';
import { NavTreeTeam } from './NavTreeTeam';
import type { DashboardTeam } from '@/lib/api';

interface Props {
  teams: DashboardTeam[];
  orgId: number;
  productId: number;
}

export function NavTreeTeamsGroup({ teams, orgId, productId }: Props) {
  const location = useLocation();
  const autoOpen = location.pathname.includes(`/products/${productId}/teams`);
  const [expanded, toggle] = useNavExpansion(`nav-expand-teams-${productId}`, autoOpen);

  return (
    <div>
      <NavRow
        to={`/org/${orgId}/products/${productId}/teams`}
        label="Teams"
        icon={Users2}
        depth={3}
        expandable
        expanded={expanded}
        onToggle={toggle}
        matchEnd
      />
      {expanded && (
        <div className="space-y-0.5">
          {teams.map((team) => (
            <NavTreeTeam key={team.id} team={team} orgId={orgId} productId={productId} />
          ))}
        </div>
      )}
    </div>
  );
}
