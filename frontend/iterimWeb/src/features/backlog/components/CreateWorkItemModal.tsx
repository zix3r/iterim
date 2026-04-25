import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createWorkItem, assignWorkItemTags } from '@/lib/api';
import type { TeamMember, Tag } from '@/lib/api';
import { maxLength, nonNegativeNumber, required } from '@/lib/validation';
import { TagSelector } from '@/components/shared/TagSelector';

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
  orgId: number;
  members: TeamMember[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: number;
  onCreated: () => void;
}

interface CreateWorkItemFormValues {
  title: string;
  description: string;
  type: number;
  priority: number;
  points: string;
  assignedTo: string;
}

export function CreateWorkItemModal({ teamId, orgId, members, open, onOpenChange, defaultType = 0, onCreated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const { toast } = useToast();

  const emptyState: CreateWorkItemFormValues = {
    title: '',
    description: '',
    type: defaultType,
    priority: 1,
    points: '',
    assignedTo: '',
  };

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation<CreateWorkItemFormValues>(
    emptyState,
    {
      title: [required('Title'), maxLength('Title', 500)],
      points: [nonNegativeNumber('Points')],
    },
  );

  useEffect(() => {
    if (!open) {
      resetForm({ ...emptyState });
      setSelectedTags([]);
    }
  }, [defaultType, open, resetForm]);

  const getMessageFromError = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'warning',
        title: 'Please fix validation errors',
      });
      return;
    }

    setIsLoading(true);
    try {
      const created = await createWorkItem(teamId, {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        type: values.type,
        priority: values.priority,
        points: values.points ? Number(values.points) : undefined,
        assignedTo: values.assignedTo ? Number(values.assignedTo) : undefined,
      });
      if (selectedTags.length > 0) {
        await assignWorkItemTags(created.id, selectedTags.map(t => t.id));
      }
      toast({ variant: 'success', title: 'Work item created' });
      onOpenChange(false);
      resetForm();
      setSelectedTags([]);
      onCreated();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Error',
        description: getMessageFromError(error, 'Failed to create work item'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass = "w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          resetForm({ ...emptyState });
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
          <DialogDescription>Add a new item to the backlog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="As a user, I want to..."
              value={values.title}
              onChange={(e) => setFieldValue('title', e.target.value)}
              disabled={isLoading}
              required
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'create-work-item-title-error' : undefined}
            />
            <FieldError id="create-work-item-title-error" message={errors.title} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={values.type}
                onChange={(e) => setFieldValue('type', Number(e.target.value))}
                className={selectClass}
                disabled={isLoading}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                value={values.priority}
                onChange={(e) => setFieldValue('priority', Number(e.target.value))}
                className={selectClass}
                disabled={isLoading}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Points</label>
              <Input
                type="number"
                min={0}
                placeholder="—"
                value={values.points}
                onChange={(e) => setFieldValue('points', e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.points}
                aria-describedby={errors.points ? 'create-work-item-points-error' : undefined}
              />
              <FieldError id="create-work-item-points-error" message={errors.points} />
            </div>
            <div>
              <label className="text-sm font-medium">Assignee</label>
              <select
                value={values.assignedTo}
                onChange={(e) => setFieldValue('assignedTo', e.target.value)}
                className={selectClass}
                disabled={isLoading}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id.toString()}>{m.userName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <TagSelector
              orgId={orgId}
              selected={selectedTags}
              onChange={setSelectedTags}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Details..."
              value={values.description}
              onChange={(e) => setFieldValue('description', e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
