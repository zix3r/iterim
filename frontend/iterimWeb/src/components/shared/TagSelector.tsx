import { useEffect, useState, useRef } from 'react';
import { Check, ChevronDown, Plus, Tag as TagIcon } from 'lucide-react';
import { getOrgTags, createOrgTag, type Tag } from '@/lib/api';
import { TagBadge } from './TagBadge';
import { useLanguage } from '@/context/LanguageContext';

interface TagSelectorProps {
  orgId: number;
  selected: Tag[];
  onChange: (tags: Tag[]) => void;
  disabled?: boolean;
}

export function TagSelector({ orgId, selected, onChange, disabled }: TagSelectorProps) {
  const { t } = useLanguage();
  const [orgTags, setOrgTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrgTags(orgId).then(setOrgTags).catch(() => {});
  }, [orgId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (tag: Tag) => {
    const isSelected = selected.some(s => s.id === tag.id);
    if (isSelected) {
      onChange(selected.filter(s => s.id !== tag.id));
    } else {
      onChange([...selected, tag]);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const created = await createOrgTag(orgId, { name, color: newColor });
      setOrgTags(prev => [...prev, created]);
      onChange([...selected, created]);
      setNewName('');
      setNewColor('#6366f1');
      setShowCreate(false);
    } catch {
      // silently ignore — parent can surface errors
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full min-h-[36px] flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-left focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        {selected.length > 0 ? (
          selected.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={disabled ? undefined : () => onChange(selected.filter(s => s.id !== tag.id))}
            />
          ))
        ) : (
          <span className="text-muted-foreground flex items-center gap-1">
            <TagIcon className="h-3.5 w-3.5" /> {t('backlog.tags')}
          </span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md text-popover-foreground">
          <div className="max-h-52 overflow-y-auto p-1">
            {orgTags.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1.5">{t('backlog.tags')}</p>
            )}
            {orgTags.map(tag => {
              const isSelected = selected.some(s => s.id === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left">{tag.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t p-1">
            {!showCreate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> {t('common.add')}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-1 py-1">
                <input
                  autoFocus
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="h-6 w-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
                  placeholder="Tag name…"
                  className="flex-1 text-sm border rounded px-2 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating || !newName.trim()}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {t('common.add')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
