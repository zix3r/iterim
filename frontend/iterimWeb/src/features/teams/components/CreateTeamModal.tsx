import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createTeam } from '@/lib/api';
import type { CreateTeamRequest } from '@/lib/api';
import { maxLength, required } from '@/lib/validation';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  productId: number;
  onCreated: () => void;
}

export function CreateTeamModal({ productId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation<CreateTeamRequest>(
    {
      name: '',
      description: '',
    },
    {
      name: [required('Team name'), maxLength('Team name', 100)],
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
      await createTeam(productId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('teams.created'),
      });
      setOpen(false);
      resetForm({ name: '', description: '' });
      onCreated();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: getMessageFromError(error, t('teams.failedCreate'))
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
        <Button>{t('teams.create')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('teams.createTitle')}</DialogTitle>
          <DialogDescription>
            Add a new team to this product.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Team Name <span className="text-destructive">*</span>
            </label>
            <Input 
              id="name"
              placeholder="Development Team" 
              value={values.name}
              onChange={(e) => setFieldValue('name', e.target.value)}
              disabled={isLoading}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'create-team-name-error' : undefined}
            />
            <FieldError id="create-team-name-error" message={errors.name} />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
            <Textarea 
              id="description"
              placeholder="Team description" 
              value={values.description}
              onChange={(e) => setFieldValue('description', e.target.value)}
              disabled={isLoading}
              rows={4}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'create-team-description-error' : undefined}
            />
            <FieldError id="create-team-description-error" message={errors.description} />
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
