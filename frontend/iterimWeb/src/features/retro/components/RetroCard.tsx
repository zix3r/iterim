import { useState } from 'react';
import { ThumbsUp, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/LanguageContext';
import type { RetroItem } from '@/lib/api';

interface RetroCardProps {
  item: RetroItem;
  readOnly: boolean;
  onVote: (item: RetroItem) => void;
  onEdit: (item: RetroItem, content: string) => Promise<void>;
  onDelete: (item: RetroItem) => Promise<void>;
}

/**
 * One sticky-note in the retro board.
 *
 * Three modes:
 *   - read-only (iteration is Completed): no buttons, content only
 *   - editable (someone else's card): vote button only
 *   - own card: vote + edit + delete
 *
 * Edit and delete are local-state collapsibles to keep the UI dense.
 */
export function RetroCard({ item, readOnly, onVote, onEdit, onDelete }: RetroCardProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const initials = item.authorName
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onEdit(item, trimmed);
      setIsEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete(item);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="group rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            autoFocus
            className="text-sm"
          />
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => {
                setIsEditing(false);
                setDraft(item.content);
              }}
              disabled={busy}
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              className="h-7 px-2"
              onClick={handleSave}
              disabled={busy || !draft.trim() || draft.trim() === item.content}
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar size="sm">
            {item.authorAvatarUrl && <AvatarImage src={item.authorAvatarUrl} alt={item.authorName} />}
            <AvatarFallback>{initials || '?'}</AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground">{item.authorName}</span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Edit / Delete — only for the author and only on writable boards */}
          {!readOnly && item.isOwn && !isEditing && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                title={t('retro.editCard')}
                aria-label={t('retro.editCard')}
                onClick={() => setIsEditing(true)}
                disabled={busy}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              {confirmDelete ? (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    onClick={handleDelete}
                    disabled={busy}
                  >
                    {t('common.yes')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy}
                  >
                    {t('common.no')}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title={t('retro.deleteCard')}
                  aria-label={t('retro.deleteCard')}
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          )}

          {/* Vote — disabled when read-only, but always visible so the count is anchored */}
          <Button
            size="sm"
            variant={item.hasVoted ? 'default' : 'outline'}
            className="h-7 px-2"
            onClick={() => onVote(item)}
            disabled={readOnly}
            aria-label={item.hasVoted ? t('retro.unvote') : t('retro.vote')}
            title={item.hasVoted ? t('retro.unvote') : t('retro.vote')}
          >
            <ThumbsUp className="h-3 w-3" />
            <span className="ml-1 text-xs font-medium tabular-nums">{item.voteCount}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
