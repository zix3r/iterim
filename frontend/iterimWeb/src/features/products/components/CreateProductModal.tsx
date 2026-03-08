import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createProduct } from '@/lib/api';
import type { CreateProductRequest } from '@/lib/api';

interface Props {
  orgId: number;
  onCreated: () => void;
}

export function CreateProductModal({ orgId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    try {
      await createProduct(orgId, formData);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Product created successfully'
      });
      setOpen(false);
      setFormData({ name: '', description: '' });
      onCreated(); // Atnaujiname sąrašą
    } catch (error) {
      console.error('Failed to create product', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to create product. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Product</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your organization.
          </DialogDescription>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
