import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AlertCircle, CalendarOff } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { getOrganizationAbsences, getOrganizationById } from '@/lib/api';
import type { MemberAbsence, OrganizationDetail, AbsenceFilters } from '@/lib/api';
import { CreateAbsenceModal } from '@/features/absences/components/CreateAbsenceModal';
import { AbsenceFilterBar } from '@/features/absences/components/AbsenceFilterBar';
import { addRecentPage } from '@/lib/recentPages';
import { AbsenceList } from '@/features/absences/components/AbsenceList';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getCurrentMonthRange = (): AbsenceFilters => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: toDateInputValue(start),
    to: toDateInputValue(end),
  };
};

export function AbsencesPage() {
  const { t } = useLanguage();
  const { orgId } = useParams();

  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [absences, setAbsences] = useState<MemberAbsence[]>([]);
  
  // Viena būsena visiems filtrams
  const [filters, setFilters] = useState<AbsenceFilters>(getCurrentMonthRange());

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (currentFilters: AbsenceFilters, refreshOnly = false) => {
    if (!orgId) return;

    if (refreshOnly) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);

    try {
      const [orgData, absencesData] = await Promise.all([
        getOrganizationById(Number(orgId)),
        getOrganizationAbsences(Number(orgId), currentFilters),
      ]);
      setOrganization(orgData);
      setAbsences(absencesData);
    } catch (err) {
      console.error('Failed to load absences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load absences.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orgId]);

  const handleResetRange = () => {
    const defaultFilters = getCurrentMonthRange();
    setFilters(defaultFilters);
    loadData(defaultFilters, true);
  };

  // Debounced krovimas po filtrų pakeitimo
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(filters, true);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters, loadData]);

  useEffect(() => {
    if (organization && orgId) {
      addRecentPage({
        path: `/org/${orgId}/absences`,
        label: `${organization.name} — Absences`,
        iconType: 'Org',
      });
    }
  }, [organization, orgId]);

  if (isLoading && !isRefreshing) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg mt-6" />
        <div className="space-y-4 mt-8">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-red-800">{t('absences.failedLoad')}</h3>
        <p className="text-sm text-red-700">{error || t('common.notFound')}</p>
        <Button onClick={() => loadData(filters)} variant="outline" className="mt-4">
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  const canManageAllAbsences = organization.userRole === 'Admin';
  const creatableMembers = canManageAllAbsences
    ? organization.members
    : organization.members.filter((member) => member.userId === organization.currentUserId);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: organization.name, href: `/org/${orgId}` },
          { label: 'Absences' },
        ]}
      />

      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t('absences.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.upcomingAbsences')}</p>
        </div>
        <CreateAbsenceModal
          orgId={organization.id}
          members={creatableMembers}
          canManageAllAbsences={canManageAllAbsences}
          currentUserId={organization.currentUserId}
          onCreated={() => loadData(filters, true)}
        />
      </div>

      {/* NAUJA FILTRŲ JUOSTA (Senoji kortelė ištrinta!) */}
      <AbsenceFilterBar 
        filters={filters}
        onFilterChange={setFilters}
        onClear={handleResetRange}
      />

      {absences.length === 0 ? (
        <EmptyState
          title={t('absences.noAbsences')}
          description="No results found for the current filters."
          icon={<CalendarOff className="h-8 w-8" />}
          action={
            <CreateAbsenceModal
              orgId={organization.id}
              members={creatableMembers}
              canManageAllAbsences={canManageAllAbsences}
              currentUserId={organization.currentUserId}
              onCreated={() => loadData(filters, true)}
            />
          }
        />
      ) : (
        <AbsenceList
          absences={absences}
          members={organization.members}
          currentUserId={organization.currentUserId}
          canManageAllAbsences={canManageAllAbsences}
          onChanged={() => loadData(filters, true)}
        />
      )}
    </div>
  );
}