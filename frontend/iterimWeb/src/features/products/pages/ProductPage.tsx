import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getProductById, deleteProduct } from '@/lib/api';
import type { ProductDetail } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditProductModal } from '@/features/products/components/EditProductModal';
import { CreateTeamModal } from '@/features/teams/components/CreateTeamModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/dates';
import { AlertCircleIcon } from 'lucide-react';
import { addRecentPage } from '@/lib/recentPages';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

export function ProductPage() {
  const { orgId, productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (product && orgId && productId) {
      addRecentPage({
        path: `/org/${orgId}/products/${productId}`,
        label: product.name,
        iconType: 'Product'
      });
    }
  }, [product, orgId, productId]);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProductById(Number(productId));
      setProduct(data);
    } catch (err) {
      console.error('Failed to load product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleDelete = async () => {
    if (!productId) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(Number(productId));
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('products.deleted')
      });
      navigate(`/org/${orgId}/products`);
    } catch (err) {
      console.error('Failed to delete product', err);
      const errorMessage = err instanceof Error ? err.message : t('products.failedDelete');
      toast({
        variant: 'error',
        title: t('common.error'),
        description: errorMessage
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // 1. SKELETON BŪSENA (Krovimosi metu)
  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" /> {/* Title */}
            <Skeleton className="h-4 w-96" /> {/* Description */}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" /> {/* Button */}
            <Skeleton className="h-10 w-24 rounded-md" /> {/* Button */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card><CardContent className="p-6"><Skeleton className="h-12 w-32" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-12 w-32" /></CardContent></Card>
        </div>

        <div className="space-y-4 mt-8">
           <Skeleton className="h-6 w-32" />
           <Card className="p-6 space-y-4">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-full max-w-sm" />
              <Skeleton className="h-4 w-full max-w-lg" />
           </Card>
        </div>
      </div>
    );
  }
  
  // 2. KLAIDOS BŪSENA
  if (error || !product) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircleIcon className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Product</h3>
          <p className="text-sm text-red-700">{error || "Product not found."}</p>
          <Button onClick={loadProduct} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = product.userRole === 'Admin';

  // 3. SĖKMINGA BŪSENA
  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {product.description && (
            <p className="text-muted-foreground mt-2">{product.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <CreateTeamModal productId={Number(productId)} onCreated={loadProduct} />
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                {t('common.edit')}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                {t('common.delete')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate(`/org/${orgId}/products/${productId}/teams`)}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('products.team')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.teamCount}</div>
            <Button
              variant="link"
              className="p-0 h-auto mt-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/org/${orgId}/products/${productId}/teams`);
              }}
            >
              {t('common.actions')} →
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('common.status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{t('products.statusActive')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Product Content Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('products.overview')}</h2>
        <Card>
          <CardHeader>
            <CardTitle>{t('products.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">{t('products.productId')}:</span> {product.id}
            </div>
            <div>
              <span className="font-medium">{t('products.organization')}:</span> {product.organizationName}
            </div>
            <div>
              <span className="font-medium">{t('products.createdBy')}:</span> {product.createdByName}
              <span className="text-muted-foreground text-sm ml-2">
                ({formatDate(product.createdAt)})
              </span>
            </div>
            <div>
              <span className="font-medium">{t('products.updatedBy')}:</span> {product.updatedByName}
              <span className="text-muted-foreground text-sm ml-2">
                ({formatDate(product.updatedAt)})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {isAdmin && (
        <EditProductModal
          product={product}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdated={loadProduct}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}