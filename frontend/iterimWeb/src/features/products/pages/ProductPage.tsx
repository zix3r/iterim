import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getProductById, deleteProduct } from '@/lib/api';
import type { ProductDetail } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditProductModal } from '@/features/products/components/EditProductModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingPage } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/dates';
import { AlertCircleIcon } from 'lucide-react';

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

  const loadProduct = () => {
    if (productId) {
      setIsLoading(true);
      setError(null);
      getProductById(Number(productId))
        .then(setProduct)
        .catch((err) => {
          console.error('Failed to load product:', err);
          setError('Failed to load product. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const handleDelete = async () => {
    if (!productId) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(Number(productId));
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Product deleted successfully'
      });
      navigate(`/org/${orgId}/products`);
    } catch (error) {
      console.error('Failed to delete product', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to delete product. Please try again.'
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) return <LoadingPage />;
  
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Product</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadProduct}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!product) return <div className="p-8">Product not found</div>;

  const isAdmin = product.userRole === 'Admin';

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: product.organizationName, href: `/org/${orgId}` },
          { label: 'Products', href: `/org/${orgId}/products` },
          { label: product.name }
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {product.description && (
            <p className="text-muted-foreground mt-2">{product.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.teamCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Product Content Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Overview</h2>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Product ID:</span> {product.id}
            </div>
            <div>
              <span className="font-medium">Organization:</span> {product.organizationName}
            </div>
            <div>
              <span className="font-medium">Created By:</span> {product.createdByName}
              <span className="text-muted-foreground text-sm ml-2">
                ({formatDate(product.createdAt)})
              </span>
            </div>
            <div>
              <span className="font-medium">Updated By:</span> {product.updatedByName}
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
