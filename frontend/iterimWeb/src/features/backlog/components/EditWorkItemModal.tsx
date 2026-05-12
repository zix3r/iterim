import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/components/ui/markdown';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { updateWorkItem, deleteWorkItem, assignWorkItemTags } from '@/lib/api';
import type { WorkItem, TeamMember, Tag } from '@/lib/api';
import { TagSelector } from '@/components/shared/TagSelector';
import { maxLength, nonNegativeNumber, required } from '@/lib/validation';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { DependencySection } from './DependencySection';
import { CommentSection } from './CommentSection';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TransferWorkItemModal } from './TransferWorkItemModal';

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

const TYPE_OPTIONS = [
  { value: 0, label: 'Story' },
  { value: 1, label: 'Task' },
  { value: 2, label: 'Bug' },
];

const TYPE_MAP: Record<string, number> = { Story: 0, Task: 1, Bug: 2 };

// Map string enum values from backend to numeric values
const STATUS_MAP: Record<string, number> = { Backlog: 0, Todo: 1, InProgress: 2, Review: 3, Done: 4 };
const PRIORITY_MAP: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

interface Props {
  item: WorkItem | null;
  orgId: number;
  members: TeamMember[];
  canTransferWorkItem?: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}

interface EditWorkItemFormValues {
  title: string;
  description: string;
  priority: number;
  status: number;
  points: string;
  assignedTo: string;
  iterationId: string;
  type: number;
}

export function EditWorkItemModal({ item, orgId, members, canTransferWorkItem = false, open, onOpenChange, onUpdated }: Props) {
  const { user } = useAuth();
  const isTeamLeader = members.some((m) => m.userId === user?.id && m.role === 'Admin');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation<EditWorkItemFormValues>(
    {
      title: '',
      description: '',
      priority: 1,
      status: 0,
      points: '',
      assignedTo: '',
      iterationId: '',
      type: 0,
    },
    {
      title: [required('Title'), maxLength('Title', 500)],
      points: [nonNegativeNumber('Points')],
    },
  );

  const getMessageFromError = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  useEffect(() => {
    if (item) {
      resetForm({
        title: item.title,
        description: item.description ?? '',
        priority: PRIORITY_MAP[item.priority] ?? 1,
        status: STATUS_MAP[item.status] ?? 0,
        points: item.points?.toString() ?? '',
        assignedTo: item.assignedTo?.toString() ?? '',
        iterationId: item.iterationId?.toString() ?? '',
        type: TYPE_MAP[item.type] ?? 0,
      });
      setSelectedTags(item.tags ?? []);
      setConfirmDelete(false);
    }
  }, [item, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!validateForm()) {
      toast({
        variant: 'warning',
        title: 'Please fix validation errors',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateWorkItem(item.id, {
        title: values.title.trim(),
        description: values.description || undefined,
        priority: values.priority,
        status: values.status,
        type: values.type,
        points: values.points ? Number(values.points) : undefined,
        assignedTo: values.assignedTo ? Number(values.assignedTo) : null,
        iterationId: values.iterationId ? Number(values.iterationId) : null,
      });
      await assignWorkItemTags(item.id, selectedTags.map(t => t.id));
      toast({ variant: 'success', title: t('common.success') });
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: getMessageFromError(error, t('backlog.failedUpdate')),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setIsLoading(true);
    try {
      await deleteWorkItem(item.id);
      toast({ variant: 'success', title: t('common.success') });
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: getMessageFromError(error, t('backlog.failedDelete')),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass = "w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmDelete(false);
      setTransferOpen(false);
    }

    onOpenChange(isOpen);
  };

  const handleTransferred = () => {
    setTransferOpen(false);
    setConfirmDelete(false);
    onOpenChange(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('backlog.editItemTitle')}</DialogTitle>
          <DialogDescription>{t('backlog.editItemDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">
              {t('backlog.itemTitle')} <span className="text-destructive">*</span>
            </label>
            <Input
              value={values.title}
              onChange={(e) => setFieldValue('title', e.target.value)}
              disabled={isLoading}
              required
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'edit-work-item-title-error' : undefined}
            />
            <FieldError id="edit-work-item-title-error" message={errors.title} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">{t('backlog.type')}</label>
              <select
                value={values.type}
                onChange={(e) => setFieldValue('type', Number(e.target.value))}
                className={selectClass}
                disabled={isLoading}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('backlog.status')}</label>
              <select
                value={values.status}
                onChange={(e) => setFieldValue('status', Number(e.target.value))}
                className={selectClass}
                disabled={isLoading}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('backlog.priority')}</label>
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
              <label className="text-sm font-medium">{t('backlog.points')}</label>
              <Input
                type="number"
                min={0}
                placeholder="—"
                value={values.points}
                onChange={(e) => setFieldValue('points', e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.points}
                aria-describedby={errors.points ? 'edit-work-item-points-error' : undefined}
              />
              <FieldError id="edit-work-item-points-error" message={errors.points} />
            </div>
            <div>
              <label className="text-sm font-medium">{t('backlog.assignee')}</label>
              <select
                value={values.assignedTo}
                onChange={(e) => setFieldValue('assignedTo', e.target.value)}
                className={selectClass}
                disabled={isLoading}
              >
                <option value="">{t('backlog.unassigned')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id.toString()}>{m.userName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t('backlog.tags')}</label>
            <TagSelector
              orgId={orgId}
              selected={selectedTags}
              onChange={setSelectedTags}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              {t('backlog.itemDescription')}
            </label>

            {isEditingDescription ? (
              <>
                <Textarea
                  value={values.description}
                  onChange={(e) => setFieldValue('description', e.target.value)}
                  onBlur={() => setIsEditingDescription(false)}
                  disabled={isLoading}
                  rows={6}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('markdown.helperText')}
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDescription(true)}
                className="w-full text-left rounded-md border border-border bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/40 transition-colors p-3 min-h-[6rem] cursor-text"
              >
                {values.description.trim() ? (
                  <Markdown>{values.description}</Markdown>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    {t('markdown.emptyPlaceholder')}
                  </span>
                )}
              </button>
            )}
          </div>

          {item && (
            <div className="border-t pt-4">
              <DependencySection workItemId={item.id} />
            </div>
          )}

          {item && (
            <div className="border-t pt-4">
              <CommentSection workItemId={item.id} isTeamLeader={isTeamLeader} />
            </div>
          )}

          {item && canTransferWorkItem && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 space-y-2">
              <div>
                <p className="text-sm font-medium">{t('backlog.transferItemTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('backlog.transferItemDescription')}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setTransferOpen(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-2" /> {t('backlog.transferItem')}
              </Button>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">{t('shared.confirmMessage')}</span>
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
                    {isLoading ? t('common.deleting') : t('common.yes')}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={isLoading}>
                    {t('common.no')}
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-1 text-destructive" /> {t('common.delete')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t('common.saving') : t('common.save')}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      <TransferWorkItemModal
        item={item}
        orgId={orgId}
        currentTeamId={item?.teamId ?? 0}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onTransferred={handleTransferred}
      />
    </Dialog>
  );
}
