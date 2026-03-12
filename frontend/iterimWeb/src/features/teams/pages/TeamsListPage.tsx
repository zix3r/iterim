import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getTeamsByProduct, getProductById } from '@/lib/api';
import type { Team, ProductDetail } from '@/lib/api';
import { TeamCard } from '@/features/teams/components/TeamCard';
import { CreateTeamModal } from '@/features/teams/components/CreateTeamModal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingPage } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { UsersIcon, AlertCircleIcon } from 'lucide-react';

export function TeamsListPage() {
  const { orgId, productId } = useParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = () => {
    if (productId) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getTeamsByProduct(Number(productId)),
        getProductById(Number(productId))
      ])
        .then(([teamsData, productData]) => {
          setTeams(teamsData);
          setProduct(productData);
        })
        .catch((err) => {
          console.error('Failed to load teams:', err);
          setError('Failed to load teams. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    loadTeams();
  }, [productId]);

  if (isLoading) return <LoadingPage />;
  
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Teams</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadTeams}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  if (!product) return <div className="p-8">Product not found</div>;

  const isAdmin = product.userRole === 'Admin';

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: product.organizationName, href: `/org/${orgId}` },
          { label: 'Products', href: `/org/${orgId}/products` },
          { label: product.name, href: `/org/${orgId}/products/${productId}` },
          { label: 'Teams' }
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
        {isAdmin && <CreateTeamModal productId={Number(productId)} onCreated={loadTeams} />}
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <UsersIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin 
              ? 'Get started by creating your first team.' 
              : 'No teams have been created in this product yet.'}
          </p>
          {isAdmin && <CreateTeamModal productId={Number(productId)} onCreated={loadTeams} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
