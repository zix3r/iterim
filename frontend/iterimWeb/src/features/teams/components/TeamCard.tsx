import { Link, useParams } from 'react-router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UsersIcon } from 'lucide-react';
import type { Team } from '@/lib/api';

export function TeamCard({ team }: { team: Team }) {
  const { orgId, productId } = useParams();
  
  return (
    <Link 
      to={`/org/${orgId}/products/${productId}/teams/${team.id}`} 
      className="block transition-transform hover:scale-[1.02]"
    >
      <Card className="cursor-pointer hover:border-primary/50">
        <CardHeader>
          <CardTitle>{team.name}</CardTitle>
          {team.description && (
            <CardDescription>{team.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <UsersIcon className="h-4 w-4 mr-2" />
            <span>{team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
