import { useEffect, useState } from 'react';
import { OrganizationCard } from '@/features/organizations/components/OrganizationCard';
import { CreateOrganizationModal } from '@/features/organizations/components/CreateOrganizationModal';
import { getOrganizations} from '@/lib/api';
import type { Organization } from '@/lib/api';

export function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizations = async () => {
    try {
      const data = await getOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Organizations</h1>
        <CreateOrganizationModal onCreated={loadOrganizations} />
      </div>

      {organizations.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
          <p className="mb-4">You don't belong to any organizations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map(org => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      )}
    </div>
  );
}