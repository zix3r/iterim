import { InvitationList } from '@/features/organizations/components/InvitationList';
import { CreateOrganizationModal } from '@/features/organizations/components/CreateOrganizationModal';
import { MyWorkWidget } from './MyWorkWidget';
import { BlockedWorkWidget } from './BlockedWorkWidget';
import { ActivityFeedWidget } from './ActivityFeedWidget';
import { PinnedTeamsCard } from './PinnedTeamsCard';
import { RecentPagesCard } from './RecentPagesCard';
import { MyTeamsByOrgCard } from './MyTeamsByOrgCard';
import { ActiveIterationsCard } from './ActiveIterationsCard';
import type { DashboardWorkItem, DashboardActivity, DashboardBlockedWorkItem } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  firstName: string;
  myWork: DashboardWorkItem[];
  blockedWork: DashboardBlockedWorkItem[];
  recentActivity: DashboardActivity[];
  onInvitationProcessed: () => void;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
      {label}
    </h2>
  );
}

export function DashboardGrid({ firstName, myWork, blockedWork, recentActivity, onInvitationProcessed }: Props) {
  const { t, language } = useLanguage();
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? t('dashboard.greetingMorning') : hour < 18 ? t('dashboard.greetingAfternoon') : t('dashboard.greetingEvening');

  const dateLocale = language === 'lt' ? 'lt-LT' : 'en-US';
  const dateLabel = now.toLocaleDateString(dateLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-[1400px] mx-auto">
      <div>
        <InvitationList onInvitationProcessed={onInvitationProcessed} />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">{dateLabel}</p>
          </div>
          <CreateOrganizationModal onCreated={onInvitationProcessed} />
        </div>
      </div>

      <section>
        <SectionHeader label={t('dashboard.sectionWork')} />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <MyWorkWidget workItems={myWork} />
          </div>
          <div className="md:col-span-4">
            <ActiveIterationsCard />
          </div>
        </div>
      </section>

      {blockedWork.length > 0 && (
        <section>
          <SectionHeader label={t('dashboard.blockedWork')} />
          <BlockedWorkWidget blockedItems={blockedWork} />
        </section>
      )}

      <section>
        <SectionHeader label={t('dashboard.sectionWorkspace')} />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <MyTeamsByOrgCard />
          </div>
          <div className="md:col-span-4">
            <PinnedTeamsCard />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader label={t('dashboard.sectionQuickAccess')} />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6">
            <RecentPagesCard />
          </div>
          <div className="md:col-span-6">
            <ActivityFeedWidget activities={recentActivity} />
          </div>
        </div>
      </section>
    </div>
  );
}
