import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/components/ui/markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getWorkItemComments,
  createWorkItemComment,
  updateWorkItemComment,
  deleteWorkItemComment,
} from '@/lib/api';
import type { WorkItemComment } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  workItemId: number;
  isTeamLeader?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function CommentSection({ workItemId, isTeamLeader = false }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [comments, setComments] = useState<WorkItemComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getWorkItemComments(workItemId)
      .then((data) => { if (!cancelled) setComments(data); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [workItemId]);

  const handleSubmit = async () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const created = await createWorkItemComment(workItemId, { content: trimmed });
      setComments((prev) => [...prev, created]);
      setNewContent('');
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      toast({ variant: 'error', title: t('common.error'), description: err instanceof Error ? err.message : t('backlog.commentsFailedAdd') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startEdit = (comment: WorkItemComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (commentId: number) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;

    setIsSavingEdit(true);
    try {
      const updated = await updateWorkItemComment(workItemId, commentId, { content: trimmed });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch (err) {
      toast({ variant: 'error', title: t('common.error'), description: err instanceof Error ? err.message : t('backlog.commentsFailedUpdate') });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteWorkItemComment(workItemId, deleteTargetId);
      setComments((prev) => prev.filter((c) => c.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      toast({ variant: 'error', title: t('common.error'), description: err instanceof Error ? err.message : t('backlog.commentsFailedDelete') });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">
        {t('backlog.comments')} {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}
      </h3>

      {/* Comment list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-2">{t('backlog.commentsLoading')}</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-muted-foreground italic py-2">{t('backlog.commentsEmpty')}</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isOwn = user?.id === comment.authorUserId;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="group flex gap-3">
                <Avatar size="sm" className="mt-0.5 shrink-0">
                  {comment.authorAvatarUrl && <AvatarImage src={comment.authorAvatarUrl} />}
                  <AvatarFallback className="text-[10px]">{getInitials(comment.authorName)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{comment.authorName}</span>
                    <span className="text-[11px] text-muted-foreground">{formatDate(comment.createdAt, t)}</span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-[11px] text-muted-foreground">{t('backlog.commentsEdited')}</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        autoFocus
                        disabled={isSavingEdit}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(comment.id)} disabled={isSavingEdit || !editContent.trim()}>
                          {isSavingEdit ? t('common.saving') : t('common.save')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isSavingEdit}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-0.5 text-sm">
                      <Markdown>{comment.content}</Markdown>
                    </div>
                  )}
                </div>

                {(isOwn || isTeamLeader) && !isEditing && (
                  <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => startEdit(comment)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={t('common.edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(comment.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={listEndRef} />
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-3 items-start">
        <Avatar size="sm" className="mt-0.5 shrink-0">
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
          <AvatarFallback className="text-[10px]">{user ? getInitials(user.name) : '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={t('backlog.commentsPlaceholder')}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isSubmitting}
            className="text-sm resize-none"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !newContent.trim()}
          >
            {isSubmitting ? t('backlog.commentsPosting') : t('backlog.commentsPost')}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('backlog.commentsDeleteTitle')}</DialogTitle>
            <DialogDescription>{t('backlog.commentsDeleteDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} disabled={isDeleting}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
