import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { completeIteration } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type { Iteration } from '@/lib/api';

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

  const handleComplete = async () => {
    if (!iteration) return;
    setIsLoading(true);
    try {
      const moveUnfinishedToIterationId = moveTarget === 'backlog' ? null : Number(moveTarget);
      await completeIteration(iteration.id, { moveUnfinishedToIterationId });
      toast({ variant: 'success', title: 'Iteration completed!' });
      onOpenChange(false);
      onCompleted();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to complete iteration' });
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
          <DialogTitle>Complete Iteration</DialogTitle>
          <DialogDescription>
            Complete "{iteration?.name}" and choose where to move unfinished work items.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Items with status "Done" will stay in this iteration. All other items will be moved to:
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? 'Completing...' : 'Complete Iteration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
