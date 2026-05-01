import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { addWorkItemDependency, searchWorkItems } from '@/lib/api';
import type { WorkItem, WorkItemDependency } from '@/lib/api';
import { Search, CheckCircle2 } from 'lucide-react';
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
  existingBlockerIds: number[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: (dep: WorkItemDependency) => void;
}

export function AddDependencyDialog({ workItemId, existingBlockerIds, open, onOpenChange, onAdded }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WorkItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const items = await searchWorkItems(query.trim());
        // Exclude self and items already in blockedBy list
        setResults(items.filter(i => i.id !== workItemId));
      } catch {
        // silently ignore search errors
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [query, workItemId]);

  const handleAdd = async (blocker: WorkItem) => {
    setAddingId(blocker.id);
    try {
      const dep = await addWorkItemDependency(workItemId, blocker.id);
      onAdded(dep);
      toast({ variant: 'success', title: `"${blocker.title}" ${t('common.add')}` });
    } catch (err) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Klaida pridedant priklausomybę',
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('backlog.addDependency')}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('backlog.searchPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="text-sm text-muted-foreground text-center py-2">{t('common.loading')}</div>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">{t('common.notFound')}</div>
          )}

          {results.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {results.map(item => {
                const isAlreadyAdded = existingBlockerIds.includes(item.id);
                const statusConfig = STATUS_CONFIG[item.status] ?? { label: item.status, color: 'bg-gray-100 text-gray-600' };

                return (
                  <button
                    key={item.id}
                    onClick={() => !isAlreadyAdded && handleAdd(item)}
                    disabled={isAlreadyAdded || addingId === item.id}
                    className={`w-full text-left px-3 py-2 rounded-md border transition-colors flex items-center gap-2
                      ${isAlreadyAdded
                        ? 'opacity-50 cursor-not-allowed bg-muted/30'
                        : 'hover:bg-muted/50 cursor-pointer'
                      }
                      ${addingId === item.id ? 'opacity-70' : ''}
                    `}
                  >
                    {isAlreadyAdded ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.teamName ?? `Team ${item.teamId}`}</div>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {addingId === item.id && (
                      <span className="text-xs text-muted-foreground">{t('common.creating')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {query.trim().length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Įveskite bent 2 simbolius paieškai
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
