import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Database, IssueStatus, IssuePriority, IssueCategory } from '../types/database';

type Issue = Database['public']['Tables']['issues']['Row'] & {
  outlets: { name: string } | null;
  reporter: { full_name: string } | null;
  assigned_profile?: { full_name: string } | null;
};

export type SortField = 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'status' | 'title';
export type SortDir = 'asc' | 'desc';

export interface FilterState {
  search: string;
  status: IssueStatus | '';
  priority: IssuePriority | '';
  category: IssueCategory | '';
  outlet: string;
  assignee: string;       // 'unassigned' | '' | profile_id
  overdue: 'yes' | '';
  dateFrom: string;       // ISO date string YYYY-MM-DD
  dateTo: string;
  metricFilter: string;   // from dashboard metric card clicks
  sortField: SortField;
  sortDir: SortDir;
}

const PRIORITY_ORDER: Record<IssuePriority, number> = { high: 3, medium: 2, low: 1 };
const STATUS_ORDER: Record<IssueStatus, number> = { open: 3, in_progress: 2, resolved: 1 };

const DEFAULTS: FilterState = {
  search: '',
  status: '',
  priority: '',
  category: '',
  outlet: '',
  assignee: '',
  overdue: '',
  dateFrom: '',
  dateTo: '',
  metricFilter: '',
  sortField: 'created_at',
  sortDir: 'desc',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fromParams(params: URLSearchParams): FilterState {
  return {
    search:       params.get('q') ?? '',
    status:       (params.get('status') ?? '') as IssueStatus | '',
    priority:     (params.get('priority') ?? '') as IssuePriority | '',
    category:     (params.get('category') ?? '') as IssueCategory | '',
    outlet:       params.get('outlet') ?? '',
    assignee:     params.get('assignee') ?? '',
    overdue:      (params.get('overdue') ?? '') as 'yes' | '',
    dateFrom:     params.get('from') ?? '',
    dateTo:       params.get('to') ?? '',
    metricFilter: params.get('filter') ?? '',
    sortField:    (params.get('sort') ?? 'created_at') as SortField,
    sortDir:      (params.get('dir') ?? 'desc') as SortDir,
  };
}

function toParams(f: FilterState): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.search)       p['q']        = f.search;
  if (f.status)       p['status']   = f.status;
  if (f.priority)     p['priority'] = f.priority;
  if (f.category)     p['category'] = f.category;
  if (f.outlet)       p['outlet']   = f.outlet;
  if (f.assignee)     p['assignee'] = f.assignee;
  if (f.overdue)      p['overdue']  = f.overdue;
  if (f.dateFrom)     p['from']     = f.dateFrom;
  if (f.dateTo)       p['to']       = f.dateTo;
  if (f.metricFilter) p['filter']   = f.metricFilter;
  if (f.sortField !== 'created_at') p['sort'] = f.sortField;
  if (f.sortDir !== 'desc')         p['dir']  = f.sortDir;
  return p;
}

function applyFilters(issues: Issue[], f: FilterState): Issue[] {
  const now = new Date();
  const searchLower = f.search.toLowerCase().trim();

  let result = issues.filter((issue) => {
    // ── search ──────────────────────────────────────────────────────────
    if (searchLower) {
      const haystack = [
        issue.title,
        issue.description,
        issue.outlets?.name ?? '',
        issue.reporter?.full_name ?? '',
        issue.category,
        issue.status,
        issue.priority,
      ].join(' ').toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }

    // ── metric filter (from metric card clicks, legacy compat) ──────────
    if (f.metricFilter && f.metricFilter !== 'all') {
      switch (f.metricFilter) {
        case 'open':
          if (issue.status !== 'open') return false;
          break;
        case 'high_priority':
          if (issue.priority !== 'high' || issue.status === 'resolved') return false;
          break;
        case 'overdue':
          if (issue.status === 'resolved' || !issue.due_date) return false;
          if (new Date(issue.due_date) >= now) return false;
          break;
        case 'in_progress':
          if (issue.status !== 'in_progress') return false;
          break;
        case 'resolved_week': {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (!issue.resolved_at || new Date(issue.resolved_at) < oneWeekAgo) return false;
          break;
        }
      }
    }

    // ── status ───────────────────────────────────────────────────────────
    if (f.status && issue.status !== f.status) return false;

    // ── priority ─────────────────────────────────────────────────────────
    if (f.priority && issue.priority !== f.priority) return false;

    // ── category ─────────────────────────────────────────────────────────
    if (f.category && issue.category !== f.category) return false;

    // ── outlet ───────────────────────────────────────────────────────────
    if (f.outlet && issue.outlet_id !== f.outlet) return false;

    // ── assignee ─────────────────────────────────────────────────────────
    if (f.assignee === 'unassigned' && issue.assigned_to !== null) return false;
    if (f.assignee && f.assignee !== 'unassigned' && issue.assigned_to !== f.assignee) return false;

    // ── overdue ──────────────────────────────────────────────────────────
    if (f.overdue === 'yes') {
      if (issue.status === 'resolved' || !issue.due_date) return false;
      if (new Date(issue.due_date) >= now) return false;
    }

    // ── date range (created_at) ──────────────────────────────────────────
    if (f.dateFrom) {
      const from = new Date(f.dateFrom);
      from.setHours(0, 0, 0, 0);
      if (new Date(issue.created_at) < from) return false;
    }
    if (f.dateTo) {
      const to = new Date(f.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(issue.created_at) > to) return false;
    }

    return true;
  });

  // ── sort ─────────────────────────────────────────────────────────────────
  result.sort((a, b) => {
    let cmp = 0;
    switch (f.sortField) {
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'priority':
        cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
        break;
      case 'status':
        cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
        break;
      case 'due_date': {
        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        cmp = ad - bd;
        break;
      }
      case 'updated_at':
        cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case 'created_at':
      default:
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return f.sortDir === 'asc' ? cmp : -cmp;
  });

  return result;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useIssueFilters(issues: Issue[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => fromParams(searchParams));

  // Sync from URL on mount / back-navigation
  useEffect(() => {
    setFilters(fromParams(searchParams));
  }, [searchParams.toString()]);

  // Write filters to URL (debounce search to avoid thrashing)
  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      // If a real filter changed, clear metricFilter to avoid conflicts
      const realFilterKeys: Array<keyof FilterState> = ['status', 'priority', 'category', 'outlet', 'assignee', 'overdue', 'dateFrom', 'dateTo'];
      const changedRealFilter = realFilterKeys.some((k) => patch[k] !== undefined && patch[k] !== prev[k]);
      if (changedRealFilter && !patch.metricFilter) {
        next.metricFilter = '';
      }
      setSearchParams(toParams(next), { replace: true });
      return next;
    });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULTS);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const toggleSort = useCallback((field: SortField) => {
    setFilters((prev) => {
      const next: FilterState = {
        ...prev,
        sortField: field,
        sortDir: prev.sortField === field && prev.sortDir === 'desc' ? 'asc' : 'desc',
      };
      setSearchParams(toParams(next), { replace: true });
      return next;
    });
  }, [setSearchParams]);

  const filteredIssues = useMemo(() => applyFilters(issues, filters), [issues, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search)       count++;
    if (filters.status)       count++;
    if (filters.priority)     count++;
    if (filters.category)     count++;
    if (filters.outlet)       count++;
    if (filters.assignee)     count++;
    if (filters.overdue)      count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.metricFilter && filters.metricFilter !== 'all') count++;
    return count;
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    toggleSort,
    filteredIssues,
    activeFilterCount,
  };
}
