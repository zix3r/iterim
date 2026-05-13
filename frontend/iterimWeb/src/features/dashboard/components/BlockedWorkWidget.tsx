import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Ban, Check, X } from 'lucide-react';
import { Link } from 'react-router';
import type { DashboardBlockedWorkItem } from '@/lib/api';
import { WorkItemBadge } from '@/components/shared/WorkItemBadge';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  blockedItems: DashboardBlockedWorkItem[];
}

export function BlockedWorkWidget({ blockedItems }: Props) {
  const { t } = useLanguage();

  return (
    <Card className="h-full border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
      <CardHeader className="pb-3 px-0 lg:px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Ban className="h-5 w-5 text-amber-600" />
          {t('dashboard.blockedWork')}
          {blockedItems.length > 0 && (
            <span className="ml-1 text-[11px] font-medium text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
              {blockedItems.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 lg:px-6 max-h-[500px] overflow-y-auto pr-2">
        {blockedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/30">
            <Ban className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p>{t('dashboard.noBlockedWork')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedItems.map((item) => (
              <Link
                key={item.id}
                to={`/org/${item.organizationId}/products/${item.productId}/teams/${item.teamId}/backlog?item=${item.id}`}
                className="block p-3 rounded-lg bg-card border border-amber-200/70 hover:border-amber-400 hover:shadow-sm transition-all text-foreground"
              >
                <div className="flex items-center gap-2 mb-1">
                  <WorkItemBadge type={item.typeName} />
                  <span className="text-[10px] text-muted-foreground font-mono">#{item.id}</span>
                  <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-200">
                    {item.unfinishedBlockerCount} {t('dashboard.unfinishedBlockers')}
                  </span>
                </div>
                <div className="font-medium text-sm truncate mb-1" title={item.title}>
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                  <span className="truncate max-w-[180px]" title={`${item.organizationName} / ${item.productName} / ${item.teamName}`}>
                    {item.teamName}
                  </span>
                  {item.points !== null && (
                    <span className="font-semibold text-foreground/80 bg-secondary/50 px-1.5 py-0.5 rounded text-[10px]">
                      {item.points} pts
                    </span>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-dashed border-amber-200/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {t('dashboard.blockedBy')}
                  </div>
                  <ul className="space-y-1">
                    {item.blockers.map((b) => (
                      <li
                        key={b.workItemId}
                        className="flex items-center gap-1.5 text-xs"
                        title={b.isDone ? t('dashboard.blockerDone') : t('dashboard.blockerNotDone')}
                      >
                        {b.isDone ? (
                          <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" aria-hidden />
                        ) : (
                          <X className="h-3.5 w-3.5 text-red-500 flex-shrink-0" aria-hidden />
                        )}
                        <span
                          className={`truncate ${b.isDone ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}
                        >
                          {b.title}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[100px]" title={b.teamName}>
                          {b.teamName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
