import { useEffect, useMemo, useState } from 'react';
import { getSprintMetrics } from '@/lib/api';

const STATUS_ORDER = ['Done', 'InProgress', 'Review', 'Todo', 'Backlog'];

const STATUS_COLOR: Record<string, string> = {
  Done: 'bg-emerald-500',
  InProgress: 'bg-blue-500',
  Review: 'bg-violet-500',
  Todo: 'bg-amber-400',
  Backlog: 'bg-zinc-500',
};

interface Props {
  byStatus?: Record<string, unknown> | Array<Record<string, unknown>>;
  progress?: number;
  iterationId?: number;
}

const metricsByStatusCache = new Map<number, Record<string, number>>();

function toCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === 'object' && 'count' in value) {
    return toCount((value as Record<string, unknown>).count);
  }
  return 0;
}

function normalizeStatusKey(raw: unknown): string {
  const key = String(raw ?? '').trim();
  if (!key) return '';

  if (key === '0') return 'Backlog';
  if (key === '1') return 'Todo';
  if (key === '2') return 'InProgress';
  if (key === '3') return 'Review';
  if (key === '4') return 'Done';

  const compact = key.toLowerCase().replace(/[\s_-]+/g, '');
  if (compact === 'backlog') return 'Backlog';
  if (compact === 'todo') return 'Todo';
  if (compact === 'inprogress') return 'InProgress';
  if (compact === 'review') return 'Review';
  if (compact === 'done') return 'Done';

  return key;
}

function getStatusEntries(byStatus: Props['byStatus']): Array<[string, number]> {
  if (!byStatus) return [];

  const grouped = new Map<string, number>();

  const push = (rawStatus: unknown, rawCount: unknown) => {
    const status = normalizeStatusKey(rawStatus);
    const count = toCount(rawCount);
    if (!status || count <= 0) return;
    grouped.set(status, (grouped.get(status) ?? 0) + count);
  };

  if (Array.isArray(byStatus)) {
    byStatus.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const obj = item as Record<string, unknown>;
      push(obj.statusName ?? obj.status ?? obj.key ?? obj.name, obj.count ?? obj.value ?? obj.total);
    });
  } else {
    Object.entries(byStatus).forEach(([status, count]) => push(status, count));
  }

  const entries: Array<[string, number]> = [];
  STATUS_ORDER.forEach((status) => {
    const count = grouped.get(status);
    if ((count ?? 0) > 0) entries.push([status, count ?? 0]);
    grouped.delete(status);
  });

  grouped.forEach((count, status) => {
    if (count > 0) entries.push([status, count]);
  });

  return entries;
}

export function IterationStatusBar({ byStatus, progress, iterationId }: Props) {
  const [metricsByStatus, setMetricsByStatus] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadByStatus(iterationId: number) {
      if (metricsByStatusCache.has(iterationId)) {
        setMetricsByStatus(metricsByStatusCache.get(iterationId) ?? null);
        return;
      }

      try {
        const metrics = await getSprintMetrics(iterationId);
        if (cancelled) return;
        metricsByStatusCache.set(iterationId, metrics.byStatus ?? {});
        setMetricsByStatus(metrics.byStatus ?? {});
      } catch {
        if (!cancelled) {
          setMetricsByStatus(null);
        }
      }
    }

    if (iterationId) {
      void loadByStatus(iterationId);
    } else {
      setMetricsByStatus(null);
    }

    return () => {
      cancelled = true;
    };
  }, [iterationId]);

  const sourceByStatus = useMemo(() => metricsByStatus ?? byStatus, [metricsByStatus, byStatus]);

  const entries = getStatusEntries(sourceByStatus);
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
