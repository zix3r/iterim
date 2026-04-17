import { useLocation } from 'react-router';
import { Building2, CalendarX2 } from 'lucide-react';
import { useNavExpansion } from '@/hooks/useNavExpansion';
import { NavRow } from './NavRow';
import { NavTreeProductsGroup } from './NavTreeProductsGroup';
import type { DashboardOrganization } from '@/lib/api';

interface Props {
  org: DashboardOrganization;
}

export function NavTreeOrg({ org }: Props) {
  const location = useLocation();
  const autoOpen = location.pathname.includes(`/org/${org.id}`);
  const [expanded, toggle] = useNavExpansion(`nav-expand-org-${org.id}`, autoOpen);

  return (
    <div>
      <NavRow
        to={`/org/${org.id}`}
        label={org.name}
        icon={Building2}
        depth={0}
        expandable
        expanded={expanded}
        onToggle={toggle}
        matchEnd
      />
      {expanded && (
        <div className="space-y-0.5">
          <NavRow to={`/org/${org.id}/absences`} label="Absences" icon={CalendarX2} depth={1} />
          <NavTreeProductsGroup products={org.products} orgId={org.id} />
        </div>
      )}
    </div>
  );
}
