import { FolderOpen } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mb-5 text-blue-600 border border-blue-100 shadow-sm">
        {icon || <FolderOpen className="h-7 w-7" />}
      </div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  );
}