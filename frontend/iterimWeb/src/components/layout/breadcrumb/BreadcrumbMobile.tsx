import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface SegmentItem {
  id: string;
  label: string;
  href: string;
}

interface MobileSection {
  title: string;
  items: SegmentItem[];
  currentId: string;
}

interface BreadcrumbMobileProps {
  summary: string;
  sections: MobileSection[];
  loading?: boolean;
}

export function BreadcrumbMobile({ summary, sections, loading }: BreadcrumbMobileProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <div className="bg-zinc-200 animate-pulse w-32 h-4 rounded" />;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 h-8 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 gap-1 max-w-[260px]"
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto rounded-t-xl p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <span className="text-sm font-semibold text-zinc-900">Navigate</span>
        </div>
        <div className="px-6 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                {section.title}
              </p>
              {section.items.length === 0 ? (
                <p className="text-sm text-zinc-400 px-2">No siblings available</p>
              ) : (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setOpen(false);
                        navigate(item.href);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        item.id === section.currentId
                          ? 'bg-zinc-100 font-medium text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
