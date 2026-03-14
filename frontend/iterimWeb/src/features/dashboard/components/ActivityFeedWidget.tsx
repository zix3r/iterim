import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react'; 
import type { DashboardActivity } from '@/lib/api';

export function ActivityFeedWidget({ activities }: { activities: DashboardActivity[] }) {
  return (
    <Card className="h-full border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
      <CardHeader className="pb-3 px-0 lg:px-6 border-b-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto pr-2 px-0 lg:px-6 pt-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/30">
            <Clock className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p>No recent activity.</p>
          </div>
        ) : (
          <div className="space-y-6 relative list-none m-0 p-0 pl-3">
             {/* Feed Line */}
             <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-border/50 z-0 rounded-full" />

             {activities.map(item => (
              <div key={item.id} className="relative pl-6 z-10 group pb-1">
                {/* Dot */}
                <div className="absolute left-1 top-2 w-2.5 h-2.5 rounded-full bg-background border-[2px] border-primary/50 group-hover:border-primary group-hover:scale-110 transition-all shadow-sm" />
                
                <div className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-muted/40 transition-colors -mt-2 -ml-2">
                   <p className="text-sm text-foreground/80 leading-snug">
                     <span className="font-semibold text-foreground block mb-0.5">{item.actorName}</span> 
                     {item.description.replace(`New ${item.type} created: `, 'created new item ')}
                   </p>
                   <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Clock className="h-3 w-3 opacity-70" />
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
