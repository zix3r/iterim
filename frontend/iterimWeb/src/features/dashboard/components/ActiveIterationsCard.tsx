import { useNavigate } from 'react-router';
import { Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyTeamsTree } from '@/hooks/useMyTeamsTree';
import type { DashboardSprint } from '@/lib/api';
import { IterationStatusBar } from './IterationStatusBar';
import { useLanguage } from '@/context/LanguageContext';

interface ActiveTeamRow {
  teamId: number;
  teamName: string;
  orgId: number;
  orgName: string;
  productId: number;
  productName: string;
  sprint: DashboardSprint;
}

export function ActiveIterationsCard() {
  const { organizations, isLoading } = useMyTeamsTree();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const rows: ActiveTeamRow[] = [];
  for (const org of organizations) {
    for (const product of org.products) {
      for (const team of product.teams) {
        if (team.activeSprint) {
          rows.push({
            teamId: team.id,
            teamName: team.name,
            orgId: org.id,
            orgName: org.name,
            productId: product.id,
            productName: product.name,
            sprint: team.activeSprint,
          });
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
          <Zap className="h-4 w-4 text-zinc-500" />
          {t('dashboard.activeIterations')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-200 animate-pulse h-14 rounded-md" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('dashboard.noActiveIterations')}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.teamId}
                onClick={() =>
                  navigate(
                    `/org/${row.orgId}/products/${row.productId}/teams/${row.teamId}/iterations`
                  )
                }
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{row.teamName}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {row.orgName} · {row.productName}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">{row.sprint.daysLeft}d left</span>
                </div>
                <p className="text-xs text-zinc-600 mb-1.5 truncate">{row.sprint.name}</p>
                <IterationStatusBar
                  byStatus={row.sprint.byStatus}
                  progress={row.sprint.progress}
                  iterationId={row.sprint.id}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
