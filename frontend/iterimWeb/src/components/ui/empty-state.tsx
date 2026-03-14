import { FolderOpen } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 ${className}`}>
      <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center mb-5 text-zinc-900 border border-zinc-200 shadow-sm">
        {icon || <FolderOpen className="h-7 w-7" />}
      </div>
      <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-500 mt-2 mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  );
}