import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getOrganizationById, getProductsByOrganization, removeOrganizationMember } from '@/lib/api';
import type { OrganizationDetail } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingPage } from '@/components/ui/spinner';
import { AlertCircleIcon, Trash2Icon } from 'lucide-react';
import { AddMemberModal } from '../components/AddMemberModal';
import { useToast } from '@/components/ui/toast';

export function OrganizationPage() {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const { toast } = useToast();

  const loadData = () => {
    if (orgId) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getOrganizationById(Number(orgId)),
        getProductsByOrganization(Number(orgId))
      ])
        .then(([orgData, productsData]) => {
          setOrganization(orgData);
          setProductCount(productsData.length);
        })
        .catch((err) => {
          console.error('Failed to load organization:', err);
          setError('Failed to load organization. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  };

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
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to remove member',
        variant: "destructive",
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);


  if (isLoading) return <LoadingPage />;
  
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Organization</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  if (!organization) return <div className="p-8">Organization not found</div>;

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
        <Link to={`/org/${orgId}/products`}>
          <Button>View Products</Button>
        </Link>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
          </CardContent>
        </Card>
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
                {organization.userRole === 'Admin' && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">{member.email}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.status}</TableCell>
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
    </div>
  );
}