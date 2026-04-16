import { useEffect, useState } from 'react';
import { CreateOrganizationModal } from '@/features/organizations/components/CreateOrganizationModal';
import { InvitationList } from '@/features/organizations/components/InvitationList';
import { getDashboard } from '@/lib/api';
import type { DashboardData } from '@/lib/api';
import { OrganizationHierarchyCard } from '../components/OrganizationHierarchyCard';
import { MyWorkWidget } from '../components/MyWorkWidget';
import { ActivityFeedWidget } from '../components/ActivityFeedWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { addRecentPage } from '@/lib/recentPages';
import { EmptyState } from '@/components/ui/empty-state';
import { Building2, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    addRecentPage({
      path: '/dashboard',
      label: 'Dashboard',
      iconType: 'Dashboard'
    });
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const dashboardData = await getDashboard();
      setData(dashboardData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. SKELETON BŪSENA (Krovimosi metu)
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
                    {[1, 2, 3, 4].map(i => (
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

  // 2. KLAIDOS BŪSENA (Jei API grąžina 500, Network Error ir t.t.)
  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
          <p className="text-sm text-red-700">{error || "Could not retrieve dashboard data."}</p>
          <button 
            onClick={loadData} 
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 3. SEKMINGA BŪSENA (Duomenys užkrauti)
  return (
    <div className="p-6 max-w-[1920px] mx-auto space-y-8">
      <InvitationList onInvitationProcessed={loadData} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Organization Hierarchy (Wide) */}
        <div className="lg:col-span-8 2xl:col-span-9 space-y-6 min-w-0">
           <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                <p className="text-muted-foreground mt-1">Manage your products and teams</p>
              </div>
              {/* Jei norime turėti mygtuką ir viršuje */}
              {data.organizations.length > 0 && (
                <CreateOrganizationModal onCreated={loadData} />
              )}
           </div>

           {/* TUŠČIA BŪSENA (Nėra organizacijų) */}
           {data.organizations.length === 0 ? (
             <EmptyState
               title="You don't belong to any organizations yet"
               description="Create your first organization to get started managing your products, teams, and sprints."
               icon={<Building2 className="h-8 w-8" />}
               action={<CreateOrganizationModal onCreated={loadData} />}
             />
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
               {data.organizations.map(org => (
                 <OrganizationHierarchyCard key={org.id} organization={org} />
               ))}
             </div>
           )}
        </div>

        {/* Right Columns: Personal widgets */}
        <div className="lg:col-span-4 2xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 sticky top-6">
           <MyWorkWidget workItems={data.myWork} />
           <ActivityFeedWidget activities={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}