import { useState, useEffect } from 'react';
import { getIterationsByTeam, getWorkItemsByTeam, teamDataEventTarget } from './api';

export interface ActiveIterationInfo {
  id: number;
  name: string | null;
  startDate: string;
  endDate: string;
  totalPoints: number;
  donePoints: number;
  progress: number;
}

export function useActiveIteration(teamId: number | undefined) {
  const [info, setInfo] = useState<ActiveIterationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshCount((c) => c + 1);
    teamDataEventTarget.addEventListener('team-data-changed', handleUpdate);
    return () => teamDataEventTarget.removeEventListener('team-data-changed', handleUpdate);
  }, []);

  useEffect(() => {
    if (!teamId) {
      setInfo(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setInfo(null);

    (async () => {
      try {
        const iterations = await getIterationsByTeam(teamId);
        const active = iterations.find((i) => i.status === 'Active') ?? null;

        if (!active) {
          if (!cancelled) {
            setInfo(null);
            setIsLoading(false);
          }
          return;
        }

        const doneItems = await getWorkItemsByTeam(teamId, {
          iterationId: active.id,
          status: 'Done',
        });
        const donePoints = doneItems.reduce((sum, wi) => sum + (wi.points ?? 0), 0);

        if (!cancelled) {
          setInfo({
            id: active.id,
            name: active.name,
            startDate: active.startDate,
            endDate: active.endDate,
            totalPoints: active.totalPoints,
            donePoints,
            progress:
              active.totalPoints > 0
                ? Math.round((donePoints / active.totalPoints) * 100)
                : 0,
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load active iteration', err);
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamId, refreshCount]);

  return { info, isLoading };
}
