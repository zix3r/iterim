import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { WorkItemDependency } from '@/lib/api';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { DependencyDetailModal } from '@/features/backlog/components/DependencyDetailModal';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Backlog: { label: 'Backlog', color: 'bg-zinc-100 text-zinc-600' },
  Todo: { label: 'To Do', color: 'bg-slate-100 text-slate-600' },
  InProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  Review: { label: 'Review', color: 'bg-purple-100 text-purple-700' },
  Done: { label: 'Done', color: 'bg-green-100 text-green-700' },
};

interface Props {
  blockers: WorkItemDependency[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BlockerErrorModal({ blockers, open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const [detailDep, setDetailDep] = useState<WorkItemDependency | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              <DialogTitle>{t('board.blockerError')}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="mt-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('board.blockerErrorMessage')}
            </p>
            <div className="space-y-1">
              {blockers.map(b => {
                const statusConfig = STATUS_CONFIG[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <button
                    key={b.dependencyId}
                    onClick={() => setDetailDep(b)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-amber-500 text-xs">✗</span>
                    <span className="flex-1 text-sm font-medium truncate">{b.title}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DependencyDetailModal
        dependency={detailDep}
        direction="blockedBy"
        open={!!detailDep}
        onOpenChange={v => { if (!v) setDetailDep(null); }}
      />
    </>
  );
}
