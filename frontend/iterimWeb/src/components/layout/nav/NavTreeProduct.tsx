import { useLocation } from 'react-router';
import { Package } from 'lucide-react';
import { useNavExpansion } from '@/hooks/useNavExpansion';
import { NavRow } from './NavRow';
import { NavTreeTeamsGroup } from './NavTreeTeamsGroup';
import type { DashboardProduct } from '@/lib/api';

interface Props {
  product: DashboardProduct;
  orgId: number;
}

export function NavTreeProduct({ product, orgId }: Props) {
  const location = useLocation();
  const autoOpen = location.pathname.includes(`/products/${product.id}`);
  const [expanded, toggle] = useNavExpansion(`nav-expand-product-${product.id}`, autoOpen);

  return (
    <div>
      <NavRow
        to={`/org/${orgId}/products/${product.id}`}
        label={product.name}
        icon={Package}
        depth={2}
        expandable
        expanded={expanded}
        onToggle={toggle}
        matchEnd
      />
      {expanded && (
        <div className="space-y-0.5">
          <NavTreeTeamsGroup teams={product.teams} orgId={orgId} productId={product.id} />
        </div>
      )}
    </div>
  );
}
