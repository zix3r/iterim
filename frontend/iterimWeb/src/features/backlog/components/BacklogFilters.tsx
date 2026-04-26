import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { TeamMember, Tag } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  typeFilter: string;
  statusFilter: string;
  assigneeFilter: string;
  tagFilter: string;
  searchQuery: string;
  members: TeamMember[];
  orgTags: Tag[];
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onAssigneeChange: (v: string) => void;
  onTagChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

const selectClass = "px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function BacklogFilters({
  typeFilter, statusFilter, assigneeFilter, tagFilter, searchQuery,
  members, orgTags, onTypeChange, onStatusChange, onAssigneeChange, onTagChange, onSearchChange,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} className={selectClass}>
        <option value="">{t('common.all')} Types</option>
        <option value="Story">{t('backlog.typeStory')}</option>
        <option value="Task">{t('backlog.typeTask')}</option>
        <option value="Bug">{t('backlog.typeBug')}</option>
      </select>

      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
        <option value="">{t('common.all')} Statuses</option>
        <option value="Backlog">Backlog</option>
        <option value="Todo">To Do</option>
        <option value="InProgress">{t('backlog.statusInProgress')}</option>
        <option value="Review">{t('backlog.statusReview')}</option>
        <option value="Done">{t('backlog.statusDone')}</option>
      </select>

      <select value={assigneeFilter} onChange={(e) => onAssigneeChange(e.target.value)} className={selectClass}>
        <option value="">{t('common.all')} Assignees</option>
        <option value="unassigned">{t('backlog.unassigned')}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id.toString()}>{m.userName}</option>
        ))}
      </select>

      {orgTags.length > 0 && (
        <select value={tagFilter} onChange={(e) => onTagChange(e.target.value)} className={selectClass}>
          <option value="">{t('common.all')} Tags</option>
          {orgTags.map((t) => (
            <option key={t.id} value={t.id.toString()}>{t.name}</option>
          ))}
        </select>
      )}

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('backlog.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
