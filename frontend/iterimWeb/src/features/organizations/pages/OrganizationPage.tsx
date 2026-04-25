import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { getOrganizationById, getProductsByOrganization, removeOrganizationMember, deleteOrganization, getOrgTags, createOrgTag, deleteOrgTag } from '@/lib/api';
import type { OrganizationDetail, Tag } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { AlertCircleIcon, Trash2Icon, PlusIcon } from 'lucide-react';
import { TagBadge } from '@/components/shared/TagBadge';
import { AddMemberModal } from '../components/AddMemberModal';
import { useToast } from '@/components/ui/toast';
import { CreateAbsenceModal } from '@/features/absences/components/CreateAbsenceModal';
import { addRecentPage } from '@/lib/recentPages';
import { Skeleton } from '@/components/ui/skeleton';

export function OrganizationPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const [deleteOrgDialogOpen, setDeleteOrgDialogOpen] = useState(false);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [orgTags, setOrgTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (organization && orgId) {
      addRecentPage({
        path: `/org/${orgId}`,
        label: organization.name,
        iconType: 'Org'
      });
    }
  }, [organization, orgId]);

  const loadData = useCallback(() => {
    if (orgId) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getOrganizationById(Number(orgId)),
        getProductsByOrganization(Number(orgId)),
        getOrgTags(Number(orgId))
      ])
        .then(([orgData, productsData, tagsData]) => {
          setOrganization(orgData);
          setProductCount(productsData.length);
          setOrgTags(tagsData);
        })
        .catch((err) => {
          console.error('Failed to load organization:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to load organization. Please try again.';
          setError(errorMessage);
        })
        .finally(() => setIsLoading(false));
    }
  }, [orgId]);

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    setRemovingMemberId(memberId);
    try {
      await removeOrganizationMember(Number(orgId), memberId);
      toast({
        title: "Success",
        description: "Organization member removed successfully",
        variant: "default",
      });
      loadData(); // Reload data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setRemovingMemberId(null);
    }
  };
  
  const handleDeleteOrganization = async () => {
    if (!orgId) return;

    setIsDeletingOrg(true);
    try {
      await deleteOrganization(Number(orgId));
      toast({ title: "Success", description: "Organization deleted successfully." });
      navigate('/dashboard'); // Ištrynus, grąžiname į pagrindinį puslapį
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization';
      toast({ title: "Error", description: errorMessage, variant: "error" });
      setIsDeletingOrg(false);
      setDeleteOrgDialogOpen(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);


  // 1. SKELETON BŪSENA (Krovimosi metu)
  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-4 w-48 mb-6" /> {/* Breadcrumbs */}
        
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" /> {/* Title */}
            <Skeleton className="h-4 w-32" /> {/* Subtitle */}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-md" /> {/* Button */}
            <Skeleton className="h-10 w-32 rounded-md" /> {/* Button */}
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
             <Card key={i}>
                <CardHeader><Skeleton className="h-4 w-20" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-12" /></CardContent>
             </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="space-y-4 mt-8">
           <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-32 rounded-md" />
           </div>
           <div className="border rounded-md p-4 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
           </div>
        </div>
      </div>
    );
  }
  
  // 2. KLAIDOS BŪSENA
  if (error || !organization) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircleIcon className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Organization</h3>
          <p className="text-sm text-red-700">{error || "Organization not found."}</p>
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
  
  const canManageAllAbsences = organization.userRole === 'Admin';
  const isAdmin = organization.userRole === 'Admin';

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name || !orgId) return;
    setIsCreatingTag(true);
    try {
      const tag = await createOrgTag(Number(orgId), { name, color: newTagColor });
      setOrgTags(prev => [...prev, tag]);
      setNewTagName('');
      setNewTagColor('#6366f1');
      setShowNewTagForm(false);
      toast({ variant: 'success', title: 'Tag created' });
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: err instanceof Error ? err.message : 'Failed to create tag' });
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!orgId) return;
    try {
      await deleteOrgTag(Number(orgId), tagId);
      setOrgTags(prev => prev.filter(t => t.id !== tagId));
      toast({ variant: 'success', title: 'Tag deleted' });
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete tag' });
    }
  };

  // 3. SĖKMINGA BŪSENA
  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: organization.name }
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-muted-foreground">Slug: {organization.slug}</p>
        </div>
        <div className="flex gap-2">
          {/* TIK ADMINAMS: Raudonas trynimo mygtukas */}
          {organization.userRole === 'Admin' && (
            <Button 
              variant="destructive" 
              onClick={() => setDeleteOrgDialogOpen(true)}
              disabled={isDeletingOrg}
            >
              {isDeletingOrg ? 'Deleting...' : 'Delete Organization'}
            </Button>
          )}
          
          <Link to={`/org/${orgId}/absences`}>
            <Button variant="outline">Manage Absences</Button>
          </Link>
          <Link to={`/org/${orgId}/products`}>
            <Button>View Products</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.members.length}</div>
          </CardContent>
        </Card>
        <Link to={`/org/${orgId}/products`} className="block h-full group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardHeader>
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productCount}</div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.members.filter(m => m.status === 'Active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Members</h2>
          {organization.userRole === 'Admin' && (
            <AddMemberModal 
              organizationId={organization.id} 
              onMemberAdded={loadData} 
            />
          )}
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Absence</TableHead>
                {organization.userRole === 'Admin' && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">{member.email}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.status}</TableCell>
                  <TableCell>
                    {(canManageAllAbsences || member.userId === organization.currentUserId) ? (
                      <CreateAbsenceModal
                        orgId={organization.id}
                        members={organization.members}
                        canManageAllAbsences={canManageAllAbsences}
                        currentUserId={organization.currentUserId}
                        initialOrgMemberId={member.id}
                        triggerLabel="Register"
                        triggerSize="sm"
                        triggerVariant="outline"
                        triggerDisabled={member.status !== 'Active'}
                        onCreated={loadData}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">No access</span>
                    )}
                  </TableCell>
                  {organization.userRole === 'Admin' && (
                    <TableCell>
                      {member.userId !== organization.currentUserId && ( // Prevent removing self (use Leave Org instead)
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removingMemberId === member.id}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Tags Management (Admin only) */}
      {isAdmin && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tags</h2>
            <Button variant="outline" size="sm" onClick={() => setShowNewTagForm(v => !v)}>
              <PlusIcon className="h-4 w-4 mr-1" /> New Tag
            </Button>
          </div>

          {showNewTagForm && (
            <Card className="mb-4">
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={e => setNewTagColor(e.target.value)}
                    className="h-8 w-8 rounded border-0 p-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateTag(); if (e.key === 'Escape') setShowNewTagForm(false); }}
                    placeholder="Tag name (e.g. frontend)"
                    className="flex-1 text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreateTag} disabled={isCreatingTag || !newTagName.trim()}>
                    {isCreatingTag ? 'Creating…' : 'Create'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewTagForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-4">
              {orgTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet. Create tags to use them in work items and assign them to team members.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {orgTags.map(tag => (
                    <TagBadge key={tag.id} tag={tag} onRemove={() => handleDeleteTag(tag.id)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={deleteOrgDialogOpen} onOpenChange={setDeleteOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{organization.name}"? This will permanently remove all products, teams, sprints, and work items. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOrgDialogOpen(false)} disabled={isDeletingOrg}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrganization} disabled={isDeletingOrg}>
              {isDeletingOrg ? 'Deleting...' : 'Delete Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}