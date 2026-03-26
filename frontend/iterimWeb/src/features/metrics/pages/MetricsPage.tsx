import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { BarChart2, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorMessage } from '@/components/ui/error-message';
import { Badge } from '@/components/ui/badge';
import { SprintProgressCard } from '../components/SprintProgressCard';
import { VelocityChart } from '../components/VelocityChart';
import { BurndownChart } from '../components/BurndownChart';
import { CapacityCard } from '../components/CapacityCard';
import {
  getIterationsByTeam,
  getSprintMetrics,
  getVelocity,
  getCapacity,
  type Iteration,
  type SprintMetrics,
  type VelocityData,
  type CapacityData,
} from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Planning:  'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

export function MetricsPage() {
  const { orgId, productId, teamId } = useParams<{
    orgId: string; productId: string; teamId: string;
  }>();
  const tid = Number(teamId);

  // ── All iterations (for selector) ─────────────────────────
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [iterLoading, setIterLoading] = useState(true);
  const [iterError, setIterError] = useState<string | null>(null);

  // ── Per-sprint data (all tied to selectedId) ───────────────
  const [sprintMetrics, setSprintMetrics] = useState<SprintMetrics | null>(null);
  const [sprintLoading, setSprintLoading] = useState(false);

  const [capacity, setCapacity] = useState<CapacityData | null>(null);
  const [capacityLoading, setCapacityLoading] = useState(false);

  // ── Velocity (team-level, not sprint-specific) ─────────────
  const [velocity, setVelocity] = useState<VelocityData | null>(null);
  const [velocityLoading, setVelocityLoading] = useState(true);
  const [velocityError, setVelocityError] = useState<string | null>(null);
  const [sprintCount, setSprintCount] = useState(5);

  // Load all iterations once
  useEffect(() => {
    if (!tid) return;
    setIterLoading(true);
    getIterationsByTeam(tid)
      .then((list) => {
        // Sort: Active first, then newest first by startDate
        const sorted = [...list].sort((a, b) => {
          if (a.status === 'Active') return -1;
          if (b.status === 'Active') return 1;
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
        setIterations(sorted);
        // Default: active sprint, or most recent
        const def = sorted.find((i) => i.status === 'Active') ?? sorted[0] ?? null;
        if (def) setSelectedId(def.id);
      })
      .catch((e: Error) => setIterError(e.message))
      .finally(() => setIterLoading(false));
  }, [tid]);

  // Load velocity — last N completed sprints before (and including) the selected sprint
  useEffect(() => {
    if (!tid || !selectedId) return;
    setVelocityLoading(true);
    getVelocity(tid, sprintCount, selectedId)
      .then(setVelocity)
      .catch((e: Error) => setVelocityError(e.message))
      .finally(() => setVelocityLoading(false));
  }, [tid, selectedId, sprintCount]);

  // Reload sprint metrics + capacity whenever selected sprint changes
  useEffect(() => {
    if (!selectedId) return;
    const iter = iterations.find((i) => i.id === selectedId);
    if (!iter) return;

    setSprintMetrics(null);
    setSprintLoading(true);
    getSprintMetrics(selectedId)
      .then(setSprintMetrics)
      .catch(() => setSprintMetrics(null))
      .finally(() => setSprintLoading(false));

    setCapacity(null);
    setCapacityLoading(true);
    getCapacity(tid, iter.startDate, iter.endDate)
      .then(setCapacity)
      .catch(() => setCapacity(null))
      .finally(() => setCapacityLoading(false));
  }, [selectedId, iterations, tid]);

  if (iterError || velocityError) {
    return <ErrorMessage message={iterError ?? velocityError ?? 'Unknown error'} />;
  }

  const selectedIter = iterations.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Organizations', href: '/dashboard' },
          { label: 'Org', href: `/org/${orgId}` },
          { label: 'Products', href: `/org/${orgId}/products` },
          { label: 'Product', href: `/org/${orgId}/products/${productId}` },
          { label: 'Teams', href: `/org/${orgId}/products/${productId}/teams` },
          { label: 'Team', href: `/org/${orgId}/products/${productId}/teams/${teamId}` },
          { label: 'Metrics' },
        ]}
      />

      <PageHeader
        title="Metrics"
        description="Team analytics and sprint health"
        actions={
          !iterLoading && iterations.length > 0 ? (
            <SprintSelector
              iterations={iterations}
              selectedId={selectedId}
              onChange={setSelectedId}
            />
          ) : undefined
        }
      />

      {/* No iterations at all */}
      {!iterLoading && iterations.length === 0 && (
        <EmptyState
          icon={<BarChart2 className="h-7 w-7" />}
          title="No sprints yet"
          description="Create and start a sprint to see metrics here."
        />
      )}

      {(iterLoading || iterations.length > 0) && (
        <div className="space-y-6">
          {/* Row 1: Sprint progress + Capacity — scoped to selected sprint */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SprintProgressCard
              data={sprintMetrics}
              loading={iterLoading || sprintLoading}
            />
            <CapacityCard
              data={capacity}
              loading={iterLoading || capacityLoading}
            />
          </div>

          {/* Row 2: Velocity — last N completed sprints, highlights selected if completed */}
          <VelocityChart
            data={velocity}
            loading={velocityLoading}
            highlightIterationId={selectedIter?.status === 'Completed' ? selectedId : null}
            sprintCount={sprintCount}
            onSprintCountChange={setSprintCount}
          />

          {/* Row 3: Burndown — scoped to selected sprint */}
          <BurndownChart
            data={sprintMetrics}
            loading={iterLoading || sprintLoading}
          />
        </div>
      )}
    </div>
  );
}

// ── Sprint Selector ────────────────────────────────────────────────────────────

interface SprintSelectorProps {
  iterations: Iteration[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

function SprintSelector({ iterations, selectedId, onChange }: SprintSelectorProps) {
  const selected = iterations.find((i) => i.id === selectedId);

  return (
    <div className="relative">
      <label className="text-xs text-zinc-500 font-medium block mb-1">Viewing sprint</label>
      <div className="relative">
        <select
          value={selectedId ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className="appearance-none w-full min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-zinc-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 cursor-pointer"
        >
          {iterations.map((iter) => (
            <option key={iter.id} value={iter.id}>
              {iter.name ?? `Sprint #${iter.id}`}
              {iter.status === 'Active' ? ' (Active)' : ''}
              {iter.status === 'Planning' ? ' (Planning)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      </div>
      {selected && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
          <span>{fmtDate(selected.startDate)} – {fmtDate(selected.endDate)}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE[selected.status] ?? ''}`}
          >
            {selected.status}
          </Badge>
        </div>
      )}
    </div>
  );
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' });
}
