import { useEffect, useMemo, useState } from 'react';
import type { JiraRow } from './useJiraCsvParser';
import type { TeamMember, Iteration, ImportWorkItemRequest } from '@/lib/api';

export type TypeMapping = 'Story' | 'Task' | 'Bug' | 'Skip';
export type AssigneeMapping = number | null;
export type SprintMapping = number | null; // iteration id, null = backlog

const TYPE_VALUES: Record<string, number> = { Story: 0, Task: 1, Bug: 2 };
const PRIORITY_VALUES: Record<string, number> = {
  Low: 0, Lowest: 0,
  Medium: 1,
  High: 2, Highest: 2,
  Critical: 3,
};
const STATUS_VALUES: Record<string, number> = {
  'To Do': 1, 'Open': 1,
  'In Progress': 2,
  'In Review': 3, 'Review': 3,
  'Done': 4, 'Closed': 4, 'Resolved': 4,
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function useJiraImportMappings(
  rows: JiraRow[],
  members: TeamMember[],
  iterations: Iteration[],
) {
  const uniqueTypes = useMemo(
    () => [...new Set(rows.map(r => r.issueType).filter(Boolean))],
    [rows],
  );

  const uniqueAssignees = useMemo(
    () => [...new Set(rows.map(r => r.assignee).filter(Boolean))],
    [rows],
  );

  const uniqueSprints = useMemo(
    () => [...new Set(
      rows.map(r => r.sprint ? r.sprint.split(',')[0].trim() : '').filter(Boolean)
    )],
    [rows],
  );

  const defaultTypeMapping = useMemo(() => {
    const defaults: Record<string, TypeMapping> = {};
    for (const t of uniqueTypes) {
      const lower = t.toLowerCase();
      if (lower === 'story') defaults[t] = 'Story';
      else if (lower === 'bug') defaults[t] = 'Bug';
      else if (lower === 'task') defaults[t] = 'Task';
      else if (lower === 'epic' || lower === 'sub-task') defaults[t] = 'Skip';
      else defaults[t] = 'Task';
    }
    return defaults;
  }, [uniqueTypes]);

  const defaultAssigneeMapping = useMemo(() => {
    const defaults: Record<string, AssigneeMapping> = {};
    for (const name of uniqueAssignees) {
      const norm = normalizeName(name);
      const match = members.find(m => normalizeName(m.userName) === norm);
      defaults[name] = match?.id ?? null;
    }
    return defaults;
  }, [uniqueAssignees, members]);

  const defaultSprintMapping = useMemo(() => {
    const defaults: Record<string, SprintMapping> = {};
    for (const sprint of uniqueSprints) {
      const match = iterations.find(i => normalizeName(i.name ?? '') === normalizeName(sprint));
      defaults[sprint] = match?.id ?? null;
    }
    return defaults;
  }, [uniqueSprints, iterations]);

  const [typeMapping, setTypeMapping] = useState<Record<string, TypeMapping>>(defaultTypeMapping);
  const [assigneeMapping, setAssigneeMapping] = useState<Record<string, AssigneeMapping>>(defaultAssigneeMapping);
  const [sprintMapping, setSprintMapping] = useState<Record<string, SprintMapping>>(defaultSprintMapping);

  // Reset all mappings when a new file is parsed (rows change)
  useEffect(() => {
    setTypeMapping(defaultTypeMapping);
    setAssigneeMapping(defaultAssigneeMapping);
    setSprintMapping(defaultSprintMapping);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function resolveItems(): ImportWorkItemRequest[] {
    return rows
      .filter(row => {
        if (!row.summary.trim()) return false;
        if (typeMapping[row.issueType] === 'Skip') return false;
        return true;
      })
      .map(row => {
        const mappedType = typeMapping[row.issueType] ?? 'Task';
        const typeValue = TYPE_VALUES[mappedType] ?? 1;
        const priorityValue = PRIORITY_VALUES[row.priority] ?? 1;
        const statusValue = STATUS_VALUES[row.status] ?? 0;
        const parsedPoints = row.points ? parseInt(row.points, 10) : undefined;
        const points = parsedPoints !== undefined && !isNaN(parsedPoints) ? parsedPoints : undefined;
        const assignedTo = row.assignee ? (assigneeMapping[row.assignee] ?? null) : null;

        const sprintName = row.sprint ? row.sprint.split(',')[0].trim() : '';
        const iterationId = sprintName ? (sprintMapping[sprintName] ?? null) : null;

        return {
          title: row.summary.trim(),
          description: row.description.trim() || undefined,
          type: typeValue,
          priority: priorityValue,
          status: statusValue,
          points,
          assignedTo,
          iterationId,
        } satisfies ImportWorkItemRequest;
      });
  }

  const skippedCount = useMemo(
    () => rows.filter(r => !r.summary.trim() || typeMapping[r.issueType] === 'Skip').length,
    [rows, typeMapping],
  );

  return {
    uniqueTypes,
    uniqueAssignees,
    uniqueSprints,
    typeMapping,
    setTypeMapping,
    assigneeMapping,
    setAssigneeMapping,
    sprintMapping,
    setSprintMapping,
    resolveItems,
    skippedCount,
  };
}
