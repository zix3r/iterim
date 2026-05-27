import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createProduct } from '@/lib/api';
import type { CreateProductRequest } from '@/lib/api';
import { maxLength, required } from '@/lib/validation';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  orgId: number;
  onCreated: () => void;
}

export function CreateProductModal({ orgId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation<CreateProductRequest>(
    {
      name: '',
      description: '',
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
      await createProduct(orgId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('products.created')
      });
      setOpen(false);
      resetForm({ name: '', description: '' });
      onCreated();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: getMessageFromError(error, t('products.failedCreate'))
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm({ name: '', description: '' });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>{t('products.create')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('products.createTitle')}</DialogTitle>
          <DialogDescription>
            Add a new product to your organization.
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
              aria-describedby={errors.name ? 'create-product-name-error' : undefined}
            />
            <FieldError id="create-product-name-error" message={errors.name} />
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
              aria-describedby={errors.description ? 'create-product-description-error' : undefined}
            />
            <FieldError id="create-product-description-error" message={errors.description} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
