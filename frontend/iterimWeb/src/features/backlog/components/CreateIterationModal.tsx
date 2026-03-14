import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createIteration } from '@/lib/api';
import { Plus } from 'lucide-react';

interface Props {
  teamId: number;
  onCreated: () => void;
}

export function CreateIterationModal({ teamId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createIteration(teamId, {
        name: name || undefined,
        goal: goal || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast({ variant: 'success', title: 'Sprint created successfully' });
      setOpen(false);
      resetForm();
      onCreated();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to create sprint' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setGoal('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Create Sprint
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
          <DialogDescription>
            Leave dates empty to use the default iteration length from organization settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Sprint 5" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
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
            <Textarea placeholder="What should this sprint achieve?" value={goal} onChange={(e) => setGoal(e.target.value)} disabled={isLoading} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Sprint'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
