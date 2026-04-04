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

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    addRecentPage({
      path: '/dashboard',
      label: 'Dashboard',
      iconType: 'Dashboard'
    });
  }, []);

  const loadData = async () => {
    try {
      const dashboardData = await getDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  if (!data) return <div className="p-8">Failed to load dashboard.</div>;

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
              <CreateOrganizationModal onCreated={loadData} />
           </div>

           {data.organizations.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/10 h-[400px]">
               <div className="bg-muted p-4 rounded-full mb-4">
                  {/* Icon placeholder could go here if we had one imported */}
                  <span className="text-4xl">🏢</span>
               </div>
               <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to Iterim!</h3>
               <p className="mb-6 max-w-md mx-auto text-center">You don't belong to any organizations yet. Create one to get started managing your products and teams.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
               {data.organizations.map(org => (
                 <OrganizationHierarchyCard key={org.id} organization={org} />
               ))}
             </div>
           )}
        </div>

        {/* Right Columns: Personal widgets (Side-by-side on wide screens, stacked on mid) */}
        <div className="lg:col-span-4 2xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 sticky top-6">
           <MyWorkWidget workItems={data.myWork} />
           <ActivityFeedWidget activities={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}

