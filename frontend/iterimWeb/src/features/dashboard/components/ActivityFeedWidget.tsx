import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';
import type { DashboardActivity } from '@/lib/api';
import { WorkItemBadge } from '@/components/shared/WorkItemBadge';
import { Link } from 'react-router';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const ACTIVITY_DESCRIPTION_KEYS: Record<string, TranslationKey> = {
  'created a new item': 'dashboard.activity.createdItem',
  'created new item': 'dashboard.activity.createdItem',
  'updated an item': 'dashboard.activity.updatedItem',
  'commented': 'dashboard.activity.commented',
};

export function ActivityFeedWidget({ activities }: { activities: DashboardActivity[] }) {
  const { t, language } = useLanguage();
  const activityLocale = language === 'lt' ? 'lt-LT' : 'en-US';
  return (
    <Card className="h-full border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
      <CardHeader className="pb-3 px-0 lg:px-6 border-b-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t('dashboard.recentActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto pr-2 px-0 lg:px-6 pt-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/30">
            <Clock className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p>{t('dashboard.noRecentActivity')}</p>
          </div>
        ) : (
          <div className="space-y-6 relative list-none m-0 p-0 pl-3">
             {/* Feed Line */}
             <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-border/50 z-0 rounded-full" />

             {activities.map(item => {
              const descriptionKey = item.description
                ? ACTIVITY_DESCRIPTION_KEYS[item.description.trim()]
                : 'dashboard.activity.createdItem';
              const descriptionText = descriptionKey ? t(descriptionKey) : item.description;
              return (
              <div key={item.id} className="relative pl-6 z-10 group pb-1">
                {/* Dot */}
                <div className="absolute left-1 top-2 w-2.5 h-2.5 rounded-full bg-background border-[2px] border-primary/50 group-hover:border-primary group-hover:scale-110 transition-all shadow-sm" />
                
                <Link 
                  to={item.organizationId ? `/org/${item.organizationId}/products/${item.productId}/teams/${item.teamId}/backlog?item=${item.workItemId}` : '#'}
                  className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-muted/40 transition-colors -mt-2 -ml-2 block text-foreground"
                >
                   <div className="text-sm text-foreground/80 leading-snug">
                     <span className="font-semibold text-foreground">{item.actorName}</span>
                     <span className="text-muted-foreground mx-1">
                        {descriptionText}
                     </span>
                     
                     {/* If we have work item details, show badge and title */}
                     {item.workItemType && (
                        <div className="flex items-center gap-2 mt-2 bg-background p-2 rounded border shadow-sm">
                           <WorkItemBadge type={item.workItemType} />
                           {/* Add Link if possible, need Organization/Product context in activity DTO to make link */}
                           <span className="font-medium text-xs truncate">{item.workItemTitle}</span>
                        </div>
                     )}
                   </div>
                   <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium mt-1">
                      <Clock className="h-3 w-3 opacity-70" />
                      {new Date(item.timestamp).toLocaleString(activityLocale, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                   </div>
                </Link>
              </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
