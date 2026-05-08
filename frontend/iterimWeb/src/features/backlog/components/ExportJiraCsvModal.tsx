import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import type { BacklogGroup, Iteration, TeamMember } from '@/lib/api';
import { buildJiraCsv, type ExportFilters } from '../hooks/useJiraCsvExport';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: BacklogGroup[];
  iterations: Iteration[];
  members: TeamMember[];
}

export function ExportJiraCsvModal({ open, onOpenChange, groups, iterations, members }: Props) {
  const allIds = useMemo<(number | null)[]>(
    () => [null, ...iterations.map(i => i.id)],
    [iterations],
  );

  const [selectedIds, setSelectedIds] = useState<Set<number | null>>(() => new Set(allIds));
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // Reset to all-selected whenever the dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(allIds));
      setTypeFilter('');
      setStatusFilter('');
      setAssigneeId('');
    }
  }, [open]); // intentionally omit allIds — reset is only on open transition

  const allSelected = selectedIds.size === allIds.length;

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  }

  function toggleId(id: number | null) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filters: ExportFilters = { type: typeFilter, status: statusFilter, assigneeId };

  const matchingCount = useMemo(() => {
    let count = 0;
    for (const group of groups) {
      if (!selectedIds.has(group.iterationId)) continue;
      for (const item of group.workItems) {
        if (filters.type && item.type !== filters.type) continue;
        if (filters.status && item.status !== filters.status) continue;
        if (filters.assigneeId === 'unassigned' && item.assignedTo !== null) continue;
        if (
          filters.assigneeId &&
          filters.assigneeId !== 'unassigned' &&
          item.assignedTo !== Number(filters.assigneeId)
        ) continue;
        count++;
      }
    }
    return count;
  }, [groups, selectedIds, filters.type, filters.status, filters.assigneeId]);

  function handleExport() {
    const csv = buildJiraCsv(groups, selectedIds, filters);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iterim-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export to CSV</DialogTitle>
          <DialogDescription>
            Select iterations and apply optional filters, then download a Jira-compatible CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">

          {/* ── Iteration Selection ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Iterations</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={toggleAll}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </Button>
            </div>
            <div className="rounded-md border divide-y">
              {/* Backlog row */}
              <label className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedIds.has(null)}
                  onChange={() => toggleId(null)}
                />
                <span className="text-sm flex-1">Backlog</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                  Backlog
                </span>
              </label>
              {/* Iteration rows */}
              {iterations.map(iter => (
                <label key={iter.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={selectedIds.has(iter.id)}
                    onChange={() => toggleId(iter.id)}
                  />
                  <span className="text-sm flex-1">{iter.name ?? `Sprint ${iter.id}`}</span>
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    iter.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : iter.status === 'Planning'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {iter.status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Filter Options ── */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Filters</span>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={typeFilter || '__all__'}
                onValueChange={v => setTypeFilter(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Bug">Bug</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter || '__all__'}
                onValueChange={v => setStatusFilter(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Statuses</SelectItem>
                  <SelectItem value="Backlog">Backlog</SelectItem>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="InProgress">InProgress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={assigneeId || '__all__'}
                onValueChange={v => setAssigneeId(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between pt-4 border-t mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={matchingCount === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export {matchingCount} items
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
