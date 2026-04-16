import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { updateAbsence } from '@/lib/api';
import type { AbsenceReason, MemberAbsence, OrganizationMember } from '@/lib/api';
import { dateOnOrAfter, required, requiredWhen } from '@/lib/validation';
import { PencilIcon } from 'lucide-react';

const REASON_OPTIONS: AbsenceReason[] = ['Vacation', 'Sick', 'Late', 'Absent', 'Other'];

const getMessageFromError = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const parseReason = (reasonText: string): AbsenceReason => {
  return REASON_OPTIONS.includes(reasonText as AbsenceReason)
    ? (reasonText as AbsenceReason)
    : 'Other';
};

interface Props {
  absence: MemberAbsence;
  members: OrganizationMember[];
  onUpdated: () => void;
}

export function EditAbsenceModal({ absence, members, onUpdated }: Props) {
  const parsedReason = parseReason(absence.reason);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { values, errors, setFieldValue, validateForm, resetForm: resetValidationForm } = useFormValidation(
    {
      orgMemberId: absence.orgMemberId.toString(),
      fromDate: absence.fromDate.slice(0, 10),
      toDate: absence.toDate.slice(0, 10),
      reason: parsedReason,
      otherReason: absence.reasonDetails ?? '',
    },
    {
      orgMemberId: [required('Member')],
      fromDate: [required('From date')],
      toDate: [required('To date'), dateOnOrAfter('fromDate', 'To date must be after or equal to from date.')],
      reason: [required('Reason')],
      otherReason: [
        requiredWhen(
          'reason',
          (value) => value === 'Other',
          'Reason details are required when reason is Other.',
        ),
      ],
    },
  );

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'Active'),
    [members],
  );

  const resetAbsenceForm = () => {
    const currentReason = parseReason(absence.reason);
    resetValidationForm({
      orgMemberId: absence.orgMemberId.toString(),
      fromDate: absence.fromDate.slice(0, 10),
      toDate: absence.toDate.slice(0, 10),
      reason: currentReason,
      otherReason: absence.reasonDetails ?? '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      toast({ variant: 'warning', title: 'Please fix validation errors' });
      return;
    }

    setIsLoading(true);
    try {
      await updateAbsence(absence.id, {
        orgMemberId: Number(values.orgMemberId),
        fromDate: values.fromDate,
        toDate: values.toDate,
        reason: values.reason,
        otherReason: values.otherReason.trim() || undefined,
      });

      toast({ variant: 'success', title: 'Absence updated successfully' });
      setOpen(false);
      onUpdated();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Failed to update absence',
        description: getMessageFromError(error, 'Please try again.'),
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
        if (value) resetAbsenceForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <PencilIcon className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Absence</DialogTitle>
          <DialogDescription>
            Update member, date range, or reason.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-member-${absence.id}`}>
              Member <span className="text-destructive">*</span>
            </label>
            <select
              id={`edit-absence-member-${absence.id}`}
              value={values.orgMemberId}
              onChange={(e) => setFieldValue('orgMemberId', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 aria-invalid:border-destructive"
              disabled={isLoading || activeMembers.length === 0}
              required
              aria-invalid={!!errors.orgMemberId}
              aria-describedby={errors.orgMemberId ? `edit-absence-member-error-${absence.id}` : undefined}
            >
              <option value="">Select a member</option>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id.toString()}>
                  {member.email}
                </option>
              ))}
            </select>
            <FieldError id={`edit-absence-member-error-${absence.id}`} message={errors.orgMemberId} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-from-date-${absence.id}`}>
                From date <span className="text-destructive">*</span>
              </label>
              <Input
                id={`edit-absence-from-date-${absence.id}`}
                type="date"
                value={values.fromDate}
                onChange={(e) => setFieldValue('fromDate', e.target.value)}
                disabled={isLoading}
                required
                aria-invalid={!!errors.fromDate}
                aria-describedby={errors.fromDate ? `edit-absence-from-date-error-${absence.id}` : undefined}
              />
              <FieldError id={`edit-absence-from-date-error-${absence.id}`} message={errors.fromDate} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-to-date-${absence.id}`}>
                To date <span className="text-destructive">*</span>
              </label>
              <Input
                id={`edit-absence-to-date-${absence.id}`}
                type="date"
                value={values.toDate}
                onChange={(e) => setFieldValue('toDate', e.target.value)}
                disabled={isLoading}
                required
                aria-invalid={!!errors.toDate}
                aria-describedby={errors.toDate ? `edit-absence-to-date-error-${absence.id}` : undefined}
              />
              <FieldError id={`edit-absence-to-date-error-${absence.id}`} message={errors.toDate} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-reason-${absence.id}`}>
              Reason <span className="text-destructive">*</span>
            </label>
            <select
              id={`edit-absence-reason-${absence.id}`}
              value={values.reason}
              onChange={(e) => setFieldValue('reason', e.target.value as AbsenceReason)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 aria-invalid:border-destructive"
              disabled={isLoading}
              required
              aria-invalid={!!errors.reason}
              aria-describedby={errors.reason ? `edit-absence-reason-error-${absence.id}` : undefined}
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError id={`edit-absence-reason-error-${absence.id}`} message={errors.reason} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-other-reason-${absence.id}`}>
              Reason details {values.reason === 'Other' ? '(required)' : '(optional)'}
            </label>
            <Textarea
              id={`edit-absence-other-reason-${absence.id}`}
              value={values.otherReason}
              onChange={(e) => setFieldValue('otherReason', e.target.value)}
              placeholder="Describe the reason"
              disabled={isLoading}
              rows={3}
              required={values.reason === 'Other'}
              aria-invalid={!!errors.otherReason}
              aria-describedby={errors.otherReason ? `edit-absence-other-reason-error-${absence.id}` : undefined}
            />
            <FieldError id={`edit-absence-other-reason-error-${absence.id}`} message={errors.otherReason} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || activeMembers.length === 0}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
