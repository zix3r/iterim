import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Story: { label: 'STORY', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' },
  Task:  { label: 'TASK',  color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' },
  Bug:   { label: 'BUG',   color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800' },
};

export const WorkItemBadge = ({ type, className }: { type: string, className?: string }) => {
  // Normalize type string to handle case sensitivity if needed, but usually exact match
  const config = TYPE_CONFIG[type] || TYPE_CONFIG[Object.keys(TYPE_CONFIG).find(k => k.toLowerCase() === type.toLowerCase()) || ''] || { label: type, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  
  return (
    <span className={cn(`text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none uppercase tracking-wide inline-flex items-center justify-center min-w-[3rem] h-5 ${config.color}`, className)}>
      {config.label}
    </span>
  );
};