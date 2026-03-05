import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Organization } from '@/lib/api';

export function OrganizationCard({ organization }: { organization: Organization }) {
  return (
    <Link to={`/org/${organization.id}`} className="block transition-transform hover:scale-[1.02]">
      <Card className="cursor-pointer hover:border-primary/50">
        <CardHeader>
          <CardTitle>{organization.name}</CardTitle>
          <CardDescription>/{organization.slug}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}