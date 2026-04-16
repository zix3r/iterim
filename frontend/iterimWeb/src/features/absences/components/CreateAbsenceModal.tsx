import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createOrganizationAbsence } from '@/lib/api';
import type { AbsenceReason, OrganizationMember } from '@/lib/api';
import { dateOnOrAfter, required, requiredWhen } from '@/lib/validation';
import { PlusIcon } from 'lucide-react';

const REASON_OPTIONS: AbsenceReason[] = ['Vacation', 'Sick', 'Late', 'Absent', 'Other'];

const getToday = () => new Date().toISOString().slice(0, 10);

const getMessageFromError = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

interface Props {
  orgId: number;
  members: OrganizationMember[];
  onCreated: () => void;
  canManageAllAbsences: boolean;
  currentUserId: number;
  initialOrgMemberId?: number;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>['variant'];
  triggerSize?: React.ComponentProps<typeof Button>['size'];
  triggerDisabled?: boolean;
}

export function CreateAbsenceModal({
  orgId,
  members,
  onCreated,
  canManageAllAbsences,
  currentUserId,
  initialOrgMemberId,
  triggerLabel = 'Register Absence',
  triggerVariant = 'default',
  triggerSize = 'default',
  triggerDisabled = false,
}: Props) {
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'Active'),
    [members],
  );

  const resolvedInitialMemberId = useMemo(() => {
    if (initialOrgMemberId != null) return initialOrgMemberId.toString();
    if (canManageAllAbsences) return '';

    const currentUserMember = activeMembers.find((member) => member.userId === currentUserId);
    return currentUserMember?.id.toString() ?? '';
  }, [activeMembers, canManageAllAbsences, currentUserId, initialOrgMemberId]);

  const shouldLockMemberSelection = !canManageAllAbsences;

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { values, errors, setFieldValue, validateForm, resetForm: resetValidationForm } = useFormValidation(
    {
      orgMemberId: resolvedInitialMemberId,
      fromDate: getToday(),
      toDate: getToday(),
      reason: 'Vacation' as AbsenceReason,
      otherReason: '',
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

  const selectedMember = activeMembers.find((member) => member.id.toString() === values.orgMemberId);

  const resetAbsenceForm = () => {
    resetValidationForm({
      orgMemberId: resolvedInitialMemberId,
      fromDate: getToday(),
      toDate: getToday(),
      reason: 'Vacation',
      otherReason: '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const submitOrgMemberId = shouldLockMemberSelection ? resolvedInitialMemberId : values.orgMemberId;

    if (!submitOrgMemberId) {
      toast({ variant: 'warning', title: 'Please select a member' });
      return;
    }

    if (!validateForm()) {
      toast({ variant: 'warning', title: 'Please fix validation errors' });
      return;
    }

    setIsLoading(true);
    try {
      await createOrganizationAbsence(orgId, {
        orgMemberId: Number(submitOrgMemberId),
        fromDate: values.fromDate,
        toDate: values.toDate,
        reason: values.reason,
        otherReason: values.otherReason.trim() || undefined,
      });

      toast({ variant: 'success', title: 'Absence registered successfully' });
      setOpen(false);
      resetAbsenceForm();
      onCreated();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Failed to register absence',
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
        if (!value) resetAbsenceForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} disabled={triggerDisabled}>
          <PlusIcon className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Absence</DialogTitle>
          <DialogDescription>
            Register vacation, sick leave, or other absence for an organization member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-2" htmlFor="create-absence-member">
              Member <span className="text-destructive">*</span>
            </label>
            {shouldLockMemberSelection ? (
              <Input
                id="create-absence-member"
                value={selectedMember?.email ?? 'No active membership found'}
                disabled
                readOnly
              />
            ) : (
              <select
                id="create-absence-member"
                value={values.orgMemberId}
                onChange={(e) => setFieldValue('orgMemberId', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 aria-invalid:border-destructive"
                disabled={isLoading || activeMembers.length === 0}
                required
                aria-invalid={!!errors.orgMemberId}
                aria-describedby={errors.orgMemberId ? 'create-absence-member-error' : undefined}
              >
                <option value="">Select a member</option>
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id.toString()}>
                    {member.email}
                  </option>
                ))}
              </select>
            )}
            <FieldError id="create-absence-member-error" message={errors.orgMemberId} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2" htmlFor="create-absence-from-date">
                From date <span className="text-destructive">*</span>
              </label>
              <Input
                id="create-absence-from-date"
                type="date"
                value={values.fromDate}
                onChange={(e) => setFieldValue('fromDate', e.target.value)}
                disabled={isLoading}
                required
                aria-invalid={!!errors.fromDate}
                aria-describedby={errors.fromDate ? 'create-absence-from-date-error' : undefined}
              />
              <FieldError id="create-absence-from-date-error" message={errors.fromDate} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" htmlFor="create-absence-to-date">
                To date <span className="text-destructive">*</span>
              </label>
              <Input
                id="create-absence-to-date"
                type="date"
                value={values.toDate}
                onChange={(e) => setFieldValue('toDate', e.target.value)}
                disabled={isLoading}
                required
                aria-invalid={!!errors.toDate}
                aria-describedby={errors.toDate ? 'create-absence-to-date-error' : undefined}
              />
              <FieldError id="create-absence-to-date-error" message={errors.toDate} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor="create-absence-reason">
              Reason <span className="text-destructive">*</span>
            </label>
            <select
              id="create-absence-reason"
              value={values.reason}
              onChange={(e) => setFieldValue('reason', e.target.value as AbsenceReason)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 aria-invalid:border-destructive"
              disabled={isLoading}
              required
              aria-invalid={!!errors.reason}
              aria-describedby={errors.reason ? 'create-absence-reason-error' : undefined}
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError id="create-absence-reason-error" message={errors.reason} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor="create-absence-other-reason">
              Reason details {values.reason === 'Other' ? '(required)' : '(optional)'}
            </label>
            <Textarea
              id="create-absence-other-reason"
              value={values.otherReason}
              onChange={(e) => setFieldValue('otherReason', e.target.value)}
              placeholder="Describe the reason"
              disabled={isLoading}
              rows={3}
              required={values.reason === 'Other'}
              aria-invalid={!!errors.otherReason}
              aria-describedby={errors.otherReason ? 'create-absence-other-reason-error' : undefined}
            />
            <FieldError id="create-absence-other-reason-error" message={errors.otherReason} />
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
