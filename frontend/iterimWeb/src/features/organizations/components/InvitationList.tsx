import { useEffect, useState } from 'react';
import { 
  getPendingInvitations, 
  acceptInvitation, 
  declineInvitation,
  type Invitation 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function InvitationList({ onInvitationProcessed }: { onInvitationProcessed: () => void }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadInvitations = () => {
    setIsLoading(true);
    getPendingInvitations()
      .then(setInvitations)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleAccept = async (orgId: number) => {
    setProcessingId(orgId);
    try {
      await acceptInvitation(orgId);
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.organizationId !== orgId));
      onInvitationProcessed(); // Reload dashboard organizations
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (orgId: number) => {
    setProcessingId(orgId);
    try {
      await declineInvitation(orgId);
      setInvitations(prev => prev.filter(inv => inv.organizationId !== orgId));
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return null; // Don't show loading state initially to avoid layout shift
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">Pending Invitations</h2>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {invitations.map((invitation) => (
          <Card key={invitation.organizationId}>
            <CardHeader className="pb-3">
              <CardTitle>{invitation.organizationName}</CardTitle>
              <CardDescription>Invited as {invitation.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDecline(invitation.organizationId)}
                  disabled={processingId === invitation.organizationId}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleAccept(invitation.organizationId)}
                  disabled={processingId === invitation.organizationId}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}