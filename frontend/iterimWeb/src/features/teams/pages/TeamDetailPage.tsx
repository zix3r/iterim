import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getTeamById, getOrganizationById, removeTeamMember, deleteTeam, updateTeamMemberRole, assignTeamMemberTags } from '@/lib/api';
import type { TeamDetail, OrganizationDetail, TeamMember, Tag } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddTeamMemberModal } from '@/features/teams/components/AddTeamMemberModal';
import { EditTeamModal } from '@/features/teams/components/EditTeamModal';
import { WorkScheduleEditor } from '@/features/teams/components/WorkScheduleEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/dates';
import { AlertCircleIcon, UsersIcon, TrashIcon, ShieldIcon, StarIcon, TagIcon, ClockIcon } from 'lucide-react';
import { TagBadge } from '@/components/shared/TagBadge';
import { TagSelector } from '@/components/shared/TagSelector';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router';
import { addRecentPage } from '@/lib/recentPages';
import { usePinnedTeams } from '@/lib/favorites';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

// Pagalbinė funkcija grafiko ženkliukui
const getScheduleBadgeLabel = (type?: string, hours?: number) => {
  const t = type || 'FullTime';
  const h = hours || 40;
  if (t === 'FullTime') return `FT ${h}h`;
  if (t === 'PartTime') return `PT ${h}h`;
  return `Custom ${h}h`;
};

