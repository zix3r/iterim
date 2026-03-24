import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { updateAbsence } from '@/lib/api';
import type { AbsenceReason, MemberAbsence, OrganizationMember } from '@/lib/api';
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
  const [orgMemberId, setOrgMemberId] = useState(absence.orgMemberId.toString());
  const [fromDate, setFromDate] = useState(absence.fromDate.slice(0, 10));
  const [toDate, setToDate] = useState(absence.toDate.slice(0, 10));
  const [reason, setReason] = useState<AbsenceReason>(parsedReason);
  const [otherReason, setOtherReason] = useState(absence.reasonDetails ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'Active'),
    [members],
  );

  const resetForm = () => {
    const currentReason = parseReason(absence.reason);
    setOrgMemberId(absence.orgMemberId.toString());
    setFromDate(absence.fromDate.slice(0, 10));
    setToDate(absence.toDate.slice(0, 10));
    setReason(currentReason);
    setOtherReason(absence.reasonDetails ?? '');
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
      await updateAbsence(absence.id, {
        orgMemberId: Number(orgMemberId),
        fromDate,
        toDate,
        reason,
        otherReason: otherReason.trim() || undefined,
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
        if (value) resetForm();
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
              Member
            </label>
            <select
              id={`edit-absence-member-${absence.id}`}
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
              <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-from-date-${absence.id}`}>
                From date
              </label>
              <Input
                id={`edit-absence-from-date-${absence.id}`}
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-to-date-${absence.id}`}>
                To date
              </label>
              <Input
                id={`edit-absence-to-date-${absence.id}`}
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-reason-${absence.id}`}>
              Reason
            </label>
            <select
              id={`edit-absence-reason-${absence.id}`}
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
            <label className="text-sm font-medium block mb-2" htmlFor={`edit-absence-other-reason-${absence.id}`}>
              Reason details {reason === 'Other' ? '(required)' : '(optional)'}
            </label>
            <Textarea
              id={`edit-absence-other-reason-${absence.id}`}
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
