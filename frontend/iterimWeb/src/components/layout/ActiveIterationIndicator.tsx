import { Skeleton } from '@/components/ui/skeleton';
import { useActiveIteration } from '@/lib/useActiveIteration';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  teamId: number;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' });
}

export function ActiveIterationIndicator({ teamId }: Props) {
  const { info, isLoading } = useActiveIteration(teamId);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2.5">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
        <p className="text-[10px] text-zinc-400">{t('dashboard.noActiveIterations')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
      <div>
        <p className="text-xs font-semibold text-zinc-700 truncate">
          {info.name ?? 'Active Iteration'}
        </p>
        <p className="text-[10px] text-zinc-400 mt-0.5">
          {fmtDate(info.startDate)} – {fmtDate(info.endDate)}
        </p>
      </div>

      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${info.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">
          {info.donePoints} / {info.totalPoints} pts
        </span>
        <span className="text-[10px] font-semibold text-emerald-600">{info.progress}%</span>
      </div>
    </div>
  );
}
