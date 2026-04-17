import { createContext, useCallback, useEffect, useState } from 'react';
import { getDashboard, teamDataEventTarget, type DashboardData, type DashboardOrganization } from '@/lib/api';

interface MyTeamsTreeContextValue {
  organizations: DashboardOrganization[];
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  refetchSilent: () => void;
}

export const MyTeamsTreeContext = createContext<MyTeamsTreeContextValue | null>(null);

interface Props {
  children: React.ReactNode;
}

export function MyTeamsTreeProvider({ children }: Props) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    getDashboard()
      .then((data) => {
        setDashboardData(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
      })
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, []);

  const refetch = useCallback(() => fetchData(false), [fetchData]);
  const refetchSilent = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleSilent = () => fetchData(true);
    teamDataEventTarget.addEventListener('tree-data-changed', handleSilent);
    teamDataEventTarget.addEventListener('team-data-changed', handleSilent);
    return () => {
      teamDataEventTarget.removeEventListener('tree-data-changed', handleSilent);
      teamDataEventTarget.removeEventListener('team-data-changed', handleSilent);
    };
  }, [fetchData]);

  return (
    <MyTeamsTreeContext.Provider
      value={{
        organizations: dashboardData?.organizations ?? [],
        dashboardData,
        isLoading,
        error,
        refetch,
        refetchSilent,
      }}
    >
      {children}
    </MyTeamsTreeContext.Provider>
  );
}
