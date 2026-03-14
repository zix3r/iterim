import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, ArrowUpCircle, Clock, CheckSquare } from 'lucide-react';
import { Link } from 'react-router';
import type { DashboardWorkItem } from '@/lib/api';

export function MyWorkWidget({ workItems }: { workItems: DashboardWorkItem[] }) {
  return (
    <Card className="h-full border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
      <CardHeader className="pb-3 px-0 lg:px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          My Work
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 lg:px-6 max-h-[400px] overflow-y-auto pr-2">
        {workItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/30">
            <CheckCircle2 className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p>No active work items assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workItems.map(item => (
              <div key={item.id} className="flex items-start gap-3 group p-3 rounded-lg bg-card border hover:border-primary/50 hover:shadow-sm transition-all">
                <StatusIcon status={item.statusName} />
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-2">
                      <Link 
                        to={`/org/${item.organizationId}/products/${item.productId}/teams/${item.teamId}`}
                        className="font-medium text-sm hover:underline hover:text-primary transition-colors truncate block"
                        title={item.title}
                      >
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                        #{item.id}
                      </span>
                   </div>
                   <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-1.5">
                      <span className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded max-w-[120px] truncate" title={`${item.organizationName} / ${item.productName}`}>
                        {item.productName}
                      </span>
                      {item.points !== null && (
                        <span className="font-semibold text-foreground/80 bg-secondary/50 px-1.5 py-0.5 rounded text-[10px]">
                           {item.points} pts
                        </span>
                      )}
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

function StatusIcon({ status }: { status: string }) {
   if (status === 'Done') return <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />;
   if (status === 'InProgress' || status === 'Active') return <ArrowUpCircle className="h-4 w-4 text-blue-500 mt-0.5" />;
   return <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />;
}
