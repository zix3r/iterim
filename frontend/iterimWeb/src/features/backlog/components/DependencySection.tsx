import { useState, useEffect, useCallback } from 'react';
import { getWorkItemDependencies, removeWorkItemDependency } from '@/lib/api';
import type { WorkItemDependency, WorkItemDependencies } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { DependencyDetailModal } from './DependencyDetailModal';
import { AddDependencyDialog } from './AddDependencyDialog';
import { Plus, X, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Backlog: { label: 'Backlog', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  Todo: { label: 'To Do', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  InProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  Review: { label: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  Done: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

interface Props {
  workItemId: number;
}

export function DependencySection({ workItemId }: Props) {
  const [deps, setDeps] = useState<WorkItemDependencies>({ blocks: [], blockedBy: [] });
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{ dep: WorkItemDependency; direction: 'blocks' | 'blockedBy' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const load = useCallback(async () => {
    try {
      const data = await getWorkItemDependencies(workItemId);
      setDeps(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [workItemId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (dep: WorkItemDependency, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeWorkItemDependency(workItemId, dep.dependencyId);
      setDeps(prev => ({
        blocks: prev.blocks.filter(d => d.dependencyId !== dep.dependencyId),
        blockedBy: prev.blockedBy.filter(d => d.dependencyId !== dep.dependencyId),
      }));
    } catch (err) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('common.error'),
      });
    }
  };

  const handleAdded = (newDep: WorkItemDependency) => {
    setDeps(prev => ({ ...prev, blockedBy: [...prev.blockedBy, newDep] }));
  };

  const existingBlockerIds = deps.blockedBy.map(d => d.workItemId);

  if (loading) return <div className="text-xs text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('backlog.dependencies')}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(true)} className="h-6 px-2 text-xs gap-1">
          <Plus className="h-3 w-3" /> {t('backlog.addDependency')}
        </Button>
      </div>

      {/* Blokuojamas — šį item blokuoja kiti */}
      {deps.blockedBy.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
            <ArrowLeft className="h-3 w-3" />
            <span>{t('backlog.blockedBy')}</span>
          </div>
          <div className="space-y-1">
            {deps.blockedBy.map(dep => (
              <DependencyCard
                key={dep.dependencyId}
                dep={dep}
                onOpen={() => setDetailModal({ dep, direction: 'blockedBy' })}
                onRemove={e => handleRemove(dep, e)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blokuoja — šis item blokuoja kitus */}
      {deps.blocks.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
            <ArrowRight className="h-3 w-3" />
            <span>{t('backlog.blocks')}</span>
          </div>
          <div className="space-y-1">
            {deps.blocks.map(dep => (
              <DependencyCard
                key={dep.dependencyId}
                dep={dep}
                onOpen={() => setDetailModal({ dep, direction: 'blocks' })}
                onRemove={e => handleRemove(dep, e)}
              />
            ))}
          </div>
        </div>
      )}

      {deps.blockedBy.length === 0 && deps.blocks.length === 0 && (
        <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
          <Lock className="h-3 w-3" /> Nėra priklausomybių
        </div>
      )}

      <DependencyDetailModal
        dependency={detailModal?.dep ?? null}
        direction={detailModal?.direction ?? 'blockedBy'}
        open={!!detailModal}
        onOpenChange={v => { if (!v) setDetailModal(null); }}
      />

      <AddDependencyDialog
        workItemId={workItemId}
        existingBlockerIds={existingBlockerIds}
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={dep => { handleAdded(dep); }}
      />
    </div>
  );
}

interface CardProps {
  dep: WorkItemDependency;
  onOpen: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

function DependencyCard({ dep, onOpen, onRemove }: CardProps) {
  const statusConfig = STATUS_CONFIG[dep.status] ?? { label: dep.status, color: 'bg-gray-100 text-gray-600' };
  const isDone = dep.status === 'Done';

  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-2 px-2.5 py-2 rounded-md border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors group"
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isDone ? 'bg-green-500' : 'bg-amber-500'}`} />
      <span className="flex-1 text-sm font-medium truncate min-w-0">{dep.title}</span>
      <span className="text-xs text-muted-foreground shrink-0">{dep.teamName}</span>
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
