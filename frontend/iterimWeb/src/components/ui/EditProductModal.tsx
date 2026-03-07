import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { updateProduct } from '@/lib/api';
import type { UpdateProductRequest, ProductDetail } from '@/lib/api';

interface Props {
  product: ProductDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditProductModal({ product, open, onOpenChange, onUpdated }: Props) {
  const [formData, setFormData] = useState<UpdateProductRequest>({
    name: product.name,
    description: product.description || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData({
        name: product.name,
        description: product.description || '',
      });
      setHasChanges(false);
    }
  }, [open, product]);

  useEffect(() => {
    const changed = formData.name !== product.name || 
                   (formData.description || '') !== (product.description || '');
    setHasChanges(changed);
  }, [formData, product]);

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    try {
      await updateProduct(product.id, formData);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Product updated successfully'
      });
      onOpenChange(false);
      onUpdated(); // Refresh product data
    } catch (error) {
      console.error('Failed to update product', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to update product. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">Product Name</label>
            <Input 
              id="name"
              placeholder="My Product" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
            <Textarea 
              id="description"
              placeholder="Product description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim() || !hasChanges}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
