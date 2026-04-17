import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  storageKey: string;
  children: React.ReactNode;
}

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export function CollapsibleSection({ title, storageKey, children }: Props) {
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) return stored === 'true';
    return !isMobile();
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(open));
  }, [open, storageKey]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors',
        )}
      >
        {title}
        <ChevronRight
          className={cn('h-3 w-3 transition-transform duration-200', open && 'rotate-90')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
