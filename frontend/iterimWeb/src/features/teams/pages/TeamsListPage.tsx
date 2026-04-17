import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { getTeamsByProduct, getProductById } from '@/lib/api';
import type { Team, ProductDetail } from '@/lib/api';
import { TeamCard } from '@/features/teams/components/TeamCard';
import { CreateTeamModal } from '@/features/teams/components/CreateTeamModal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Users, AlertCircleIcon } from 'lucide-react';
import { addRecentPage } from '@/lib/recentPages';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export function TeamsListPage() {
  const { orgId, productId } = useParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Išsprendžiame setState useEffect viduje problemą
  const loadTeams = useCallback(async () => {
    if (!productId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const [teamsData, productData] = await Promise.all([
        getTeamsByProduct(Number(productId)),
        getProductById(Number(productId))
      ]);
      setTeams(teamsData);
      setProduct(productData);
    } catch (err) {
      console.error('Failed to load teams:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teams. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (product && orgId && productId) {
      addRecentPage({
        path: `/org/${orgId}/products/${productId}/teams`,
        label: `${product.name} — Teams`,
        iconType: 'Product',
      });
    }
  }, [product, orgId, productId]);

  // 1. SKELETON BŪSENA (Krovimosi metu)
  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-4 w-64 mb-6" /> {/* Breadcrumbs */}
        
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* Title */}
            <Skeleton className="h-4 w-32" /> {/* Subtitle */}
          </div>
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Button */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  // 2. KLAIDOS BŪSENA
  if (error || !product) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircleIcon className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Teams</h3>
          <p className="text-sm text-red-700">{error || "Product not found."}</p>
          <Button onClick={loadTeams} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = product.userRole === 'Admin';

  // 3. SĖKMINGA BŪSENA
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
        <EmptyState 
          title="No teams yet"
          description={isAdmin 
            ? 'Get started by creating your first team.' 
            : 'No teams have been created in this product yet.'}
          icon={<Users className="h-8 w-8" />}
          action={isAdmin ? <CreateTeamModal productId={Number(productId)} onCreated={loadTeams} /> : undefined}
        />
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