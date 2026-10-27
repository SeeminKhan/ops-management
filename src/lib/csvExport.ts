/**
 * CSV Export utilities for issues
 * Handles proper escaping, formula injection prevention, and formatting
 */

import type { Database } from '../types/database';

type Issue = Database['public']['Tables']['issues']['Row'] & {
  outlets: { name: string } | null;
  reporter: { full_name: string } | null;
  assigned_profile: { full_name: string } | null;
};

/**
 * Escape CSV cell value:
 * - Wrap in quotes if contains comma, quote, or newline
 * - Double any internal quotes
 * - Prefix with single quote if starts with formula characters (=, +, -, @)
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';

  let str = String(value);

  // Prevent formula injection
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Check if escaping needed
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Format date for CSV
 */
function formatCsvDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate CSV from issues array
 * @param issues Array of issues to export
 * @returns CSV string ready to download
 */
export function generateCsv(issues: Issue[]): string {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Priority',
    'Status',
    'Outlet',
    'Reported By',
    'Assigned To',
    'Created At',
    'Due Date',
    'Resolved At',
    'Resolution Notes',
  ];

  const rows = issues.map((issue) => [
    issue.id,
    issue.title,
    issue.description,
    formatStatus(issue.category),
    formatStatus(issue.priority),
    formatStatus(issue.status),
    issue.outlets?.name || '',
    issue.reporter?.full_name || '',
    issue.assigned_profile?.full_name || '',
    formatCsvDate(issue.created_at),
    formatCsvDate(issue.due_date),
    formatCsvDate(issue.resolved_at),
    issue.resolution_note || '',
  ]);

  // Build CSV
  const csvContent = [
    // Header row
    headers.map(escapeCsvCell).join(','),
    // Data rows
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Trigger CSV download in browser
 * @param csvContent CSV string content
 * @param filename Filename for download (default: issues-export-[date].csv)
 */
export function downloadCsv(csvContent: string, filename?: string): void {
  if (!filename) {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    filename = `issues-export-${date}.csv`;
  }

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export issues to CSV file (shorthand)
 * @param issues Array of issues to export
 * @param filename Optional custom filename
 */
export function exportIssuesToCsv(issues: Issue[], filename?: string): void {
  const csv = generateCsv(issues);
  downloadCsv(csv, filename);
}
