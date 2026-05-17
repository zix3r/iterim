import { useState } from 'react';
import Papa from 'papaparse';

export interface JiraRow {
  summary: string;
  issueType: string;
  status: string;
  priority: string;
  assignee: string;
  description: string;
  sprint: string;
  points: string;
}

export type ParseError = string | null;

const REQUIRED_COLUMNS = ['Summary', 'Issue Type', 'Status', 'Priority'];

export function useJiraCsvParser() {
  const [rows, setRows] = useState<JiraRow[]>([]);
  const [parseError, setParseError] = useState<ParseError>(null);

  function parseFile(file: File) {
    setParseError(null);
    setRows([]);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missing.length > 0) {
          setParseError(`CSV is missing required columns: ${missing.join(', ')}`);
          return;
        }
        if (results.data.length === 0) {
          setParseError('CSV contains no data rows.');
          return;
        }

        const mapped: JiraRow[] = results.data.map(row => ({
          summary: row['Summary'] ?? '',
          issueType: row['Issue Type'] ?? '',
          status: row['Status'] ?? '',
          priority: row['Priority'] ?? '',
          assignee: row['Assignee'] ?? '',
          description: row['Description'] ?? '',
          sprint: row['Sprint'] ?? '',
          points: row['Custom field (Story point estimate)'] ?? '',
        }));

        setRows(mapped);
      },
      error(err) {
        setParseError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }

  return { rows, parseError, parseFile };
}
