import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CalendarOff, CalendarRange } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { getQuarterPlan, getTeamById } from '@/lib/api';
import type { QuarterPlan, TeamDetail } from '@/lib/api';

// --- Pagalbinės datos funkcijos ---
const getQuarterDates = (year: number, quarter: 1 | 2 | 3 | 4) => {
  const starts = [`${year}-01-01`, `${year}-04-01`, `${year}-07-01`, `${year}-10-01`];
  const ends = [`${year}-03-31`, `${year}-06-30`, `${year}-09-30`, `${year}-12-31`];
  return { start: starts[quarter - 1], end: ends[quarter - 1] };
};

const currentYear = new Date().getFullYear();
const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1 as 1 | 2 | 3 | 4;

export function QuarterPlanPage() {
  const { orgId, productId, teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [plan, setPlan] = useState<QuarterPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Datos filtrai
  const defaultDates = getQuarterDates(currentYear, currentQuarter);
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [activeQuarter, setActiveQuarter] = useState<number | null>(currentQuarter);

  const loadData = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const [teamData, planData] = await Promise.all([
        getTeamById(Number(teamId)),
        getQuarterPlan(Number(teamId), startDate, endDate),
      ]);
      setTeam(teamData);
      setPlan(planData);
    } catch (error) {
      console.error("Failed to load quarter plan", error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setQuarter = (q: 1 | 2 | 3 | 4) => {
    const dates = getQuarterDates(currentYear, q);
    setStartDate(dates.start);
    setEndDate(dates.end);
    setActiveQuarter(q);
  };

  if (isLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  const iterations = plan?.iterations || [];
  const features = plan?.featureSummaries || [];

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Products', href: `/org/${orgId}/products` },
          { label: team?.productName || 'Product', href: `/org/${orgId}/products/${productId}` },
          { label: team?.name || 'Team', href: `/org/${orgId}/products/${productId}/teams/${teamId}` },
          { label: 'Quarterly Plan' },
        ]}
      />

      {/* Antraštė ir filtrai */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarRange className="h-8 w-8 text-primary" />
            Quarterly Plan
          </h1>
          <p className="text-muted-foreground">Strategic overview of iterations and features.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-2 rounded-lg border">
          <div className="flex gap-1 mr-4 border-r pr-4">
            {[1, 2, 3, 4].map((q) => (
              <Button
                key={q}
                variant={activeQuarter === q ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuarter(q as 1 | 2 | 3 | 4)}
              >
                Q{q}
              </Button>
            ))}
          </div>
          <Input type="date" className="w-[140px] h-8" value={startDate} onChange={(e) => { setStartDate(e.target.value); setActiveQuarter(null); }} />
          <span className="text-muted-foreground">-</span>
          <Input type="date" className="w-[140px] h-8" value={endDate} onChange={(e) => { setEndDate(e.target.value); setActiveQuarter(null); }} />
        </div>
      </div>

      {iterations.length === 0 ? (
        <EmptyState
          title="No Iterations Found"
          description="There are no planned iterations for the selected date range."
          icon={<CalendarOff className="h-8 w-8" />}
        />
      ) : (
        <div className="border rounded-xl bg-card shadow-sm overflow-x-auto">
          {/* CSS GRID Layout: 1 stulpelis kiekvienai iteracijai */}
          <div 
            className="grid min-w-max p-6 gap-y-4"
            style={{ gridTemplateColumns: `repeat(${iterations.length}, minmax(320px, 1fr))` }}
          >
            {/* 1. TIMELINE HEADER (Iteracijų blokai) */}
            {iterations.map((iter) => {
              const capacity = plan?.capacityPerIteration?.find(c => c.iterationId === iter.id);
              
              // Statuso spalvos
              const statusColor = 
                iter.status === 'Planning' ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300' :
                iter.status === 'Active' ? 'border-green-200 bg-green-50/50 hover:border-green-300' :
                'border-gray-200 bg-gray-50 hover:border-gray-300';

              const statusBadge = 
                iter.status === 'Planning' ? 'bg-blue-100 text-blue-700' :
                iter.status === 'Active' ? 'bg-green-100 text-green-700' :
                'bg-gray-200 text-gray-700';

              return (
                <div 
                  key={iter.id} 
                  className={`border rounded-lg p-4 m-1 cursor-pointer transition-colors ${statusColor}`}
                  onClick={() => navigate(`/org/${orgId}/products/${productId}/teams/${teamId}/board`)} // Idealu naviguoti į to sprinto board
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-base truncate">{iter.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusBadge}`}>
                      {iter.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {iter.startDate} — {iter.endDate}
                  </p>

                  {/* SP Summary */}
                  <div className="flex gap-2 text-xs font-medium mb-2">
                    <span className="text-gray-500">Todo: {iter.todoSP}</span>
                    <span className="text-blue-500">In Prog: {iter.inProgressSP}</span>
                    <span className="text-green-600">Done: {iter.doneSP}</span>
                    <span className="ml-auto font-bold">{iter.totalSP} SP</span>
                  </div>

                  {/* Capacity Indicator */}
                  {capacity && (
                    <div className="bg-white/60 p-2 rounded text-xs border border-white">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Team Capacity:</span>
                        <span className="font-semibold">{capacity.netCapacityDays} Days</span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        {/* Improvizuotas SP užpildymas. Daroma prielaida, kad 1 diena = pvz. 1 SP vizualiai. Gali adaptuoti. */}
                        <div 
                          className={`h-full ${iter.totalSP > capacity.netCapacityDays ? 'bg-red-500' : 'bg-primary'}`} 
                          style={{ width: `${Math.min((iter.totalSP / (capacity.netCapacityDays || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Separator */}
            <div className="col-span-full h-px bg-border my-2" />
            <h4 className="col-span-full font-semibold text-sm text-muted-foreground mb-2">Spanning Features</h4>

            {/* 2. FEATURES (Gantt juostos) */}
            {features.map((feature) => {
              // Surandame iteracijų indeksus (nuo kurios iki kurios) CSS Grid stulpeliams
              const startIndex = iterations.findIndex(i => i.id === feature.startIterationId) + 1;
              const endIndex = iterations.findIndex(i => i.id === feature.endIterationId) + 1;

              // Jei kažkuri iteracija nepatenka į rėžį, ignoruojame brėžimą arba apribojame
              if (startIndex === 0 || endIndex === 0) return null;

              return (
                <div 
                  key={feature.workItemId}
                  className="relative group m-1"
                  style={{ gridColumn: `${startIndex} / span ${endIndex - startIndex + 1}` }}
                >
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-3 hover:bg-primary/20 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                          {feature.type}
                        </span>
                        {feature.workItemTitle}
                      </div>
                      <span className="text-xs font-bold text-primary">{feature.totalSP} SP</span>
                    </div>

                    {/* Progress Bar for Feature */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background h-2 rounded-full overflow-hidden border">
                        <div 
                          className="bg-green-500 h-full transition-all" 
                          style={{ width: `${feature.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{feature.completionPercent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {features.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground p-4 italic text-center">
                No cross-iteration features found in this period.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}