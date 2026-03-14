import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { updateIteration } from '@/lib/api';
import type { Iteration } from '@/lib/api';

interface Props {
  iteration: Iteration | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}

export function EditIterationModal({ iteration, open, onOpenChange, onUpdated }: Props) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (iteration) {
      setName(iteration.name ?? '');
      setGoal(iteration.goal ?? '');
      setStartDate(iteration.startDate);
      setEndDate(iteration.endDate);
    }
  }, [iteration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iteration) return;
    setIsLoading(true);
    try {
      await updateIteration(iteration.id, {
        name: name || undefined,
        startDate,
        endDate,
        goal: goal || undefined,
      });
      toast({ variant: 'success', title: 'Sprint updated successfully' });
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to update sprint' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sprint</DialogTitle>
          <DialogDescription>Update sprint details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isLoading} />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isLoading} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Goal (optional)</label>
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} disabled={isLoading} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
