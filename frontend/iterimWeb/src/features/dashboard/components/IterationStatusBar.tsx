import { useLanguage } from '@/context/LanguageContext';

const STATUS_ORDER = ['Done', 'InProgress', 'Review', 'Todo', 'Backlog'];

const STATUS_COLOR: Record<string, string> = {
  Done: 'bg-emerald-500',
  InProgress: 'bg-blue-500',
  Review: 'bg-violet-500',
  Todo: 'bg-amber-400',
  Backlog: 'bg-zinc-500',
};

const STATUS_TEXT: Record<string, string> = {
  Done: 'text-emerald-700 dark:text-emerald-300',
  InProgress: 'text-blue-700 dark:text-blue-300',
  Review: 'text-violet-700 dark:text-violet-300',
  Todo: 'text-amber-700 dark:text-amber-300',
  Backlog: 'text-muted-foreground',
};

interface Props {
  byStatus?: Record<string, number>;
  progress?: number;
  iterationId?: number;
}

export function IterationStatusBar({ byStatus, progress }: Props) {
  const { t } = useLanguage();

  const STATUS_LABEL: Record<string, string> = {
    Done: t('board.done'),
    InProgress: t('board.inProgress'),
    Review: t('board.review'),
    Todo: t('board.todo'),
    Backlog: 'Backlog',
  };

  const entries: Array<[string, number]> = [];

  if (byStatus) {
    STATUS_ORDER.forEach((status) => {
      const count = byStatus[status] ?? 0;
      if (count > 0) entries.push([status, count]);
    });
    Object.entries(byStatus).forEach(([status, count]) => {
      if (!STATUS_ORDER.includes(status) && count > 0) entries.push([status, count]);
    });
  }

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total > 0) {
    const completed = byStatus?.Done ?? 0;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex h-2 overflow-hidden rounded-full bg-muted gap-px">
            {entries.map(([status, count]) => (
              <div
                key={status}
                className={STATUS_COLOR[status] ?? 'bg-zinc-600'}
                style={{ width: `${(count / total) * 100}%` }}
                title={`${STATUS_LABEL[status] ?? status}: ${count} tasks`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {completed}/{total}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {entries.map(([status, count]) => (
            <div key={status} className="flex items-center gap-1 text-[10px]">
              <span className={`inline-block h-1.5 w-1.5 rounded-sm ${STATUS_COLOR[status] ?? 'bg-zinc-600'}`} />
              <span className={STATUS_TEXT[status] ?? 'text-muted-foreground'}>
                {STATUS_LABEL[status] ?? status}
              </span>
              <span className="text-muted-foreground">({count})</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const normalizedProgress = (progress ?? 0) > 1 ? (progress ?? 0) / 100 : (progress ?? 0);
  const pct = Math.max(0, Math.min(100, Math.round(normalizedProgress * 100)));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-zinc-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
