import { useEffect, useState, useCallback } from 'react';
import { 
  getAdminOrganizations, 
  deleteAdminOrganization, 
  getAdminOrganizationDetails,
  type AdminOrganizationListDto,
  type AdminOrganizationDetailDto,
  type AdminOrgMemberDto,
  type AdminOrgProductDto,
  type AdminOrgTeamDto
} from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { AlertCircle, Search, Trash2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/dates';

// Svarbu: Pridėtas AdminLayout importas! 
// (Jei tavo IDE meta klaidą, kad neranda kelio, tiesiog pakeisk '../components/AdminLayout' į teisingą kelią tavo projekte, pvz., iš kur importuojamas Users puslapyje)
import { AdminLayout } from '../components/AdminLayout'; 

export function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<AdminOrganizationListDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [detailsData, setDetailsData] = useState<AdminOrganizationDetailDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { toast } = useToast();

  const loadOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAdminOrganizations();
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const loadDetails = async (id: number) => {
    setDetailsId(id);
    setIsLoadingDetails(true);
    try {
      const data = await getAdminOrganizationDetails(id);
      setDetailsData(data);
    } catch {
      toast({ variant: 'error', title: 'Error', description: 'Failed to load organization details.' });
      setDetailsId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteAdminOrganization(deleteId);
      toast({ variant: 'success', title: 'Deleted', description: 'Organization successfully deleted.' });
      setDeleteId(null);
      loadOrganizations(); // Refresh list
    } catch {
      toast({ variant: 'error', title: 'Error', description: 'Failed to delete organization.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOrgs = organizations.filter(orgItem => {
    const orgRecord = orgItem as unknown as Record<string, unknown>;
    const name = (orgItem.name ?? orgRecord.Name ?? '') as string;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="space-y-4 mt-8">
             <Skeleton className="h-12 w-full" />
             {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto mt-12">
          <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-600 mb-2" />
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
            <Button onClick={loadOrganizations} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">Try Again</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const dRecord = detailsData as unknown as Record<string, unknown>;
  const detailsName = detailsData ? ((detailsData.name ?? dRecord?.Name) as string) : '';
  const detailsSlug = detailsData ? ((detailsData.slug ?? dRecord?.Slug) as string) : '';
  const detailsCreatedAt = detailsData ? ((detailsData.createdAt ?? dRecord?.CreatedAt) as string | null) : null;
  const detailsMembers = detailsData ? ((detailsData.members ?? dRecord?.Members ?? []) as AdminOrgMemberDto[]) : [];
  const detailsProducts = detailsData ? ((detailsData.products ?? dRecord?.Products ?? []) as AdminOrgProductDto[]) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">Manage all organizations across the platform.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="text-center">Teams</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No organizations found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrgs.map((orgItem) => {
                  const orgRecord = orgItem as unknown as Record<string, unknown>;
                  const id = (orgItem.id ?? orgRecord.Id) as number;
                  const name = (orgItem.name ?? orgRecord.Name) as string;
                  const slug = (orgItem.slug ?? orgRecord.Slug) as string;
                  const memberCount = (orgItem.memberCount ?? orgRecord.MemberCount ?? 0) as number;
                  const productCount = (orgItem.productCount ?? orgRecord.ProductCount ?? 0) as number;
                  const teamCount = (orgItem.teamCount ?? orgRecord.TeamCount ?? 0) as number;
                  const createdAt = (orgItem.createdAt ?? orgRecord.CreatedAt) as string | null;
                  const lastActivityAt = (orgItem.lastActivityAt ?? orgRecord.LastActivityAt) as string | null;

                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">
                        {name}
                        <div className="text-xs text-muted-foreground">{slug}</div>
                      </TableCell>
                      <TableCell className="text-center">{memberCount}</TableCell>
                      <TableCell className="text-center">{productCount}</TableCell>
                      <TableCell className="text-center">{teamCount}</TableCell>
                      <TableCell>{createdAt ? formatDate(createdAt) : 'Unknown'}</TableCell>
                      <TableCell>{lastActivityAt ? formatDate(lastActivityAt) : 'Never'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => loadDetails(id)} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(id)} title="Delete Organization">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* DETALIŲ MODALAS */}
        <Dialog open={detailsId !== null} onOpenChange={(v) => !v && setDetailsId(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Organization Details</DialogTitle>
            </DialogHeader>
            
            {isLoadingDetails || !detailsData ? (
               <div className="space-y-4 py-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
               </div>
            ) : (
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-xl font-bold">{detailsName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {detailsCreatedAt ? formatDate(detailsCreatedAt) : 'Unknown'} | Slug: {detailsSlug}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 border-b pb-1">
                    Members ({detailsMembers.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {detailsMembers.map((mItem) => {
                      const mRecord = mItem as unknown as Record<string, unknown>;
                      const mId = (mItem.id ?? mRecord.Id) as number;
                      const mEmail = (mItem.email ?? mRecord.Email) as string;
                      const mRole = (mItem.role ?? mRecord.Role) as string;
                      const mStatus = (mItem.status ?? mRecord.Status) as string;

                      return (
                        <div key={mId} className="text-sm border p-2 rounded bg-muted/30">
                          <div className="font-medium">{mEmail}</div>
                          <div className="text-xs text-muted-foreground">{mRole} • {mStatus}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 border-b pb-1">
                    Products & Teams ({detailsProducts.length} Products)
                  </h4>
                  {detailsProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No products found.</p>
                  ) : (
                    <div className="space-y-3">
                      {detailsProducts.map((pItem) => {
                        const pRecord = pItem as unknown as Record<string, unknown>;
                        const pId = (pItem.id ?? pRecord.Id) as number;
                        const pName = (pItem.name ?? pRecord.Name) as string;
                        const pTeams = (pItem.teams ?? pRecord.Teams ?? []) as AdminOrgTeamDto[];

                        return (
                          <div key={pId} className="border p-3 rounded-md">
                            <div className="font-medium text-primary mb-1">{pName}</div>
                            <div className="text-sm pl-4 border-l-2 border-muted">
                              {pTeams.length === 0 ? (
                                <span className="text-muted-foreground text-xs">No teams</span>
                              ) : (
                                pTeams.map((tItem) => {
                                  const tRecord = tItem as unknown as Record<string, unknown>;
                                  const tId = (tItem.id ?? tRecord.Id) as number;
                                  const tName = (tItem.name ?? tRecord.Name) as string;
                                  return <div key={tId}>• {tName}</div>;
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* TRYNIMO PATVIRTINIMAS */}
        <Dialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Organization</DialogTitle>
              <DialogDescription>
                Are you absolutely sure? This will permanently delete the organization and ALL of its products, teams, work items, and members. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}