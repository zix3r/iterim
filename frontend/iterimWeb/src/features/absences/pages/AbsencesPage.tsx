import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AlertCircle, CalendarOff } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getOrganizationAbsences, getOrganizationById } from '@/lib/api';
import type { MemberAbsence, OrganizationDetail } from '@/lib/api';
import { CreateAbsenceModal } from '@/features/absences/components/CreateAbsenceModal';
import { addRecentPage } from '@/lib/recentPages';
import { AbsenceList } from '@/features/absences/components/AbsenceList';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    fromDate: toDateInputValue(start),
    toDate: toDateInputValue(end),
  };
};

export function AbsencesPage() {
  const { orgId } = useParams();
  const defaultRange = getCurrentMonthRange();

  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [absences, setAbsences] = useState<MemberAbsence[]>([]);
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const [appliedFromDate, setAppliedFromDate] = useState(defaultRange.fromDate);
  const [appliedToDate, setAppliedToDate] = useState(defaultRange.toDate);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (refreshOnly = false, range?: { fromDate: string; toDate: string }) => {
    if (!orgId) return;

    const queryFromDate = range?.fromDate ?? appliedFromDate;
    const queryToDate = range?.toDate ?? appliedToDate;

    if (refreshOnly) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const [orgData, absencesData] = await Promise.all([
        getOrganizationById(Number(orgId)),
        getOrganizationAbsences(Number(orgId), queryFromDate, queryToDate),
      ]);
      setOrganization(orgData);
      setAbsences(absencesData);
    } catch (err) {
      console.error('Failed to load absences:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load absences.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [appliedFromDate, appliedToDate, orgId]);

  const handleApplyFilter = () => {
    if (toDate < fromDate) return;

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    loadData(true, { fromDate, toDate });
  };

  const handleResetRange = () => {
    const currentRange = getCurrentMonthRange();
    setFromDate(currentRange.fromDate);
    setToDate(currentRange.toDate);
    setAppliedFromDate(currentRange.fromDate);
    setAppliedToDate(currentRange.toDate);
    loadData(true, currentRange);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (organization && orgId) {
      addRecentPage({
        path: `/org/${orgId}/absences`,
        label: `${organization.name} — Absences`,
        iconType: 'Org',
      });
    }
  }, [organization, orgId]);

  // 1. SKELETON BŪSENA (Pirminis krovimasis)
  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-4 w-64 mb-6" /> {/* Breadcrumbs */}
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" /> {/* Title */}
            <Skeleton className="h-4 w-96" /> {/* Subtitle */}
          </div>
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Create Button */}
        </div>

        <Card className="mt-8">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
             <Skeleton className="h-10 w-full sm:w-[200px]" />
             <Skeleton className="h-10 w-full sm:w-[200px]" />
             <Skeleton className="h-10 w-[120px]" />
             <Skeleton className="h-10 w-[120px]" />
          </CardContent>
        </Card>

        <div className="space-y-4 mt-8">
           <Skeleton className="h-12 w-full rounded-t-md" /> {/* Table header */}
           {[1, 2, 3, 4].map(i => (
             <Skeleton key={i} className="h-16 w-full" /> 
           ))}
        </div>
      </div>
    );
  }

  // 2. KLAIDOS BŪSENA
  if (error || !organization) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12">
        <div className="rounded-xl bg-red-50 p-6 border border-red-200 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Absences</h3>
          <p className="text-sm text-red-700">{error || "Organization not found."}</p>
          <Button onClick={() => loadData()} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const canManageAllAbsences = organization.userRole === 'Admin';
  const creatableMembers = canManageAllAbsences
    ? organization.members
    : organization.members.filter((member) => member.userId === organization.currentUserId);

  // 3. SĖKMINGA BŪSENA
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
          <h1 className="text-3xl font-bold">Absence Management</h1>
          <p className="text-muted-foreground">Track vacations, sick leaves, and other member absences.</p>
        </div>
        <CreateAbsenceModal
          orgId={organization.id}
          members={creatableMembers}
          canManageAllAbsences={canManageAllAbsences}
          currentUserId={organization.currentUserId}
          onCreated={() => loadData(true)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium block mb-2" htmlFor="absences-filter-from-date">
                From date
              </label>
              <Input
                id="absences-filter-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium block mb-2" htmlFor="absences-filter-to-date">
                To date
              </label>
              <Input
                id="absences-filter-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleApplyFilter}
              disabled={isRefreshing || toDate < fromDate}
            >
              {isRefreshing ? 'Filtering...' : 'Apply Filter'}
            </Button>
            <Button
              variant="outline"
              disabled={isRefreshing}
              onClick={handleResetRange}
            >
              Reset Range
            </Button>
          </div>
          {toDate < fromDate && (
            <p className="text-sm text-destructive mt-2">To date must be after or equal to from date.</p>
          )}
        </CardContent>
      </Card>

      {/* TUŠČIA BŪSENA ARBA LENTELĖ */}
      {absences.length === 0 ? (
        <EmptyState 
          title="No registered absences"
          description="There are no absences found for the selected date range."
          icon={<CalendarOff className="h-8 w-8" />}
          action={
            <CreateAbsenceModal
              orgId={organization.id}
              members={creatableMembers}
              canManageAllAbsences={canManageAllAbsences}
              currentUserId={organization.currentUserId}
              onCreated={() => loadData(true)}
            />
          }
        />
      ) : (
        <AbsenceList
          absences={absences}
          members={organization.members}
          currentUserId={organization.currentUserId}
          canManageAllAbsences={canManageAllAbsences}
          onChanged={() => loadData(true)}
        />
      )}
    </div>
  );
}