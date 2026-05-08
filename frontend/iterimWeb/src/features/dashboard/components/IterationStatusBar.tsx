const STATUS_ORDER = ['Done', 'InProgress', 'Review', 'Todo', 'Backlog'];

const STATUS_COLOR: Record<string, string> = {
  Done: 'bg-emerald-500',
  InProgress: 'bg-blue-500',
  Review: 'bg-violet-500',
  Todo: 'bg-amber-400',
  Backlog: 'bg-zinc-500',
};

interface Props {
  byStatus?: Record<string, number>;
  progress?: number;
}

export function IterationStatusBar({ byStatus, progress }: Props) {
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
    return (
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted gap-px">
        {entries.map(([status, count]) => (
          <div
            key={status}
            className={STATUS_COLOR[status] ?? 'bg-zinc-600'}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${status}: ${count}`}
          />
        ))}
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
