import { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { bulkImportWorkItems } from '@/lib/api';
import type { TeamMember, Iteration } from '@/lib/api';
import { useJiraCsvParser } from '../hooks/useJiraCsvParser';
import { useJiraImportMappings } from '../hooks/useJiraImportMappings';
import type { TypeMapping, AssigneeMapping } from '../hooks/useJiraImportMappings';

type Step = 'upload' | 'typeMapping' | 'assigneeMapping' | 'preview';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: number;
  members: TeamMember[];
  iterations: Iteration[];
  onImported: () => void;
}

const TYPE_OPTIONS: TypeMapping[] = ['Story', 'Task', 'Bug', 'Skip'];
const PREVIEW_PAGE_SIZE = 20;

export function ImportJiraModal({
  open, onOpenChange, teamId, members, iterations, onImported,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [isImporting, setIsImporting] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);

  const { rows, parseError, parseFile } = useJiraCsvParser();
  const {
    uniqueTypes, uniqueAssignees,
    typeMapping, setTypeMapping,
    assigneeMapping, setAssigneeMapping,
    resolveItems, skippedCount, unmatchedSprints,
  } = useJiraImportMappings(rows, members, iterations);

  function handleClose() {
    setStep('upload');
    setPreviewPage(0);
    onOpenChange(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    parseFile(file);
  }

  function handleUploadNext() {
    if (rows.length > 0 && !parseError) {
      setStep('typeMapping');
    }
  }

  async function handleConfirmImport() {
    const items = resolveItems();
    if (items.length === 0) return;
    setIsImporting(true);
    try {
      const result = await bulkImportWorkItems(teamId, { items });
      toast({ variant: 'success', title: `${result.importedCount} items imported successfully.` });
      handleClose();
      onImported();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed.';
      toast({ variant: 'error', title: 'Import failed', description: msg });
    } finally {
      setIsImporting(false);
    }
  }

  const resolvedItems = step === 'preview' ? resolveItems() : [];
  const totalPages = Math.ceil(resolvedItems.length / PREVIEW_PAGE_SIZE);
  const pageItems = resolvedItems.slice(
    previewPage * PREVIEW_PAGE_SIZE,
    (previewPage + 1) * PREVIEW_PAGE_SIZE,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import from Jira</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Select a Jira CSV export file to begin.'}
            {step === 'typeMapping' && 'Map each Jira issue type to an iterim type.'}
            {step === 'assigneeMapping' && 'Map Jira assignees to team members.'}
            {step === 'preview' && `Review ${resolvedItems.length} items before importing.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* ── STEP 1: UPLOAD ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose CSV file
              </Button>
              {parseError && (
                <p className="text-sm text-destructive">{parseError}</p>
              )}
              {rows.length > 0 && !parseError && (
                <p className="text-sm text-muted-foreground">{rows.length} rows found.</p>
              )}
            </div>
          )}

          {/* ── STEP 2: TYPE MAPPING ── */}
          {step === 'typeMapping' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Jira Issue Type</th>
                  <th className="text-left pb-2">Maps to</th>
                </tr>
              </thead>
              <tbody>
                {uniqueTypes.map(jiraType => (
                  <tr key={jiraType} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{jiraType}</td>
                    <td className="py-2">
                      <Select
                        value={typeMapping[jiraType]}
                        onValueChange={v =>
                          setTypeMapping(prev => ({ ...prev, [jiraType]: v as TypeMapping }))
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── STEP 3: ASSIGNEE MAPPING ── */}
          {step === 'assigneeMapping' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Jira Assignee</th>
                  <th className="text-left pb-2">Team Member</th>
                </tr>
              </thead>
              <tbody>
                {uniqueAssignees.map(name => (
                  <tr key={name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{name}</td>
                    <td className="py-2">
                      <Select
                        value={String(assigneeMapping[name] ?? 'null')}
                        onValueChange={v =>
                          setAssigneeMapping(prev => ({
                            ...prev,
                            [name]: v === 'null' ? null : Number(v) as AssigneeMapping,
                          }))
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Unassigned</SelectItem>
                          {members.map(m => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.userName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── STEP 4: PREVIEW ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              {(skippedCount > 0 || unmatchedSprints.length > 0) && (
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800 space-y-1">
                  {skippedCount > 0 && (
                    <p>{skippedCount} row(s) will be skipped (empty title or type mapped to Skip).</p>
                  )}
                  {unmatchedSprints.length > 0 && (
                    <p>
                      Sprint(s) not matched to any iteration — items will be added to Backlog:{' '}
                      <strong>{unmatchedSprints.join(', ')}</strong>
                    </p>
                  )}
                </div>
              )}

              <table className="w-full text-xs border rounded-md overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Assignee</th>
                    <th className="text-left p-2">Sprint</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, i) => {
                    const typeLabel = ['Story', 'Task', 'Bug'][item.type] ?? '?';
                    const priorityLabel = ['Low', 'Medium', 'High', 'Critical'][item.priority] ?? '?';
                    const statusLabel = ['Backlog', 'Todo', 'InProgress', 'Review', 'Done'][item.status] ?? '?';
                    const member = item.assignedTo ? members.find(m => m.id === item.assignedTo) : null;
                    const iteration = item.iterationId ? iterations.find(it => it.id === item.iterationId) : null;
                    return (
                      <tr key={i} className="border-t">
                        <td className="p-2 max-w-xs truncate">{item.title}</td>
                        <td className="p-2">{typeLabel}</td>
                        <td className="p-2">{priorityLabel}</td>
                        <td className="p-2">{statusLabel}</td>
                        <td className="p-2">{member?.userName ?? '—'}</td>
                        <td className="p-2">{iteration?.name ?? 'Backlog'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Button
                    size="sm" variant="ghost"
                    disabled={previewPage === 0}
                    onClick={() => setPreviewPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span>Page {previewPage + 1} of {totalPages}</span>
                  <Button
                    size="sm" variant="ghost"
                    disabled={previewPage >= totalPages - 1}
                    onClick={() => setPreviewPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER BUTTONS ── */}
        <div className="flex justify-between pt-4 border-t mt-2">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <div className="flex gap-2">
            {step === 'typeMapping' && (
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
            )}
            {step === 'assigneeMapping' && (
              <Button variant="outline" onClick={() => setStep('typeMapping')}>Back</Button>
            )}
            {step === 'preview' && (
              <Button variant="outline" onClick={() => setStep('assigneeMapping')}>Back</Button>
            )}

            {step === 'upload' && (
              <Button onClick={handleUploadNext} disabled={rows.length === 0 || !!parseError}>
                Next
              </Button>
            )}
            {step === 'typeMapping' && (
              <Button onClick={() => setStep('assigneeMapping')}>Next</Button>
            )}
            {step === 'assigneeMapping' && (
              <Button onClick={() => { setPreviewPage(0); setStep('preview'); }}>Next</Button>
            )}
            {step === 'preview' && (
              <Button
                onClick={handleConfirmImport}
                disabled={resolvedItems.length === 0 || isImporting}
              >
                {isImporting ? 'Importing…' : `Import ${resolvedItems.length} items`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
