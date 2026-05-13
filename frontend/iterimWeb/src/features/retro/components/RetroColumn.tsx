import { type ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { RetroCard } from './RetroCard';
import { AddRetroCardForm } from './AddRetroCardForm';
import type { RetroColumnName, RetroItem } from '@/lib/api';

interface RetroColumnProps {
  column: RetroColumnName;
  title: string;
  /** Decorative icon for the column header. */
  icon: ReactNode;
  /** Optional accent — e.g. "border-emerald-200" — to differentiate columns visually. */
  accentClassName?: string;
  items: RetroItem[];
  readOnly: boolean;
  onCreate: (column: RetroColumnName, content: string) => Promise<void>;
  onVote: (item: RetroItem) => void;
  onEdit: (item: RetroItem, content: string) => Promise<void>;
  onDelete: (item: RetroItem) => Promise<void>;
}

/**
 * One Kanban-style column. The parent does sorting (by votes desc) and
 * filtering by column, so this component just renders what it gets.
 */
export function RetroColumn({
  column,
  title,
  icon,
  accentClassName,
  items,
  readOnly,
  onCreate,
  onVote,
  onEdit,
  onDelete,
}: RetroColumnProps) {
  const { t } = useLanguage();

  return (
    <div
      className={`flex flex-col rounded-xl border bg-muted/20 ${accentClassName ?? ''}`}
      data-column={column}
    >
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="truncate text-sm font-semibold">{title}</h2>
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </header>

      <div className="flex flex-col gap-2 p-3">
        {!readOnly && (
          <AddRetroCardForm onSubmit={(content) => onCreate(column, content)} />
        )}

        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground/70">
            {t('retro.empty')}
          </p>
        ) : (
          items.map((item) => (
            <RetroCard
              key={item.id}
              item={item}
              readOnly={readOnly}
              onVote={onVote}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
