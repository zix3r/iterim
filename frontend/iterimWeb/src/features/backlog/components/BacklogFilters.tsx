import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { TeamMember } from '@/lib/api';

interface Props {
  typeFilter: string;
  statusFilter: string;
  assigneeFilter: string;
  searchQuery: string;
  members: TeamMember[];
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onAssigneeChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

const selectClass = "px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function BacklogFilters({
  typeFilter, statusFilter, assigneeFilter, searchQuery,
  members, onTypeChange, onStatusChange, onAssigneeChange, onSearchChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} className={selectClass}>
        <option value="">All Types</option>
        <option value="Story">Story</option>
        <option value="Task">Task</option>
        <option value="Bug">Bug</option>
      </select>

      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
        <option value="">All Statuses</option>
        <option value="Backlog">Backlog</option>
        <option value="Todo">To Do</option>
        <option value="InProgress">In Progress</option>
        <option value="Review">Review</option>
        <option value="Done">Done</option>
      </select>

      <select value={assigneeFilter} onChange={(e) => onAssigneeChange(e.target.value)} className={selectClass}>
        <option value="">All Assignees</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id.toString()}>{m.userName}</option>
        ))}
      </select>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search work items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
