import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getTeamById, getOrganizationById, removeTeamMember, deleteTeam, updateTeam, updateTeamMemberRole } from '@/lib/api';
import type { TeamDetail, OrganizationDetail } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddTeamMemberModal } from '@/features/teams/components/AddTeamMemberModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingPage } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/dates';
import { AlertCircleIcon, UsersIcon, TrashIcon, ShieldIcon, PencilIcon, SaveIcon, XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router';

export function TeamDetailPage() {
  const { orgId, productId, teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadTeam = () => {
    if (teamId && orgId) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getTeamById(Number(teamId)),
        getOrganizationById(Number(orgId))
      ])
        .then(([teamData, orgData]) => {
          setTeam(teamData);
          setOrganization(orgData);
          setEditName(teamData.name);
          setEditDescription(teamData.description || '');
        })
        .catch((err) => {
          console.error('Failed to load team:', err);
          setError('Failed to load team. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    loadTeam();
  }, [teamId, orgId]);

  const handleRemoveMember = async () => {
    if (!teamId || !memberToDelete) return;
    
    setIsDeleting(true);
    try {
      await removeTeamMember(Number(teamId), memberToDelete);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team member removed successfully'
      });
      setDeleteMemberDialogOpen(false);
      setMemberToDelete(null);
      loadTeam(); // Reload team data
    } catch (error) {
      console.error('Failed to remove team member', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to remove team member. Please try again.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;
    
    setIsDeleting(true);
    try {
      await deleteTeam(Number(teamId));
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team deleted successfully'
      });
      navigate(`/org/${orgId}/products/${productId}/teams`);
    } catch (error) {
      console.error('Failed to delete team', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to delete team. Please try again.'
      });
      setIsDeleting(false);
      setDeleteTeamDialogOpen(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!teamId || !editName.trim()) return;
    
    setIsSaving(true);
    try {
      await updateTeam(Number(teamId), {
        name: editName,
        description: editDescription || undefined
      });
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team updated successfully'
      });
      setIsEditing(false);
      loadTeam(); // Reload team data
    } catch (error) {
      console.error('Failed to update team', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to update team. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (team) {
      setEditName(team.name);
      setEditDescription(team.description || '');
    }
    setIsEditing(false);
  };

  const handleRoleChange = async (memberUserId: number, newRole: string) => {
    if (!teamId) return;
    
    try {
      await updateTeamMemberRole(Number(teamId), memberUserId, {
        role: Number(newRole)
      });
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Member role updated successfully'
      });
      loadTeam(); // Reload team data
    } catch (error: any) {
      console.error('Failed to update member role', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: error.message || 'Failed to update member role. Please try again.'
      });
      // Reload to revert the UI change
      loadTeam();
    }
  };

  if (isLoading) return <LoadingPage />;
  
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Team</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadTeam}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!team || !organization) return <div className="p-8">Team not found</div>;

  // User can manage team if they are:
  // 1. The product creator, OR
  // 2. A team admin
  const isProductCreator = team.currentUserId === team.productCreatedBy;
  const isTeamAdmin = team.members.some(
    m => m.userId === team.currentUserId && m.role === 'Admin'
  );
  const canManageTeam = isProductCreator || isTeamAdmin;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: organization.name, href: `/org/${orgId}` },
          { label: 'Products', href: `/org/${orgId}/products` },
          { label: team.productName, href: `/org/${orgId}/products/${productId}` },
          { label: 'Teams', href: `/org/${orgId}/products/${productId}/teams` },
          { label: team.name }
        ]}
      />

      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Team name"
                className="text-2xl font-bold"
                disabled={isSaving}
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Team description (optional)"
                rows={3}
                disabled={isSaving}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSaveTeam}
                  disabled={isSaving || !editName.trim()}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                {canManageTeam && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {team.description && (
                <p className="text-muted-foreground mt-2">{team.description}</p>
              )}
            </div>
          )}
        </div>
        {!isEditing && (
		  <div className="flex items-center gap-2">
            <Button asChild>
              <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/backlog`}>
                Open Backlog
              </Link>
            </Button>
            {canManageTeam && (
              <Button 
                variant="destructive" 
                onClick={() => setDeleteTeamDialogOpen(true)}
              >
                Delete Team
            </Button>
		    )}
		</div>
	    )}
      </div>

      {/* Team Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Team ID:</span> {team.id}
          </div>
          <div>
            <span className="font-medium">Product:</span> {team.productName}
          </div>
          <div>
            <span className="font-medium">Created:</span> {formatDate(team.createdAt)} by {team.createdByName}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {formatDate(team.updatedAt)} by {team.updatedByName}
          </div>
        </CardContent>
      </Card>

      {/* Team Members Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <UsersIcon className="h-5 w-5 mr-2" />
            Team Members ({team.members.length})
          </h2>
          {canManageTeam && (
            <AddTeamMemberModal 
              teamId={Number(teamId)} 
              availableMembers={organization.members.filter(m => m.status === 'Active')}
              currentMembers={team.members}
              onAdded={loadTeam}
            />
          )}
        </div>

        {team.members.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No members in this team yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {team.members.map((member) => {
              const isMemberTeamCreator = member.userId === team.createdBy;
              return (
              <Card key={member.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{member.userName}</h3>
                        {isMemberTeamCreator && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                            Creator
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {formatDate(member.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageTeam ? (
                        <select
                          value={member.role === 'Admin' ? '0' : '1'}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                          className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="0">Admin</option>
                          <option value="1">Member</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm ${
                          member.role === 'Admin' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {member.role === 'Admin' && <ShieldIcon className="h-3 w-3 mr-1" />}
                          {member.role}
                        </span>
                      )}
                      {canManageTeam && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setMemberToDelete(member.userId);
                            setDeleteMemberDialogOpen(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteMemberDialogOpen(false);
                setMemberToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveMember}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{team.name}"? This will remove all team members and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteTeamDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTeam}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
