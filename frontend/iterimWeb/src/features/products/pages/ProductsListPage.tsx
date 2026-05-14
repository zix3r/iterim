import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { getProductsByOrganization, getOrganizationById } from '@/lib/api';
import type { Product, OrganizationDetail } from '@/lib/api';
import { ProductCard } from '@/features/products/components/ProductCard';
import { CreateProductModal } from '@/features/products/components/CreateProductModal';
import { Button } from '@/components/ui/button';
import { Package, AlertCircleIcon } from 'lucide-react';
import { addRecentPage } from '@/lib/recentPages';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useLanguage } from '@/context/LanguageContext';

export function ProductsListPage() {
  const { orgId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  // Išsprendžiame setState useEffect viduje problemą naudodami useCallback ir async/await
  const loadProducts = useCallback(async () => {
    if (!orgId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const [productsData, orgData] = await Promise.all([
        getProductsByOrganization(Number(orgId)),
        getOrganizationById(Number(orgId))
      ]);
      setProducts(productsData);
      setOrganization(orgData);
    } catch (err) {
      console.error('Failed to load products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (organization && orgId) {
      addRecentPage({
        path: `/org/${orgId}/products`,
        label: `${organization.name} — Products`,
        iconType: 'Org',
      });
    }
  }, [organization, orgId]);

  // 1. SKELETON BŪSENA
  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* Title */}
            <Skeleton className="h-4 w-32" /> {/* Subtitle */}
          </div>
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Button */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  // 2. KLAIDOS BŪSENA
  if (error || !organization) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircleIcon className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">{t('products.failedLoad')}</h3>
          <p className="text-sm text-red-700">{error || t('common.notFound')}</p>
          <Button onClick={loadProducts} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = organization.userRole === 'Admin';

  // 3. SĖKMINGA BŪSENA
  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('products.title')}</h1>
          <p className="text-muted-foreground">{organization.name}</p>
        </div>
        {isAdmin && <CreateProductModal orgId={Number(orgId)} onCreated={loadProducts} />}
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={t('products.noProducts')}
          description={isAdmin
            ? t('products.createFirst')
            : t('products.noProducts')}
          icon={<Package className="h-8 w-8" />}
          action={isAdmin ? <CreateProductModal orgId={Number(orgId)} onCreated={loadProducts} /> : undefined}
        />
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