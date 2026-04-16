import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { updateIteration } from '@/lib/api';
import type { Iteration } from '@/lib/api';
import { dateOnOrAfter, maxLength, required } from '@/lib/validation';

interface Props {
  iteration: Iteration | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}

export function EditIterationModal({ iteration, open, onOpenChange, onUpdated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation(
    {
      name: '',
      goal: '',
      startDate: '',
      endDate: '',
    },
    {
      name: [maxLength('Name', 255)],
      startDate: [required('Start date')],
      endDate: [required('End date'), dateOnOrAfter('startDate', 'End date must be on or after start date.')],
    },
  );

  const getMessageFromError = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  useEffect(() => {
    if (iteration) {
      resetForm({
        name: iteration.name ?? '',
        goal: iteration.goal ?? '',
        startDate: iteration.startDate,
        endDate: iteration.endDate,
      });
    }
  }, [iteration, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iteration) return;

    if (!validateForm()) {
      toast({
        variant: 'warning',
        title: 'Please fix validation errors',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateIteration(iteration.id, {
        name: values.name.trim() || undefined,
        startDate: values.startDate,
        endDate: values.endDate,
        goal: values.goal.trim() || undefined,
      });
      toast({ variant: 'success', title: 'Iteration updated successfully' });
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Error',
        description: getMessageFromError(error, 'Failed to update iteration'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Iteration</DialogTitle>
          <DialogDescription>Update iteration details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={values.name}
              onChange={(e) => setFieldValue('name', e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'edit-iteration-name-error' : undefined}
            />
            <FieldError id="edit-iteration-name-error" message={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Start Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={values.startDate}
                onChange={(e) => setFieldValue('startDate', e.target.value)}
                disabled={isLoading}
                required
                aria-invalid={!!errors.startDate}
                aria-describedby={errors.startDate ? 'edit-iteration-start-date-error' : undefined}
              />
              <FieldError id="edit-iteration-start-date-error" message={errors.startDate} />
            </div>
            <div>
              <label className="text-sm font-medium">
                End Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={values.endDate}
                onChange={(e) => setFieldValue('endDate', e.target.value)}
                disabled={isLoading}
                required
                aria-invalid={!!errors.endDate}
                aria-describedby={errors.endDate ? 'edit-iteration-end-date-error' : undefined}
              />
              <FieldError id="edit-iteration-end-date-error" message={errors.endDate} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Goal (optional)</label>
            <Textarea
              value={values.goal}
              onChange={(e) => setFieldValue('goal', e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
