import { FolderOpen } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/30 ${className}`}>
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-5 text-foreground border border-border shadow-sm">
        {icon || <FolderOpen className="h-7 w-7" />}
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  );
}