export function TeamDetailPage() {
  const { orgId, productId, teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tagEditMember, setTagEditMember] = useState<TeamMember | null>(null);
  const [tagEditSelected, setTagEditSelected] = useState<Tag[]>([]);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [editingScheduleMember, setEditingScheduleMember] = useState<TeamMember | null>(null);
  
  const { toast } = useToast();
  const { isPinned, togglePin } = usePinnedTeams();
  const { t } = useLanguage();

  useEffect(() => {
    if (team && orgId && productId && teamId) {
      addRecentPage({
        path: `/org/${orgId}/products/${productId}/teams/${teamId}`,
        label: team.name,
        iconType: 'Team'
      });
    }
  }, [team, orgId, productId, teamId]);

  const loadTeam = useCallback(async () => {
    if (!teamId || !orgId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const [teamData, orgData] = await Promise.all([
        getTeamById(Number(teamId)),
        getOrganizationById(Number(orgId))
      ]);
      setTeam(teamData);
      setOrganization(orgData);
    } catch (err) {
      console.error('Failed to load team:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, orgId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleRemoveMember = async () => {
    if (!teamId || !memberToDelete) return;

    setIsDeleting(true);
    try {
      await removeTeamMember(Number(teamId), memberToDelete);
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('teams.failedDelete') // Pakeiskite į sėkmės pranešimą, jei norite
      });
      setDeleteMemberDialogOpen(false);
      setMemberToDelete(null);
      loadTeam();
    } catch (err) {
      console.error('Failed to remove team member', err);
      const errorMessage = err instanceof Error ? err.message : t('teams.failedDelete');
      toast({
        variant: 'error',
        title: t('common.error'),
        description: errorMessage
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
        title: t('common.success'),
        description: 'Team deleted successfully'
      });
      navigate(`/org/${orgId}/products/${productId}/teams`);
    } catch (err) {
      console.error('Failed to delete team', err);
      const errorMessage = err instanceof Error ? err.message : t('teams.failedDelete');
      toast({
        variant: 'error',
        title: t('common.error'),
        description: errorMessage
      });
      setIsDeleting(false);
      setDeleteTeamDialogOpen(false);
    }
  };

  const handleRoleChange = async (memberUserId: number, newRole: string) => {
    if (!teamId) return;

    try {
      await updateTeamMemberRole(Number(teamId), memberUserId, {
        role: Number(newRole)
      });
      toast({
        variant: 'success',
        title: t('common.success'),
        description: 'Role updated successfully'
      });
      loadTeam();
    } catch (err) {
      console.error('Failed to update member role', err);
      const errorMessage = err instanceof Error ? err.message : t('teams.failedUpdate');
      toast({
        variant: 'error',
        title: t('common.error'),
        description: errorMessage
      });
      loadTeam();
    }
  };

  const handleSaveMemberTags = async () => {
    if (!tagEditMember || !teamId) return;
    setIsSavingTags(true);
    try {
      await assignTeamMemberTags(Number(teamId), tagEditMember.id, tagEditSelected.map(t => t.id));
      toast({ variant: 'success', title: 'Tags updated' });
      setTagEditMember(null);
      loadTeam();
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: err instanceof Error ? err.message : 'Failed to update tags' });
    } finally {
      setIsSavingTags(false);
    }
  };

  // 1. SKELETON BŪSENA
  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-4 w-64 mb-6" /> {/* Breadcrumbs */}
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-10 w-64" /> {/* Title */}
            <Skeleton className="h-4 w-96" /> {/* Description */}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32 rounded-md" /> {/* Backlog Button */}
            <Skeleton className="h-10 w-24 rounded-md" /> {/* Delete Button */}
          </div>
        </div>

        <Card className="mt-8 p-6 space-y-4">
           <Skeleton className="h-6 w-48 mb-4" /> {/* Section Title */}
           <Skeleton className="h-4 w-full max-w-md" />
           <Skeleton className="h-4 w-full max-w-sm" />
           <Skeleton className="h-4 w-full max-w-lg" />
        </Card>

        <div className="space-y-4 mt-8">
           <div className="flex justify-between items-center">
             <Skeleton className="h-8 w-48" /> {/* Members Title */}
             <Skeleton className="h-10 w-32 rounded-md" /> {/* Add Member Button */}
           </div>
           {[1, 2, 3].map(i => (
             <Card key={i} className="p-4">
               <div className="flex justify-between items-center">
                 <div className="space-y-2">
                   <Skeleton className="h-5 w-48" />
                   <Skeleton className="h-4 w-32" />
                 </div>
                 <Skeleton className="h-8 w-24 rounded-md" />
               </div>
             </Card>
           ))}
        </div>
      </div>
    );
  }
  
  // 2. KLAIDOS BŪSENA
  if (error || !team || !organization) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircleIcon className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">{t('teams.failedLoad')}</h3>
          <p className="text-sm text-red-700">{error || t('common.notFound')}</p>
          <Button onClick={loadTeam} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  // User can manage team if they are:
  // 1. The product creator, OR
  // 2. A team admin
  const isProductCreator = team.currentUserId === team.productCreatedBy;
  const isTeamAdmin = team.members.some(
    m => m.userId === team.currentUserId && m.role === 'Admin'
  );
  const canManageTeam = isProductCreator || isTeamAdmin;

  // 3. SĖKMINGA BŪSENA
  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: t('dashboard.title'), href: '/dashboard' },
          { label: organization.name, href: `/org/${orgId}` },
          { label: t('products.title'), href: `/org/${orgId}/products` },
          { label: team.productName, href: `/org/${orgId}/products/${productId}` },
          { label: t('teams.title'), href: `/org/${orgId}/products/${productId}/teams` },
          { label: team.name }
        ]}
      />

      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const currentlyPinned = isPinned(team.id);
                  try {
                    await togglePin(team.id, currentlyPinned);
                    toast({
                      variant: 'success',
                      title: currentlyPinned ? t('common.remove') : t('common.add'),
                      description: currentlyPinned ? t('common.remove') : t('common.add'),
                    });
                  } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : t('common.error');
                    toast({
                      variant: 'error',
                      title: t('common.error'),
                      description: errorMessage,
                    });
                  }
                }}
                className={isPinned(team.id) ? 'text-yellow-500 hover:text-yellow-600' : 'text-zinc-400 hover:text-zinc-600'}
                title={isPinned(team.id) ? 'Unpin team' : 'Pin team'}
              >
                <StarIcon className={`h-5 w-5 ${isPinned(team.id) ? 'fill-current' : ''}`} />
              </Button>
            </div>
            {team.description && (
              <p className="text-muted-foreground mt-2">{team.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to={`/org/${orgId}/products/${productId}/teams/${teamId}/backlog`}>
              {t('backlog.title')}
            </Link>
          </Button>
          {canManageTeam && (
            <Button variant="outline" onClick={() => setEditTeamDialogOpen(true)}>
              {t('common.edit')}
            </Button>
          )}
          {canManageTeam && (
            <Button
              variant="destructive"
              onClick={() => setDeleteTeamDialogOpen(true)}
            >
              {t('common.delete')}
            </Button>
          )}
        </div>
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
            <span className="font-medium">{t('products.title')}:</span> {team.productName}
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
            {t('teams.members')} ({team.members.length})
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{member.userName}</h3>
                        {/* 1. PRIDĖTAS GRAFIKO ŽENKLIUKAS (Badge) */}
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground bg-zinc-50/50">
                          {getScheduleBadgeLabel(member.scheduleType, member.weeklyHours)}
                        </Badge>
                        {isMemberTeamCreator && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                            {t('common.create')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {formatDate(member.createdAt)}
                      </p>
                      {member.tags && member.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {member.tags.map(tag => <TagBadge key={tag.id} tag={tag} size="xs" />)}
                        </div>
                      )}
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
                      
                      {/* 2. PRIDĖTAS MYGTUKAS VALANDŲ REDAGAVIMUI */}
                      {canManageTeam && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingScheduleMember(member)}
                          title="Edit work schedule"
                        >
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}

                      {canManageTeam && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTagEditMember(member);
                            setTagEditSelected(member.tags ?? []);
                          }}
                          title="Edit tags"
                        >
                          <TagIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                      {canManageTeam && !isMemberTeamCreator && (
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

      {canManageTeam && (
        <EditTeamModal
          team={team}
          open={editTeamDialogOpen}
          onOpenChange={setEditTeamDialogOpen}
          onUpdated={loadTeam}
        />
      )}

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('teams.removeMember')}</DialogTitle>
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
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Tags Dialog */}
      <Dialog open={!!tagEditMember} onOpenChange={(v) => { if (!v) setTagEditMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tags — {tagEditMember?.userName}</DialogTitle>
            <DialogDescription>Assign skill tags to this team member.</DialogDescription>
          </DialogHeader>
          {tagEditMember && (
            <TagSelector
              orgId={Number(orgId)}
              selected={tagEditSelected}
              onChange={setTagEditSelected}
              disabled={isSavingTags}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagEditMember(null)} disabled={isSavingTags}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveMemberTags} disabled={isSavingTags}>
              {isSavingTags ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('teams.deleteConfirm')}</DialogTitle>
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
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. NAUJAS DARBO VALANDŲ REDAGAVIMO MODALAS */}
      <WorkScheduleEditor
        teamId={Number(teamId)}
        member={editingScheduleMember as unknown as import('@/lib/api').TeamMember}
        isOpen={editingScheduleMember !== null}
        onClose={() => setEditingScheduleMember(null)}
        onUpdated={loadTeam}
      />
    </div>
  );
}