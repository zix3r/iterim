import { useLocation } from 'react-router';
import { Package } from 'lucide-react';
import { useNavExpansion } from '@/hooks/useNavExpansion';
import { NavRow } from './NavRow';
import { NavTreeProduct } from './NavTreeProduct';
import type { DashboardProduct } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  products: DashboardProduct[];
  orgId: number;
}

export function NavTreeProductsGroup({ products, orgId }: Props) {
  const location = useLocation();
  const { t } = useLanguage();
  const autoOpen = location.pathname.includes(`/org/${orgId}/products`);
  const [expanded, toggle] = useNavExpansion(`nav-expand-products-${orgId}`, autoOpen);

  return (
    <div>
      <NavRow
        to={`/org/${orgId}/products`}
        label={t('layout.breadcrumbProducts')}
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
