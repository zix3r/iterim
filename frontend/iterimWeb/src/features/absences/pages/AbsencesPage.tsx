import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AlertCircleIcon } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/spinner';
import { getOrganizationAbsences, getOrganizationById } from '@/lib/api';
import type { MemberAbsence, OrganizationDetail } from '@/lib/api';
import { CreateAbsenceModal } from '@/features/absences/components/CreateAbsenceModal';
import { AbsenceList } from '@/features/absences/components/AbsenceList';

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
      setError('Failed to load absences. Please try again.');
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

  if (isLoading) return <LoadingPage />;

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Absences</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadData()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!organization) return <div className="p-8">Organization not found</div>;

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

      <AbsenceList
        absences={absences}
        members={organization.members}
        currentUserId={organization.currentUserId}
        canManageAllAbsences={canManageAllAbsences}
        onChanged={() => loadData(true)}
      />
    </div>
  );
}
