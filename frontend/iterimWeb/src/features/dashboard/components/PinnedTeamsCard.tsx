import { useNavigate } from 'react-router';
import { Pin, Users2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePinnedTeams } from '@/lib/favorites';
import { useMyTeamsTree } from '@/hooks/useMyTeamsTree';
import type { DashboardSprint } from '@/lib/api';
import { IterationStatusBar } from './IterationStatusBar';
import { useLanguage } from '@/context/LanguageContext';

interface ResolvedPinnedTeam {
  teamId: number;
  teamName: string;
  orgId: number;
  productId: number;
  orgName: string;
  productName: string;
  activeSprint?: DashboardSprint;
  boardPath: string;
}

export function PinnedTeamsCard() {
  const { pinnedTeams, isLoading } = usePinnedTeams();
  const { organizations } = useMyTeamsTree();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const resolved: ResolvedPinnedTeam[] = pinnedTeams.map((pt) => {
    let orgName = '';
    let productName = '';
    let activeSprint: DashboardSprint | undefined;

    for (const org of organizations) {
      for (const product of org.products) {
        const team = product.teams.find((t) => t.id === pt.teamId);
        if (team) {
          orgName = org.name;
          productName = product.name;
          activeSprint = team.activeSprint;
          break;
        }
      }
      if (orgName) break;
    }

    return {
      teamId: pt.teamId,
      teamName: pt.teamName,
      orgId: pt.orgId,
      productId: pt.productId,
      orgName,
      productName,
      activeSprint,
      boardPath: `/org/${pt.orgId}/products/${pt.productId}/teams/${pt.teamId}`,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
          <Pin className="h-4 w-4 text-zinc-500" />
          {t('sidebar.pinned')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-200 animate-pulse h-10 rounded-md" />
            ))}
          </div>
        ) : resolved.length === 0 ? (
          <p className="text-sm text-zinc-500">No pinned teams yet. Pin a team from the sidebar.</p>
        ) : (
          <div className="space-y-3">
            {resolved.map((team) => (
              <div
                key={team.teamId}
                onClick={() => navigate(team.boardPath)}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users2 className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span className="text-sm font-medium text-zinc-900 truncate">{team.teamName}</span>
                </div>
                {(team.productName || team.orgName) && (
                  <p className="text-xs text-zinc-500 mb-2 pl-6 truncate">
                    {team.productName} · {team.orgName}
                  </p>
                )}
                {team.activeSprint && (
                  <div className="pl-6 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600 truncate">{team.activeSprint.name}</span>
                      <span className="text-xs text-zinc-500 shrink-0 ml-2">
                        {team.activeSprint.daysLeft}d left
                      </span>
                    </div>
                    <IterationStatusBar
                      byStatus={team.activeSprint.byStatus}
                      progress={team.activeSprint.progress}
                      iterationId={team.activeSprint.id}
                    />
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
