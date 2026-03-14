import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { updateWorkItem, deleteWorkItem } from '@/lib/api';
import type { WorkItem, TeamMember } from '@/lib/api';
import { Trash2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 0, label: 'Backlog' },
  { value: 1, label: 'To Do' },
  { value: 2, label: 'In Progress' },
  { value: 3, label: 'Review' },
  { value: 4, label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Critical' },
];

// Map string enum values from backend to numeric values
const STATUS_MAP: Record<string, number> = { Backlog: 0, Todo: 1, InProgress: 2, Review: 3, Done: 4 };
const PRIORITY_MAP: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

interface Props {
  item: WorkItem | null;
  members: TeamMember[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}

export function EditWorkItemModal({ item, members, open, onOpenChange, onUpdated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState(0);
  const [points, setPoints] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [iterationId, setIterationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description ?? '');
      setPriority(PRIORITY_MAP[item.priority] ?? 1);
      setStatus(STATUS_MAP[item.status] ?? 0);
      setPoints(item.points?.toString() ?? '');
      setAssignedTo(item.assignedTo?.toString() ?? '');
      setIterationId(item.iterationId?.toString() ?? '');
      setConfirmDelete(false);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !title.trim()) return;
    setIsLoading(true);
    try {
      await updateWorkItem(item.id, {
        title: title.trim(),
        description: description || undefined,
        priority,
        status,
        points: points ? Number(points) : undefined,
        assignedTo: assignedTo ? Number(assignedTo) : null,
        iterationId: iterationId ? Number(iterationId) : null,
      });
      toast({ variant: 'success', title: 'Work item updated' });
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to update work item' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setIsLoading(true);
    try {
      await deleteWorkItem(item.id);
      toast({ variant: 'success', title: 'Work item deleted' });
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Error', description: error.message || 'Failed to delete work item' });
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass = "w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Work Item</span>
            <span className="text-xs text-muted-foreground font-mono">#{item?.id}</span>
          </DialogTitle>
          <DialogDescription>
            Type: {item?.type}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select value={status} onChange={(e) => setStatus(Number(e.target.value))} className={selectClass} disabled={isLoading}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
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
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} rows={3} />
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Are you sure?</span>
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
                    {isLoading ? 'Deleting...' : 'Yes, delete'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={isLoading}>
                    No
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading || !title.trim()}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
