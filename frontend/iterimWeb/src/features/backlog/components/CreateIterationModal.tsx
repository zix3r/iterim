import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createIteration } from '@/lib/api';
import { dateOnOrAfter, maxLength } from '@/lib/validation';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  teamId: number;
  onCreated: () => void;
}

export function CreateIterationModal({ teamId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation(
    {
      name: '',
      goal: '',
      startDate: '',
      endDate: '',
    },
    {
      name: [maxLength('Name', 255)],
      endDate: [dateOnOrAfter('startDate', 'End date must be on or after start date.')],
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
        title: 'Please fix validation errors',
      });
      return;
    }

    setIsLoading(true);
    try {
      await createIteration(teamId, {
        name: values.name.trim() || undefined,
        goal: values.goal.trim() || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      toast({ variant: 'success', title: t('common.success') });
      setOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: getMessageFromError(error, t('backlog.failedCreate')),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" /> {t('backlog.createIteration')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('backlog.createIteration')}</DialogTitle>
          <DialogDescription>
            Leave dates empty to use the default iteration length from organization settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">{t('backlog.iterationName')}</label>
            <Input
              placeholder="Iteration 5"
              value={values.name}
              onChange={(e) => setFieldValue('name', e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'create-iteration-name-error' : undefined}
            />
            <FieldError id="create-iteration-name-error" message={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('backlog.iterationStartDate')}</label>
              <Input
                type="date"
                value={values.startDate}
                onChange={(e) => setFieldValue('startDate', e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('backlog.iterationEndDate')}</label>
              <Input
                type="date"
                value={values.endDate}
                onChange={(e) => setFieldValue('endDate', e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.endDate}
                aria-describedby={errors.endDate ? 'create-iteration-end-date-error' : undefined}
              />
              <FieldError id="create-iteration-end-date-error" message={errors.endDate} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t('backlog.iterationGoal')} ({t('common.optional')})</label>
            <Textarea
              placeholder="What should this iteration achieve?"
              value={values.goal}
              onChange={(e) => setFieldValue('goal', e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? t('common.creating') : t('backlog.createIteration')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
