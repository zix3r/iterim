import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createWorkItem } from '@/lib/api';
import type { TeamMember } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 0, label: 'Story', emoji: '🟦' },
  { value: 1, label: 'Task', emoji: '🟨' },
  { value: 2, label: 'Bug', emoji: '🟥' },
];

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Critical' },
];

interface Props {
  teamId: number;
  members: TeamMember[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: number;
  onCreated: () => void;
}

export function CreateWorkItemModal({ teamId, members, open, onOpenChange, defaultType = 0, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(defaultType);
  const [priority, setPriority] = useState(1); // Medium
  const [points, setPoints] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      await createWorkItem(teamId, {
        title: title.trim(),
        description: description || undefined,
        type,
        priority,
        points: points ? Number(points) : undefined,
        assignedTo: assignedTo ? Number(assignedTo) : undefined,
      });
      toast({ variant: 'success', title: 'Work item created' });
      onOpenChange(false);
      resetForm();
      onCreated();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to create work item' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType(defaultType);
    setPriority(1);
    setPoints('');
    setAssignedTo('');
  };

  const selectClass = "w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
          <DialogDescription>Add a new item to the backlog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input placeholder="As a user, I want to..." value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={type} onChange={(e) => setType(Number(e.target.value))} className={selectClass} disabled={isLoading}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className={selectClass} disabled={isLoading}>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Points</label>
              <Input type="number" min={0} placeholder="—" value={points} onChange={(e) => setPoints(e.target.value)} disabled={isLoading} />
            </div>
            <div>
              <label className="text-sm font-medium">Assignee</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id.toString()}>{m.userName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea placeholder="Details..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>{isLoading ? 'Creating...' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
