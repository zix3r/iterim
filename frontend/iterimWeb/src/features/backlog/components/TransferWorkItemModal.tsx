import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { getTeamById, getTeamsByProduct, transferWorkItem } from '@/lib/api';
import type { Team, WorkItem } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

type TransferTeamOption = Team;

interface Props {
  item: WorkItem | null;
  orgId: number;
  currentTeamId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onTransferred: () => void;
}

export function TransferWorkItemModal({ item, orgId, currentTeamId, open, onOpenChange, onTransferred }: Props) {
  const [teams, setTeams] = useState<TransferTeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!open || !item) return;

    let cancelled = false;

    const loadTeams = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const currentTeam = await getTeamById(currentTeamId);
        const productTeams = await getTeamsByProduct(currentTeam.productId);

        const flattened = productTeams
          .filter((team) => team.id !== currentTeamId)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!cancelled) {
          setTeams(flattened);
          setSelectedTeamId(flattened[0]?.id.toString() ?? '');
          setConfirmTransfer(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : t('backlog.transferItemFailedLoad'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, [currentTeamId, item, open, orgId]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === Number(selectedTeamId)) ?? null,
    [selectedTeamId, teams]
  );

  const handleTransfer = async () => {
    if (!item || !selectedTeamId || !confirmTransfer) return;

    setIsSubmitting(true);
    try {
      await transferWorkItem(item.id, { targetTeamId: Number(selectedTeamId) });
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('backlog.transferItemSuccess'),
      });
      onOpenChange(false);
      onTransferred();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to transfer work item.';
      const description = message.includes('Tik komandos lyderis gali perkelti užduotis') || message.includes('You do not have permission')
        ? t('backlog.transferItemUnauthorized')
        : t('backlog.transferItemFailed');

      toast({
        variant: 'error',
        title: t('common.error'),
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestConfirmation = () => {
    if (!selectedTeamId || teams.length === 0 || isLoading || isSubmitting) return;
    setConfirmTransfer(true);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedTeamId('');
      setTeams([]);
      setLoadError(null);
      setConfirmTransfer(false);
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('backlog.transferItemTitle')}</DialogTitle>
          <DialogDescription>{t('backlog.transferItemDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('backlog.transferItemLoading')}</p>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('backlog.transferItemNoProductTeams')}</p>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('backlog.transferItemTargetLabel')}</label>
              <Select
                value={selectedTeamId}
                onValueChange={(value) => {
                  setSelectedTeamId(value);
                  setConfirmTransfer(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('backlog.transferItemTargetPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeam && (
                <p className="text-xs text-muted-foreground">
                  {t('backlog.transferItemSelectedLabel')}: {selectedTeam.name}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          {confirmTransfer ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <p className="text-sm text-muted-foreground sm:max-w-xs">
                {t('shared.confirmMessage')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirmTransfer(false)} disabled={isSubmitting}>
                  {t('common.no')}
                </Button>
                <Button onClick={handleTransfer} disabled={isSubmitting || isLoading}>
                  {isSubmitting ? t('backlog.transferItemSubmitting') : t('backlog.transferItemConfirm')}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleRequestConfirmation} disabled={isSubmitting || isLoading || !selectedTeamId || teams.length === 0}>
              {t('backlog.transferItem')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}