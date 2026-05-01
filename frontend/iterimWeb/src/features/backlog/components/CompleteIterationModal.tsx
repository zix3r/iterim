import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { completeIteration } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type { Iteration } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  iteration: Iteration | null;
  otherIterations: Iteration[]; // Planning iterations to move items to
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted: () => void;
}

export function CompleteIterationModal({ iteration, otherIterations, open, onOpenChange, onCompleted }: Props) {
  const [moveTarget, setMoveTarget] = useState<string>('backlog');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleComplete = async () => {
    if (!iteration) return;
    setIsLoading(true);
    try {
      const moveUnfinishedToIterationId = moveTarget === 'backlog' ? null : Number(moveTarget);
      await completeIteration(iteration.id, { moveUnfinishedToIterationId });
      toast({ variant: 'success', title: t('common.success') });
      onOpenChange(false);
      onCompleted();
    } catch (error: any) {
      toast({ variant: 'error', title: t('common.error'), description: error.message || t('backlog.failedUpdate') });
    } finally {
      setIsLoading(false);
    }
  };

  // Only show Planning iterations as targets (not Completed ones)
  const targetOptions = otherIterations.filter(
    i => i.id !== iteration?.id && i.status !== 'Completed'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('backlog.completeIteration')}</DialogTitle>
          <DialogDescription>
            {t('backlog.completeIteration')} "{iteration?.name}" and choose where to move unfinished work items.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Items with status "{t('backlog.statusDone')}" will stay in this iteration. All other items will be moved to:
          </p>
          <select
            value={moveTarget}
            onChange={(e) => setMoveTarget(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="backlog">Backlog (unassign from iteration)</option>
            {targetOptions.map((i) => (
              <option key={i.id} value={i.id.toString()}>
                {i.name ?? `Iteration ${i.id}`} ({i.status})
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('common.cancel')}</Button>
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? `${t('common.updating')}` : t('backlog.completeIteration')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
