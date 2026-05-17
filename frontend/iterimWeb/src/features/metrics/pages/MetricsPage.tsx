import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { BarChart2, ChevronDown, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { SprintProgressCard } from '../components/SprintProgressCard';
import { VelocityChart } from '../components/VelocityChart';
import { BurndownChart } from '../components/BurndownChart';
import { CapacityCard } from '../components/CapacityCard';
import {
  getIterationsByTeam,
  getTeamById,
  getSprintMetrics,
  getVelocity,
  getCapacity,
  type Iteration,
  type SprintMetrics,
  type VelocityData,
  type CapacityData,
  type TeamDetail,
} from '@/lib/api';
import { addRecentPage } from '@/lib/recentPages';

const STATUS_BADGE: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  Planning:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  Completed: 'bg-muted text-muted-foreground border-border',
};

export function MetricsPage() {
  const { t } = useLanguage();
  const { orgId, productId, teamId } = useParams<{
    orgId: string; productId: string; teamId: string;
  }>();
  const tid = Number(teamId);

  const [team, setTeam] = useState<TeamDetail | null>(null);

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
  const [sprintCount] = useState(5);

  // Load all iterations once
  const loadIterations = useCallback(async () => {
    if (!tid) return;
    try {
      setIterLoading(true);
      setIterError(null);
      const [list, teamData] = await Promise.all([
        getIterationsByTeam(tid),
        getTeamById(tid),
      ]);
      setTeam(teamData);
      
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
    } catch (err) {
      console.error('Failed to load iterations:', err);
      setIterError(err instanceof Error ? err.message : 'Failed to load iterations');
    } finally {
      setIterLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    loadIterations();
  }, [loadIterations]);

  useEffect(() => {
    if (team && orgId && productId && teamId) {
      addRecentPage({
        path: `/org/${orgId}/products/${productId}/teams/${teamId}/metrics`,
        label: `${team.name} — Metrics`,
        iconType: 'Team',
      });
    }
  }, [team, orgId, productId, teamId]);

  // Load velocity — last N completed sprints before (and including) the selected sprint
  useEffect(() => {
    if (!tid || !selectedId) return;
    
    const fetchVelocity = async () => {
      setVelocityLoading(true);
      try {
        const data = await getVelocity(tid, sprintCount, selectedId);
        setVelocity(data);
      } catch (err) {
        console.error('Failed to load velocity:', err);
        setVelocityError(err instanceof Error ? err.message : 'Failed to load velocity');
      } finally {
        setVelocityLoading(false);
      }
    };

    fetchVelocity();
  }, [tid, selectedId, sprintCount]);

  // Reload sprint metrics + capacity whenever selected sprint changes
  useEffect(() => {
    if (!selectedId) return;
    const iter = iterations.find((i) => i.id === selectedId);
    if (!iter) return;

    const fetchSprintData = async () => {
      setSprintLoading(true);
      try {
        const metricsData = await getSprintMetrics(selectedId);
        setSprintMetrics(metricsData);
      } catch {
        setSprintMetrics(null);
      } finally {
        setSprintLoading(false);
      }

      setCapacityLoading(true);
      try {
        const capData = await getCapacity(tid, iter.startDate, iter.endDate);
        setCapacity(capData);
      } catch {
        setCapacity(null);
      } finally {
        setCapacityLoading(false);
      }
    };

    fetchSprintData();
  }, [selectedId, iterations, tid]);

  // 1. SKELETON BŪSENA (Pirminis puslapio krovimasis)
  if (iterLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* Title */}
            <Skeleton className="h-4 w-64" /> {/* Description */}
          </div>
          <Skeleton className="h-14 w-56 rounded-lg" /> {/* Selector */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
        
        <Skeleton className="h-[350px] w-full rounded-xl" />
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
    );
  }

  // 2. KLAIDOS BŪSENA
  if (iterError || velocityError) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">{t('metrics.failedLoad')}</h3>
          <p className="text-sm text-red-700 dark:text-red-300">{iterError ?? velocityError ?? t('common.error')}</p>
          <Button onClick={loadIterations} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 dark:border-red-500/30 dark:hover:bg-red-500/15 text-red-800 dark:text-red-300">
            {t('common.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  const selectedIter = iterations.find((i) => i.id === selectedId) ?? null;

  // 3. SĖKMINGA BŪSENA
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        title={t('metrics.title')}
        description={t('products.metrics')}
        actions={
          iterations.length > 0 ? (
            <SprintSelector
              iterations={iterations}
              selectedId={selectedId}
              onChange={setSelectedId}
            />
          ) : undefined
        }
      />

      {/* No iterations at all */}
      {iterations.length === 0 ? (
        <EmptyState
          icon={<BarChart2 className="h-8 w-8" />}
          title={t('board.noActiveIteration')}
          description={t('backlog.failedLoad')}
        />
      ) : (
        <div className="space-y-6">
          {/* Row 1: Iteration progress + Capacity — scoped to selected sprint */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SprintProgressCard
              data={sprintMetrics}
              loading={sprintLoading}
            />
            <CapacityCard
              data={capacity}
              loading={capacityLoading}
            />
          </div>

          {/* Row 2: Velocity — last N completed sprints, highlights selected if completed */}
          <VelocityChart
            data={velocity}
            loading={velocityLoading}
            highlightIterationId={selectedIter?.status === 'Completed' ? selectedId : null}
          />

          {/* Row 3: Burndown — scoped to selected sprint */}
          <BurndownChart
            data={sprintMetrics}
            loading={sprintLoading}
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
  const { t } = useLanguage();
  const selected = iterations.find((i) => i.id === selectedId);

  return (
    <div className="relative">
      <label className="text-xs text-muted-foreground font-medium block mb-1">{t('board.selectIteration')}</label>
      <div className="relative">
        <select
          value={selectedId ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className="appearance-none w-full min-w-[220px] rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring cursor-pointer"
        >
          {iterations.map((iter) => (
            <option key={iter.id} value={iter.id}>
              {iter.name ?? `Sprint #${iter.id}`}
              {iter.status === 'Active' ? ' (Active)' : ''}
              {iter.status === 'Planning' ? ' (Planning)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      {selected && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
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