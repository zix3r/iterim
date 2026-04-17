import { useNavigate } from 'react-router';
import { Building2, Users2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyTeamsTree } from '@/hooks/useMyTeamsTree';
import { CreateOrganizationModal } from '@/features/organizations/components/CreateOrganizationModal';

export function MyTeamsByOrgCard() {
  const { organizations, isLoading, refetch } = useMyTeamsTree();
  const navigate = useNavigate();
  const hasOrgs = organizations.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
          <Building2 className="h-4 w-4 text-zinc-500" />
          My Organizations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="bg-zinc-200 animate-pulse h-5 w-32 rounded-md" />
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="bg-zinc-200 animate-pulse h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !hasOrgs ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-500">You don't belong to any organization yet.</p>
            <CreateOrganizationModal onCreated={refetch} />
          </div>
        ) : (
          <div className="space-y-5">
            {organizations.map((org) => (
              <div key={org.id}>
                <button
                  onClick={() => navigate(`/org/${org.id}`)}
                  className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  {org.name}
                </button>
                {org.products.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">No products</p>
                ) : (
                  <div className="space-y-3">
                    {org.products.map((product) => (
                      <div key={product.id}>
                        <button
                          onClick={() => navigate(`/org/${org.id}/products/${product.id}`)}
                          className="text-xs text-zinc-500 mb-1.5 hover:text-zinc-900 transition-colors cursor-pointer"
                        >
                          {product.name}
                        </button>
                        {product.teams.length === 0 ? (
                          <p className="text-sm text-zinc-500 italic">No teams</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {product.teams.map((team) => (
                              <button
                                key={team.id}
                                onClick={() =>
                                  navigate(
                                    `/org/${org.id}/products/${product.id}/teams/${team.id}`
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100 cursor-pointer transition-colors"
                              >
                                <Users2 className="h-3.5 w-3.5 text-zinc-400" />
                                {team.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
