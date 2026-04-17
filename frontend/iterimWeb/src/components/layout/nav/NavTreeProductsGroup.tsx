import { useLocation } from 'react-router';
import { Package } from 'lucide-react';
import { useNavExpansion } from '@/hooks/useNavExpansion';
import { NavRow } from './NavRow';
import { NavTreeProduct } from './NavTreeProduct';
import type { DashboardProduct } from '@/lib/api';

interface Props {
  products: DashboardProduct[];
  orgId: number;
}

export function NavTreeProductsGroup({ products, orgId }: Props) {
  const location = useLocation();
  const autoOpen = location.pathname.includes(`/org/${orgId}/products`);
  const [expanded, toggle] = useNavExpansion(`nav-expand-products-${orgId}`, autoOpen);

  return (
    <div>
      <NavRow
        to={`/org/${orgId}/products`}
        label="Products"
        icon={Package}
        depth={1}
        expandable
        expanded={expanded}
        onToggle={toggle}
        matchEnd
      />
      {expanded && (
        <div className="space-y-0.5">
          {products.map((product) => (
            <NavTreeProduct key={product.id} product={product} orgId={orgId} />
          ))}
        </div>
      )}
    </div>
  );
}
