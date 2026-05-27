import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { updateTeam } from '@/lib/api';
import type { TeamDetail, UpdateTeamRequest } from '@/lib/api';
import { maxLength, required } from '@/lib/validation';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  team: TeamDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditTeamModal({ team, open, onOpenChange, onUpdated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation<UpdateTeamRequest>(
    {
      name: team.name,
      description: team.description || '',
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

  useEffect(() => {
    if (open) {
      resetForm({
        name: team.name,
        description: team.description || '',
      });
      setHasChanges(false);
    }
  }, [open, team, resetForm]);

  useEffect(() => {
    const changed = values.name !== team.name ||
      (values.description || '') !== (team.description || '');
    setHasChanges(changed);
  }, [values, team]);

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
      await updateTeam(team.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('teams.updated'),
      });
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: getMessageFromError(error, t('teams.failedUpdate')),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('teams.editTitle')}</DialogTitle>
          <DialogDescription>
            Update team information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="team-name" className="text-sm font-medium">
              Team Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="team-name"
              placeholder="Development Team"
              value={values.name}
              onChange={(e) => setFieldValue('name', e.target.value)}
              disabled={isLoading}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'edit-team-name-error' : undefined}
            />
            <FieldError id="edit-team-name-error" message={errors.name} />
          </div>
          <div>
            <label htmlFor="team-description" className="text-sm font-medium">Description (optional)</label>
            <Textarea
              id="team-description"
              placeholder="Team description"
              value={values.description}
              onChange={(e) => setFieldValue('description', e.target.value)}
              disabled={isLoading}
              rows={4}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'edit-team-description-error' : undefined}
            />
            <FieldError id="edit-team-description-error" message={errors.description} />
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
