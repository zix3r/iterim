import { useEffect, useState } from 'react';
import { OrganizationCard } from '@/features/organizations/components/OrganizationCard';
import { CreateOrganizationModal } from '@/features/organizations/components/CreateOrganizationModal';
import { getOrganizations, getPendingInvitations, acceptInvitation } from '@/lib/api';
import type { Organization } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckIcon, XIcon } from 'lucide-react';

export function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invitations, setInvitations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [orgsData, invitationsData] = await Promise.all([
        getOrganizations(),
        getPendingInvitations()
      ]);
      setOrganizations(orgsData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (orgId: number) => {
    setAcceptingId(orgId);
    try {
      await acceptInvitation(orgId);
      await loadData(); // Reload to update lists
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Pending Invitations</h2>
          <div className="space-y-2">
            {invitations.map(org => (
              <Card key={org.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      You've been invited to join this organization
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvitation(org.id)}
                    disabled={acceptingId === org.id}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {acceptingId === org.id ? 'Accepting...' : 'Accept'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Organizations</h1>
        <CreateOrganizationModal onCreated={loadData} />
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