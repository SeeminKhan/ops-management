import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortField } from '../hooks/useIssueFilters';

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentField: SortField;
  currentDir: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  className?: string;
}

export default function SortableHeader({
  field,
  label,
  currentField,
  currentDir,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-benne-brown-muted uppercase tracking-wider ${className}`}
    >
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 group transition-colors ${
          isActive ? 'text-benne-gold' : 'text-benne-brown-muted hover:text-benne-brown'
        }`}
      >
        {label}
        <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          {isActive ? (
            currentDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
          ) : (
            <ArrowUpDown size={12} />
          )}
        </span>
      </button>
    </th>
  );
}
