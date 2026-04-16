import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteAbsence } from '@/lib/api';
import type { MemberAbsence, OrganizationMember } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { EditAbsenceModal } from './EditAbsenceModal';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

const getMessageFromError = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const formatDateOnly = (dateOnly: string): string => {
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return dateOnly;

  return new Date(year, month - 1, day).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const DETAIL_PREVIEW_MAX = 30;

const truncateDetails = (value: string): string => {
  if (value.length <= DETAIL_PREVIEW_MAX) return value;
  return `${value.slice(0, DETAIL_PREVIEW_MAX)}...`;
};

interface Props {
  absences: MemberAbsence[];
  members: OrganizationMember[];
  currentUserId: number;
  canManageAllAbsences: boolean;
  onChanged: () => void;
}

export function AbsenceList({ absences, members, currentUserId, canManageAllAbsences, onChanged }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const orgMemberUserById = new Map(members.map((member) => [member.id, member.userId]));

  const handleDelete = async (absenceId: number) => {
    setDeletingId(absenceId);
    try {
      await deleteAbsence(absenceId);
      toast({ variant: 'success', title: 'Absence deleted successfully' });
      setConfirmDeleteId(null);
      onChanged();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Failed to delete absence',
        description: getMessageFromError(error, 'Please try again.'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const startDeleteConfirmation = (absenceId: number) => {
    if (deletingId !== null) return;
    setConfirmDeleteId(absenceId);
  };

  const cancelDeleteConfirmation = () => {
    if (deletingId !== null) return;
    setConfirmDeleteId(null);
  };

  if (absences.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No absences found for the selected date range.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-md bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence.id}>
              <TableCell className="font-medium">{absence.memberName}</TableCell>
              <TableCell>{formatDateOnly(absence.fromDate)}</TableCell>
              <TableCell>{formatDateOnly(absence.toDate)}</TableCell>
              <TableCell>
                <div>{absence.reason}</div>
                {absence.reasonDetails && (
                  <div
                    className="text-xs text-muted-foreground mt-1 break-all"
                    title={absence.reasonDetails}
                  >
                    {truncateDetails(absence.reasonDetails)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {(() => {
                  const ownerUserId = orgMemberUserById.get(absence.orgMemberId);
                  const canManageThisAbsence = canManageAllAbsences || ownerUserId === currentUserId;

                  if (!canManageThisAbsence) {
                    return <span className="text-sm text-muted-foreground">No access</span>;
                  }

                  return (
                <div className="flex items-center gap-2">
                  <EditAbsenceModal absence={absence} members={members} onUpdated={onChanged} />
                  {confirmDeleteId === absence.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-destructive font-medium">Are you sure?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleDelete(absence.id)}
                        disabled={deletingId === absence.id}
                      >
                        {deletingId === absence.id ? 'Deleting...' : 'Yes'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={cancelDeleteConfirmation}
                        disabled={deletingId === absence.id}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => startDeleteConfirmation(absence.id)}
                      disabled={deletingId !== null}
                    >
                      <Trash2Icon className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                  );
                })()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
