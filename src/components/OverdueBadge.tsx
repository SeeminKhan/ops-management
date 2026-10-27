import { AlertTriangle, Clock } from 'lucide-react';

interface OverdueBadgeProps {
  dueDate: string;
  status: string;
  size?: 'sm' | 'md';
}

/**
 * Shows an "Overdue" badge if the issue is past its due date and not resolved.
 * Shows a "Due soon" badge if within 2 hours.
 */
export default function OverdueBadge({ dueDate, status, size = 'sm' }: OverdueBadgeProps) {
  if (status === 'resolved') return null;

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    // Overdue
    const overdueHours = Math.abs(diffHours);
    const label =
      overdueHours < 1
        ? 'Overdue'
        : overdueHours < 24
        ? `Overdue ${Math.floor(overdueHours)}h`
        : `Overdue ${Math.floor(overdueHours / 24)}d`;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-semibold bg-red-100 text-red-700 border border-red-200 ${
          size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
        }`}
        title={`Due: ${due.toLocaleString()}`}
      >
        <AlertTriangle size={size === 'md' ? 13 : 11} />
        {label}
      </span>
    );
  }

  if (diffHours <= 2) {
    // Due soon
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-semibold bg-amber-100 text-amber-700 border border-amber-200 ${
          size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
        }`}
        title={`Due: ${due.toLocaleString()}`}
      >
        <Clock size={size === 'md' ? 13 : 11} />
        Due soon
      </span>
    );
  }

  return null;
}
