import { useMyTeamsTree } from '@/hooks/useMyTeamsTree';
import { NavTreeOrg } from './NavTreeOrg';
import { useLanguage } from '@/context/LanguageContext';

export function NavTree() {
  const { organizations, isLoading, error } = useMyTeamsTree();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        <div className="bg-zinc-200 animate-pulse rounded-md h-8" />
        <div className="bg-zinc-200 animate-pulse rounded-md h-8" />
        <div className="bg-zinc-200 animate-pulse rounded-md h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="px-3 py-2 text-xs text-zinc-500">{error}</p>
    );
  }

  if (organizations.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-zinc-500">{t('dashboard.noOrganizations')}</p>
    );
  }

  return (
    <div className="space-y-0.5">
      {organizations.map((org) => (
        <NavTreeOrg key={org.id} org={org} />
      ))}
    </div>
  );
}
