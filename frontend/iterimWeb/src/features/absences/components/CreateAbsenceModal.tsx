import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createOrganizationAbsence } from '@/lib/api';
import type { AbsenceReason, OrganizationMember } from '@/lib/api';
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
  initialOrgMemberId,
  triggerLabel = 'Register Absence',
  triggerVariant = 'default',
  triggerSize = 'default',
  triggerDisabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [orgMemberId, setOrgMemberId] = useState(initialOrgMemberId?.toString() ?? '');
  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());
  const [reason, setReason] = useState<AbsenceReason>('Vacation');
  const [otherReason, setOtherReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'Active'),
    [members],
  );

  const resetForm = () => {
    setOrgMemberId(initialOrgMemberId?.toString() ?? '');
    setFromDate(getToday());
    setToDate(getToday());
    setReason('Vacation');
    setOtherReason('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!orgMemberId) {
      toast({ variant: 'error', title: 'Select a member first' });
      return;
    }

    if (toDate < fromDate) {
      toast({ variant: 'error', title: 'Date range is invalid', description: 'To date must be after or equal to from date.' });
      return;
    }

    if (reason === 'Other' && !otherReason.trim()) {
      toast({ variant: 'error', title: 'Enter a custom reason' });
      return;
    }

    setIsLoading(true);
    try {
      await createOrganizationAbsence(orgId, {
        orgMemberId: Number(orgMemberId),
        fromDate,
        toDate,
        reason,
        otherReason: otherReason.trim() || undefined,
      });

      toast({ variant: 'success', title: 'Absence registered successfully' });
      setOpen(false);
      resetForm();
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
        if (!value) resetForm();
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
              Member
            </label>
            <select
              id="create-absence-member"
              value={orgMemberId}
              onChange={(e) => setOrgMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              disabled={isLoading || activeMembers.length === 0}
              required
            >
              <option value="">Select a member</option>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id.toString()}>
                  {member.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2" htmlFor="create-absence-from-date">
                From date
              </label>
              <Input
                id="create-absence-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" htmlFor="create-absence-to-date">
                To date
              </label>
              <Input
                id="create-absence-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor="create-absence-reason">
              Reason
            </label>
            <select
              id="create-absence-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as AbsenceReason)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              disabled={isLoading}
              required
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor="create-absence-other-reason">
              Reason details {reason === 'Other' ? '(required)' : '(optional)'}
            </label>
            <Textarea
              id="create-absence-other-reason"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="Describe the reason"
              disabled={isLoading}
              rows={3}
              required={reason === 'Other'}
            />
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
