import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createOrganization } from '@/lib/api';
import { maxLength, required } from '@/lib/validation';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  onCreated: () => void;
}

export function CreateOrganizationModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation(
    {
      name: '',
    },
    {
      name: [required('Organization name'), maxLength('Organization name', 100)],
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
      await createOrganization(values.name.trim());
      toast({
        variant: 'success',
        title: t('organizations.created'),
      });
      setOpen(false);
      resetForm();
      onCreated(); // Atnaujiname sąrašą
    } catch (error) {
      toast({
        variant: 'error',
        title: t('organizations.failedCreate'),
        description: getMessageFromError(error, t('common.retry')),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>{t('organizations.create')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('organizations.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('organizations.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="organization-name" className="text-sm font-medium block mb-2">
              Organization name <span className="text-destructive">*</span>
            </label>
            <Input
              id="organization-name"
              placeholder="Organization Name"
              value={values.name}
              onChange={(e) => setFieldValue('name', e.target.value)}
              disabled={isLoading}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'organization-name-error' : undefined}
            />
            <FieldError id="organization-name-error" message={errors.name} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>{t('common.create')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}