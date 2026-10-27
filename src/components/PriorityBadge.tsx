import type { IssuePriority } from '../types/database';

interface PriorityBadgeProps {
  priority: IssuePriority;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = {
    low: 'bg-gray-50 text-gray-700 border-gray-200',
    medium: 'bg-orange-50 text-orange-700 border-orange-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}
