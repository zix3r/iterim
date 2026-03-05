import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getOrganizationById } from '@/lib/api';
import type { OrganizationDetail } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function OrganizationPage() {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);

  useEffect(() => {
    if (orgId) {
      getOrganizationById(Number(orgId))
        .then(setOrganization)
        .catch(console.error);
    }
  }, [orgId]);

  if (!organization) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground">Slug: {organization.slug}</p>
      </div>

      <div className="border rounded-md mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organization.members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell className="font-medium">{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{member.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}