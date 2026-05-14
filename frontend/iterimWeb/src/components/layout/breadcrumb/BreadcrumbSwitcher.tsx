import { useParams, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useMyTeamsTree } from '@/hooks/useMyTeamsTree';
import { BreadcrumbSegment } from './BreadcrumbSegment';
import { BreadcrumbMobile } from './BreadcrumbMobile';
import { getCurrentPageLabel } from './currentPageLabel';

export function BreadcrumbSwitcher() {
  const { orgId, productId, teamId } = useParams<{
    orgId?: string;
    productId?: string;
    teamId?: string;
  }>();
  const { pathname } = useLocation();
  const { organizations, isLoading } = useMyTeamsTree();

  if (!orgId) return null;

  const currentOrg = organizations.find((o) => String(o.id) === orgId);
  const currentProduct = productId
    ? currentOrg?.products.find((p) => String(p.id) === productId)
    : undefined;
  const currentTeam = teamId
    ? currentProduct?.teams.find((t) => String(t.id) === teamId)
    : undefined;

  const orgLabel = currentOrg?.name ?? orgId;
  const productLabel = currentProduct?.name ?? (productId ?? '');
  const teamLabel = currentTeam?.name ?? (teamId ?? '');

  const orgItems = organizations.map((o) => ({
    id: String(o.id),
    label: o.name,
    href: `/org/${o.id}`,
  }));

  const productItems = (currentOrg?.products ?? []).map((p) => ({
    id: String(p.id),
    label: p.name,
    href: `/org/${orgId}/products/${p.id}`,
  }));

  const currentPageSuffix = (() => {
    if (!teamId) return '';
    const suffixes = ['/backlog', '/board', '/iterations', '/metrics'];
    for (const s of suffixes) {
      if (pathname.endsWith(s)) return s;
    }
    return '';
  })();

  const teamItems = (currentProduct?.teams ?? []).map((t) => ({
    id: String(t.id),
    label: t.name,
    href: `/org/${orgId}/products/${productId}/teams/${t.id}${currentPageSuffix}`,
  }));

  const pageLabel = getCurrentPageLabel(pathname);

  const mobileSummaryParts = [orgLabel];
  if (productId) mobileSummaryParts.push(productLabel);
  if (teamId) mobileSummaryParts.push(teamLabel);
  const mobileSummary = mobileSummaryParts.join(' › ');

  const mobileSections = [];
  mobileSections.push({ title: 'Organization', items: orgItems, currentId: orgId });
  if (productId) {
    mobileSections.push({ title: 'Product', items: productItems, currentId: productId });
  }
  if (teamId && productId) {
    mobileSections.push({ title: 'Team', items: teamItems, currentId: teamId });
  }

  const sep = <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />;

  return (
    <div className="flex h-8 items-center px-4 md:px-6 gap-1 text-xs bg-white border-b border-zinc-200">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-1">
        <BreadcrumbSegment
          label={orgLabel}
          items={orgItems}
          currentId={orgId}
          loading={isLoading}
        />
        {productId && (
          <>
            {sep}
            <BreadcrumbSegment
              label={productLabel}
              items={productItems}
              currentId={productId}
              loading={isLoading}
            />
          </>
        )}
        {teamId && productId && (
          <>
            {sep}
            <BreadcrumbSegment
              label={teamLabel}
              items={teamItems}
              currentId={teamId}
              loading={isLoading}
            />
          </>
        )}
        {sep}
        <span className="px-2 text-sm font-medium text-zinc-900">{pageLabel}</span>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden items-center gap-1">
        <BreadcrumbMobile
          summary={mobileSummary}
          sections={mobileSections}
          loading={isLoading}
        />
        {sep}
        <span className="text-sm font-medium text-zinc-900 truncate">{pageLabel}</span>
      </div>
    </div>
  );
}
