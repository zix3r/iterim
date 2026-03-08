import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getProductsByOrganization, getOrganizationById } from '@/lib/api';
import type { Product, OrganizationDetail } from '@/lib/api';
import { ProductCard } from '@/features/products/components/ProductCard';
import { CreateProductModal } from '@/features/products/components/CreateProductModal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingPage } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { PackageIcon, AlertCircleIcon } from 'lucide-react';

export function ProductsListPage() {
  const { orgId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = () => {
    if (orgId) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getProductsByOrganization(Number(orgId)),
        getOrganizationById(Number(orgId))
      ])
        .then(([productsData, orgData]) => {
          setProducts(productsData);
          setOrganization(orgData);
        })
        .catch((err) => {
          console.error('Failed to load products:', err);
          setError('Failed to load products. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    loadProducts();
  }, [orgId]);

  if (isLoading) return <LoadingPage />;
  
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Products</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadProducts}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  if (!organization) return <div className="p-8">Organization not found</div>;

  const isAdmin = organization.userRole === 'Admin';

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: organization.name, href: `/org/${orgId}` },
          { label: 'Products' }
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">{organization.name}</p>
        </div>
        {isAdmin && <CreateProductModal orgId={Number(orgId)} onCreated={loadProducts} />}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <PackageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin 
              ? 'Get started by creating your first product.' 
              : 'No products have been created in this organization yet.'}
          </p>
          {isAdmin && <CreateProductModal orgId={Number(orgId)} onCreated={loadProducts} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
