import { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import type { FilterState } from '../hooks/useIssueFilters';

interface Outlet {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  full_name: string;
}

interface FilterBarProps {
  filters: FilterState;
  onUpdate: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  activeFilterCount: number;
  outlets?: Outlet[];
  managers?: Manager[];
  totalCount: number;
  filteredCount: number;
}

// ─── Debounce helper ─────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Filter pill ─────────────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-benne-gold/10 text-benne-gold border border-benne-gold/25">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-benne-gold/20 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X size={10} />
      </button>
    </span>
  );
}

// ─── Select helper ───────────────────────────────────────────────────────────

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <label htmlFor={id} className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-3 pr-8 py-2 text-sm border border-benne-border rounded-md bg-white text-benne-brown appearance-none focus:outline-none focus:ring-2 focus:ring-benne-gold/20 focus:border-benne-gold transition-colors"
        >
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-benne-brown-muted pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function FilterBar({
  filters,
  onUpdate,
  onReset,
  activeFilterCount,
  outlets = [],
  managers = [],
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);
  const isFirstRender = useRef(true);

  // Sync external filter.search → local input (e.g. when reset)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Push debounced search to filter state
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onUpdate({ search: debouncedSearch });
  }, [debouncedSearch]);

  // Build active filter pills for display
  const pills: { label: string; key: keyof FilterState; value?: string }[] = [];
  if (filters.search)   pills.push({ label: `"${filters.search}"`, key: 'search' });
  if (filters.status)   pills.push({ label: filters.status.replace('_', ' '), key: 'status' });
  if (filters.priority) pills.push({ label: `${filters.priority} priority`, key: 'priority' });
  if (filters.category) pills.push({ label: filters.category, key: 'category' });
  if (filters.outlet) {
    const o = outlets.find((x) => x.id === filters.outlet);
    pills.push({ label: o?.name ?? 'Outlet', key: 'outlet' });
  }
  if (filters.assignee === 'unassigned') pills.push({ label: 'Unassigned', key: 'assignee' });
  else if (filters.assignee) {
    const m = managers.find((x) => x.id === filters.assignee);
    pills.push({ label: m?.full_name ?? 'Assignee', key: 'assignee' });
  }
  if (filters.overdue === 'yes') pills.push({ label: 'Overdue only', key: 'overdue' });
  if (filters.dateFrom || filters.dateTo) {
    const label = [filters.dateFrom, filters.dateTo].filter(Boolean).join(' → ');
    pills.push({ label: `Date: ${label}`, key: 'dateFrom' });
  }
  if (filters.metricFilter && filters.metricFilter !== 'all') {
    pills.push({ label: filters.metricFilter.replace(/_/g, ' '), key: 'metricFilter' });
  }

  function removePill(key: keyof FilterState) {
    if (key === 'dateFrom') {
      onUpdate({ dateFrom: '', dateTo: '' });
    } else {
      onUpdate({ [key]: '' } as Partial<FilterState>);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      {/* ── Row 1: Search + Advanced toggle ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-benne-brown-muted pointer-events-none" />
          <input
            id="issues-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, description, outlet, reporter…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-benne-border rounded-md bg-white text-benne-brown placeholder:text-benne-brown-muted/50 focus:outline-none focus:ring-2 focus:ring-benne-gold/20 focus:border-benne-gold transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); onUpdate({ search: '' }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-benne-brown-muted hover:text-benne-brown"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-colors whitespace-nowrap ${
            showAdvanced || activeFilterCount > 0
              ? 'bg-benne-gold/10 border-benne-gold/30 text-benne-gold'
              : 'bg-white border-benne-border text-benne-brown-muted hover:text-benne-brown hover:border-benne-brown/40'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-benne-gold text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Reset (only when filters active) */}
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-benne-border bg-white text-sm text-benne-brown-muted hover:text-benne-brown transition-colors whitespace-nowrap"
            title="Clear all filters"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* ── Row 2: Advanced filter panel ─────────────────────────────── */}
      {showAdvanced && (
        <div className="pt-3 border-t border-benne-border">
          <div className="flex flex-wrap gap-4">
            {/* Status */}
            <FilterSelect id="filter-status" label="Status" value={filters.status} onChange={(v) => onUpdate({ status: v as FilterState['status'] })}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </FilterSelect>

            {/* Priority */}
            <FilterSelect id="filter-priority" label="Priority" value={filters.priority} onChange={(v) => onUpdate({ priority: v as FilterState['priority'] })}>
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </FilterSelect>

            {/* Category */}
            <FilterSelect id="filter-category" label="Category" value={filters.category} onChange={(v) => onUpdate({ category: v as FilterState['category'] })}>
              <option value="">All Categories</option>
              <option value="maintenance">Maintenance</option>
              <option value="equipment">Equipment</option>
              <option value="inventory">Inventory</option>
              <option value="quality">Quality</option>
              <option value="other">Other</option>
            </FilterSelect>

            {/* Outlet */}
            {outlets.length > 0 && (
              <FilterSelect id="filter-outlet" label="Outlet" value={filters.outlet} onChange={(v) => onUpdate({ outlet: v })}>
                <option value="">All Outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </FilterSelect>
            )}

            {/* Assignee */}
            {managers.length > 0 && (
              <FilterSelect id="filter-assignee" label="Assignee" value={filters.assignee} onChange={(v) => onUpdate({ assignee: v })}>
                <option value="">Any Assignee</option>
                <option value="unassigned">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </FilterSelect>
            )}

            {/* Overdue */}
            <FilterSelect id="filter-overdue" label="Overdue" value={filters.overdue} onChange={(v) => onUpdate({ overdue: v as FilterState['overdue'] })}>
              <option value="">All Issues</option>
              <option value="yes">Overdue Only</option>
            </FilterSelect>

            {/* Date range */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider">Date Range</span>
              <div className="flex items-center gap-2">
                <input
                  id="filter-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onUpdate({ dateFrom: e.target.value })}
                  className="pl-3 pr-2 py-2 text-sm border border-benne-border rounded-md bg-white text-benne-brown focus:outline-none focus:ring-2 focus:ring-benne-gold/20 focus:border-benne-gold transition-colors"
                  placeholder="From"
                />
                <span className="text-benne-brown-muted text-xs">to</span>
                <input
                  id="filter-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onUpdate({ dateTo: e.target.value })}
                  className="pl-3 pr-2 py-2 text-sm border border-benne-border rounded-md bg-white text-benne-brown focus:outline-none focus:ring-2 focus:ring-benne-gold/20 focus:border-benne-gold transition-colors"
                  placeholder="To"
                  min={filters.dateFrom}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 3: Active filter pills + result count ─────────────────── */}
      {(pills.length > 0 || totalCount !== filteredCount) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {pills.map((pill) => (
            <FilterPill
              key={pill.key}
              label={pill.label}
              onRemove={() => removePill(pill.key)}
            />
          ))}
          <span className="text-xs text-benne-brown-muted ml-auto">
            {filteredCount === totalCount
              ? `${totalCount} issue${totalCount !== 1 ? 's' : ''}`
              : `${filteredCount} of ${totalCount} issue${totalCount !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
    </div>
  );
}
