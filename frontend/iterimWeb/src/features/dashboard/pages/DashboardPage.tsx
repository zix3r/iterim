import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { addRecentPage } from '@/lib/recentPages';
import { useMyTeamsTree } from '@/hooks/useMyTeamsTree';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardGrid } from '../components/DashboardGrid';
import { useLanguage } from '@/context/LanguageContext';

export function DashboardPage() {
  const { dashboardData, isLoading, error, refetch, refetchSilent } = useMyTeamsTree();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    refetchSilent();
  }, [refetchSilent]);

  useEffect(() => {
    addRecentPage({
      path: '/dashboard',
      label: t('dashboard.title'),
      iconType: 'Dashboard',
    });
  }, [t]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="w-full lg:w-[350px] space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">{t('common.error')}</h3>
          <p className="text-sm text-red-700">{error || 'Could not retrieve dashboard data.'}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md font-medium transition-colors"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <DashboardGrid
      firstName={firstName}
      myWork={dashboardData.myWork}
      blockedWork={dashboardData.blockedWork ?? []}
      recentActivity={dashboardData.recentActivity}
      onInvitationProcessed={refetch}
    />
  );
}
