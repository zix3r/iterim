import type { BacklogGroup } from '@/lib/api';

export interface ExportFilters {
  type: string;      // '' | 'Story' | 'Task' | 'Bug'
  status: string;    // '' | 'Backlog' | 'Todo' | 'InProgress' | 'Review' | 'Done'
  assigneeId: string; // '' | 'unassigned' | TeamMember.id as string
}

const STATUS_MAP: Record<string, string> = {
  Backlog: 'To Do',
  Todo: 'To Do',
  InProgress: 'In Progress',
  Review: 'In Review',
  Done: 'Done',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatJiraDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADERS = [
  'Summary',
  'Issue Type',
  'Status',
  'Priority',
  'Assignee',
  'Description',
  'Sprint',
  'Custom field (Story point estimate)',
  'Labels',
  'Created',
];

export function buildJiraCsv(
  groups: BacklogGroup[],
  selectedIterationIds: Set<number | null>,
  filters: ExportFilters,
): string {
  const rows: string[] = [HEADERS.map(escapeCsv).join(',')];

  for (const group of groups) {
    if (!selectedIterationIds.has(group.iterationId)) continue;

    for (const item of group.workItems) {
      if (filters.type && item.type !== filters.type) continue;
      if (filters.status && item.status !== filters.status) continue;
      if (filters.assigneeId === 'unassigned' && item.assignedTo !== null) continue;
      if (
        filters.assigneeId &&
        filters.assigneeId !== 'unassigned' &&
        item.assignedTo !== Number(filters.assigneeId)
      ) continue;

      const row = [
        item.title,
        item.type,
        STATUS_MAP[item.status] ?? item.status,
        item.priority,
        item.assignedMember?.userName ?? '',
        item.description ?? '',
        group.iterationName ?? '',
        item.points != null ? String(item.points) : '',
        item.tags.map(t => t.name).join(' '),
        formatJiraDate(item.createdAt),
      ];
      rows.push(row.map(escapeCsv).join(','));
    }
  }

  // UTF-8 BOM so Excel opens the file correctly
  return '﻿' + rows.join('\n');
}
