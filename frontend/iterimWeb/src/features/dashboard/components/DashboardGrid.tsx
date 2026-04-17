import { InvitationList } from '@/features/organizations/components/InvitationList';
import { CreateOrganizationModal } from '@/features/organizations/components/CreateOrganizationModal';
import { MyWorkWidget } from './MyWorkWidget';
import { ActivityFeedWidget } from './ActivityFeedWidget';
import { PinnedTeamsCard } from './PinnedTeamsCard';
import { RecentPagesCard } from './RecentPagesCard';
import { MyTeamsByOrgCard } from './MyTeamsByOrgCard';
import { ActiveIterationsCard } from './ActiveIterationsCard';
import type { DashboardWorkItem, DashboardActivity } from '@/lib/api';

interface Props {
  firstName: string;
  myWork: DashboardWorkItem[];
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

export function DashboardGrid({ firstName, myWork, recentActivity, onInvitationProcessed }: Props) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const dateLabel = now.toLocaleDateString('en-US', {
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
        <SectionHeader label="Work" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <MyWorkWidget workItems={myWork} />
          </div>
          <div className="md:col-span-4">
            <ActiveIterationsCard />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader label="Workspace" />
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
        <SectionHeader label="Quick Access" />
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
