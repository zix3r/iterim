import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { Link } from 'react-router';
import type { DashboardWorkItem } from '@/lib/api';
import { WorkItemBadge } from '@/components/shared/WorkItemBadge';
import { useLanguage } from '@/context/LanguageContext';

export function MyWorkWidget({ workItems }: { workItems: DashboardWorkItem[] }) {
  const { t } = useLanguage();
  return (
    <Card className="h-full border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
      <CardHeader className="pb-3 px-0 lg:px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          {t('dashboard.assignedToMe')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 lg:px-6 max-h-[400px] overflow-y-auto pr-2">
        {workItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/30">
            <CheckSquare className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p>{t('dashboard.noAssignedItems')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workItems.map(item => (
              <Link 
                key={item.id} 
                to={`/org/${item.organizationId}/products/${item.productId}/teams/${item.teamId}`}
                className="flex items-start gap-3 group p-3 rounded-lg bg-card border hover:border-primary/50 hover:shadow-sm transition-all block text-foreground"
              >
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <WorkItemBadge type={item.typeName} />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        #{item.id}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto border
                        ${item.statusName === 'Done' ? 'bg-green-100 text-green-700 border-green-200' : 
                          item.statusName === 'InProgress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          item.statusName === 'Review' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          item.statusName === 'Todo' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                        {item.statusName}
                      </span>
                   </div>
                   <div className="font-medium text-sm truncate block mb-1" title={item.title}>
                     {item.title}
                   </div>
                   
                   <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                      <span className="truncate max-w-[150px]" title={`${item.organizationName} / ${item.productName}`}>
                        {item.productName}
                      </span>
                      {item.points !== null && (
                        <span className="font-semibold text-foreground/80 bg-secondary/50 px-1.5 py-0.5 rounded text-[10px]">
                           {item.points} pts
                        </span>
                      )}
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
