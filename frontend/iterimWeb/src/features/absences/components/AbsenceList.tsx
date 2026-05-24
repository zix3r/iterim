import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteAbsence } from '@/lib/api';
import type { MemberAbsence, OrganizationMember } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { EditAbsenceModal } from './EditAbsenceModal';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const REASON_LABEL_KEYS: Record<string, TranslationKey> = {
  Vacation: 'absences.typeVacation',
  Sick: 'absences.typeSick',
  Late: 'absences.typeLate',
  Absent: 'absences.typeAbsent',
  Other: 'absences.typeOther',
};

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

const formatTimeOnly = (time?: string | null): string | null => {
  if (!time) return null;
  return time.slice(0, 5);
};

const formatDateTime = (date: string, time?: string | null): string => {
  const datePart = formatDateOnly(date);
  const timePart = formatTimeOnly(time);
  return timePart ? `${datePart} ${timePart}` : datePart;
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
  const { t } = useLanguage();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberAbsence | null>(null);
  const { toast } = useToast();

  const orgMemberUserById = new Map(members.map((member) => [member.id, member.userId]));

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await deleteAbsence(deleteTarget.id);
      toast({ variant: 'success', title: t('common.success') });
      setDeleteTarget(null);
      onChanged();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('absences.failedDelete'),
        description: getMessageFromError(error, t('common.tryAgain')),
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (absences.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {t('absences.noAbsences')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-md bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('common.name')}</TableHead>
            <TableHead>{t('common.from')}</TableHead>
            <TableHead>{t('common.to')}</TableHead>
            <TableHead>{t('absences.reason')}</TableHead>
            <TableHead className="w-[180px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence.id}>
              <TableCell className="font-medium">{absence.memberName}</TableCell>
              <TableCell>{formatDateTime(absence.fromDate, absence.fromTime)}</TableCell>
              <TableCell>{formatDateTime(absence.toDate, absence.toTime)}</TableCell>
              <TableCell>
                <div>{REASON_LABEL_KEYS[absence.reason] ? t(REASON_LABEL_KEYS[absence.reason]) : absence.reason}</div>
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
                    return <span className="text-sm text-muted-foreground">{t('common.unauthorized')}</span>;
                  }

                  return (
                <div className="flex items-center gap-2">
                  <EditAbsenceModal absence={absence} members={members} onUpdated={onChanged} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(absence)}
                    disabled={deletingId === absence.id}
                  >
                    <Trash2Icon className="h-4 w-4" />
                    {t('common.delete')}
                  </Button>
                </div>
                  );
                })()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('absences.deleteConfirm')}</DialogTitle>
            <DialogDescription>
              {t('common.confirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deletingId === deleteTarget?.id}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId === deleteTarget?.id}
            >
              {deletingId === deleteTarget?.id ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
