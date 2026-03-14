import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, LayoutList, Package, Layers } from 'lucide-react';
import type { DashboardOrganization, DashboardProduct, DashboardTeam } from '@/lib/api';

interface OrgCardProps {
  organization: DashboardOrganization;
}

export function OrganizationHierarchyCard({ organization }: OrgCardProps) {
  return (
    <Card className="h-full flex flex-col shadow hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/80 overflow-hidden">
      <CardHeader className="pb-3 bg-muted/10 border-b space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Organization</div>
        <div className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-bold truncate flex items-center gap-2 max-w-[80%]">
            <div className="bg-background p-1.5 rounded-md shadow-sm border border-border/50 shrink-0">
              <LayoutList className="h-4 w-4 text-primary" />
            </div>
            <Link to={`/org/${organization.id}`} className="hover:underline hover:text-primary transition-colors truncate">
              {organization.name}
            </Link>
          </CardTitle>
          <div title="Members" className="flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground shadow-sm shrink-0">
            <Users className="h-3.5 w-3.5" />
            <span>{organization.memberCount}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 min-h-[200px] relative bg-slate-50/30 dark:bg-zinc-900/30">
        <div className="absolute inset-0 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted">
          {organization.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-3">
              <Package className="h-10 w-10 text-muted-foreground/30" />
              <p>No products yet</p>
              <Button variant="outline" size="sm" asChild className="h-8">
                <Link to={`/org/${organization.id}/products`}>
                  <Plus className="mr-2 h-3 w-3" /> Create Product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
                 <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Products</span>
                 </div>
                 <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Create Product">
                   <Link to={`/org/${organization.id}/products`}>
                     <Plus className="h-3.5 w-3.5" />
                   </Link>
                 </Button>
              </div>
              {organization.products.map(product => (
                <ProductItem 
                  key={product.id} 
                  product={product} 
                  orgId={organization.id} 
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductItem({ product, orgId }: { product: DashboardProduct, orgId: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 font-medium group">
        <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <Link 
          to={`/org/${orgId}/products/${product.id}`} 
          className="text-sm text-foreground hover:text-primary transition-colors font-semibold grow"
        >
          {product.name}
        </Link>
      </div>

      <div className="ml-[7px] pl-3 border-l border-border/60 text-sm space-y-1 pt-1 pb-2">
        {product.teams.length > 0 ? (
          <>
            <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1 mt-1 pl-1">Teams</div>
            {product.teams.map(team => (
            <TeamItem 
                key={team.id} 
                team={team} 
                orgId={orgId} 
                productId={product.id} 
            />
            ))}
          </>
        ) : (
            <div className="text-xs text-muted-foreground/70 italic pl-2 py-1 flex items-center gap-1.5">
               <span className="w-1 h-1 rounded-full bg-muted-foreground/30" /> No teams created
            </div>
        )}
      </div>
    </div>
  );
}



function TeamItem({ team, orgId, productId }: { team: DashboardTeam, orgId: number, productId: number }) {
  const sprint = team.activeSprint;
  return (
    <div className="flex items-center justify-between group/team py-1 pl-2 rounded-md hover:bg-muted/50 transition-colors">
      <Link 
        to={`/org/${orgId}/products/${productId}/teams/${team.id}`}
        className="text-muted-foreground group-hover/team:text-foreground transition-colors truncate flex-1 block"
      >
        {team.name}
      </Link>

      {sprint && (
        <div className="flex items-center gap-2 ml-2 pr-2" title={`Sprint: ${sprint.name}`}>
          <div className="flex flex-col items-end leading-none">
            <span className={`text-[10px] font-medium ${sprint.daysLeft <= 3 ? "text-red-500" : "text-muted-foreground"}`}>
               {sprint.daysLeft}d left
            </span>
          </div>
          {/* Progress Bar Mini */}
          <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${sprint.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
