import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { updateProduct } from '@/lib/api';
import type { UpdateProductRequest, ProductDetail } from '@/lib/api';
import { maxLength, required } from '@/lib/validation';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  product: ProductDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditProductModal({ product, open, onOpenChange, onUpdated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation<UpdateProductRequest>(
    {
      name: product.name,
      description: product.description || '',
    },
    {
      name: [required('Product name'), maxLength('Product name', 100)],
      description: [maxLength('Description', 500)],
    },
  );

  const getMessageFromError = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  useEffect(() => {
    if (open) {
      resetForm({
        name: product.name,
        description: product.description || '',
      });
      setHasChanges(false);
    }
  }, [open, product, resetForm]);

  useEffect(() => {
    const changed = values.name !== product.name ||
                   (values.description || '') !== (product.description || '');
    setHasChanges(changed);
  }, [values, product]);

  const handleClose = () => {
    if (hasChanges) {
      if (confirm(t('validation.fieldRequired'))) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'warning',
        title: t('validation.fieldRequired'),
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await updateProduct(product.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('products.failedUpdate')
      });
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: getMessageFromError(error, t('products.failedUpdate'))
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('products.editTitle')}</DialogTitle>
          <DialogDescription>
            Update product information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Product Name <span className="text-destructive">*</span>
            </label>
            <Input 
              id="name"
              placeholder="My Product" 
              value={values.name}
              onChange={(e) => setFieldValue('name', e.target.value)}
              disabled={isLoading}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'edit-product-name-error' : undefined}
            />
            <FieldError id="edit-product-name-error" message={errors.name} />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
            <Textarea 
              id="description"
              placeholder="Product description" 
              value={values.description}
              onChange={(e) => setFieldValue('description', e.target.value)}
              disabled={isLoading}
              rows={4}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'edit-product-description-error' : undefined}
            />
            <FieldError id="edit-product-description-error" message={errors.description} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !hasChanges}>
              {isLoading ? t('common.updating') : t('common.update')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
