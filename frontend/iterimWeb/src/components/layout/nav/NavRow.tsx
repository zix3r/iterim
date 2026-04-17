import { NavLink } from 'react-router';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  to: string;
  label: string;
  icon?: LucideIcon;
  depth: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  matchEnd?: boolean;
}

const DEPTH_PADDING: Record<number, string> = {
  0: 'pl-3',
  1: 'pl-6',
  2: 'pl-9',
  3: 'pl-12',
  4: 'pl-[3.75rem]',
  5: 'pl-[4.5rem]',
};

function depthClass(depth: number): string {
  return DEPTH_PADDING[depth] ?? `pl-[${depth * 12}px]`;
}

export function NavRow({ to, label, icon: Icon, depth, expandable, expanded, onToggle, matchEnd }: Props) {
  return (
    <div className="relative flex items-center">
      <NavLink
        to={to}
        end={matchEnd}
        className={({ isActive }) =>
          cn(
            'flex flex-1 items-center gap-2 rounded-lg py-1.5 pr-1 text-sm font-medium transition-all duration-200 min-w-0',
            depthClass(depth),
            isActive
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
          )
        }
      >
        {({ isActive }: { isActive: boolean }) => (
          <>
            {Icon && (
              <Icon
                className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-zinc-500')}
              />
            )}
            <span className="truncate">{label}</span>
            {!expandable && <span className="w-7 shrink-0" />}
          </>
        )}
      </NavLink>
      {expandable && (
        <button
          type="button"
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle?.();
          }}
          className="absolute right-1 h-7 w-7 shrink-0 rounded flex items-center justify-center hover:bg-zinc-200 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          )}
        </button>
      )}
    </div>
  );
}
