import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TagBadge } from '@/components/shared/TagBadge';
import { ExternalLink } from 'lucide-react';
import type { WorkItemDependency } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Backlog: { label: 'Backlog', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  Todo: { label: 'To Do', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  InProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  Review: { label: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  Done: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Story: { label: 'STORY', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Task: { label: 'TASK', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  Bug: { label: 'BUG', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

interface Props {
  dependency: WorkItemDependency | null;
  direction: 'blocks' | 'blockedBy';
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DependencyDetailModal({ dependency, direction, open, onOpenChange }: Props) {
  const { t } = useLanguage();

  if (!dependency) return null;

  const statusConfig = STATUS_CONFIG[dependency.status] ?? { label: dependency.status, color: 'bg-gray-100 text-gray-600' };
  const typeConfig = TYPE_CONFIG[dependency.type] ?? { label: dependency.type, color: 'bg-gray-100 text-gray-600' };

  const initials = dependency.assignedMember?.userName
    ? dependency.assignedMember.userName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?';

  const backlogUrl = `/org/${dependency.orgId}/products/${dependency.productId}/teams/${dependency.teamId}/backlog`;

  const directionLabel = direction === 'blocks'
    ? `${t('backlog.blocks')}`
    : `${t('backlog.blockedBy')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className="text-[10px] text-muted-foreground italic border border-dashed border-muted-foreground/30 px-2 py-0.5 rounded">
              {directionLabel}
            </span>
          </div>
          <DialogTitle className="text-base leading-snug">{dependency.title}</DialogTitle>
          <div className="text-xs text-muted-foreground mt-0.5">
            {dependency.teamName} · {dependency.productName}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Points */}
          {dependency.points != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">{t('backlog.points')}</span>
              <span className="text-sm font-mono font-semibold bg-secondary/50 px-2 py-0.5 rounded">
                {dependency.points}
              </span>
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{t('backlog.assignee')}</span>
            {dependency.assignedMember ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px] bg-primary/10">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{dependency.assignedMember.userName}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">{t('backlog.unassigned')}</span>
            )}
          </div>

          {/* Tags */}
          {dependency.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('backlog.tags')}</span>
              <div className="flex flex-wrap gap-1">
                {dependency.tags.map(tag => (
                  <TagBadge key={tag.id} tag={tag} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {dependency.description && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">{t('backlog.itemDescription')}</div>
              <div className="text-sm bg-muted/30 rounded-md p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {dependency.description}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Created {formatDate(dependency.createdAt)}</span>
            <span>Updated {formatDate(dependency.updatedAt)}</span>
          </div>

          {/* Open in backlog link */}
          <a
            href={backlogUrl}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Atidaryti backlog'e
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
