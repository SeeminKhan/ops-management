import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileSearch,
  Download,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import OverdueBadge from '../components/OverdueBadge';
import FilterBar from '../components/FilterBar';
import SortableHeader from '../components/SortableHeader';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useIssueFilters } from '../hooks/useIssueFilters';
import { exportIssuesToCsv } from '../lib/csvExport';
import type { Database } from '../types/database';

type Issue = Database['public']['Tables']['issues']['Row'] & {
  outlets: { name: string } | null;
  reporter: { full_name: string } | null;
  assigned_profile?: { full_name: string } | null;
};

type Outlet = { id: string; name: string };
type Manager = { id: string; full_name: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-benne-border">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-benne-cream rounded w-2/3" />
            <div className="h-3 bg-benne-cream rounded w-1/2" />
          </div>
          <div className="h-5 bg-benne-cream rounded w-16" />
          <div className="h-5 bg-benne-cream rounded w-16" />
          <div className="h-5 bg-benne-cream rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OperationsDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const { metrics, loading: metricsLoading } = useDashboardMetrics();
  const navigate = useNavigate();

  const {
    filters,
    updateFilters,
    resetFilters,
    toggleSort,
    filteredIssues,
    activeFilterCount,
  } = useIssueFilters(issues);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [issuesRes, outletsRes, managersRes] = await Promise.all([
        supabase
          .from('issues')
          .select(`
            *,
            outlets (name),
            reporter:profiles!issues_reported_by_fkey (full_name),
            assigned_profile:profiles!issues_assigned_to_fkey (full_name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('outlets').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name').eq('role', 'operations_manager').order('full_name'),
      ]);

      if (issuesRes.error) throw issuesRes.error;
      setIssues((issuesRes.data as unknown as Issue[]) || []);
      setOutlets(outletsRes.data || []);
      setManagers(managersRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Metric card click → set metricFilter ─────────────────────────────────

  function handleMetricClick(metricFilter: string) {
    // Reset all other filters when clicking a metric card
    updateFilters({
      search: '',
      status: '',
      priority: '',
      category: '',
      outlet: '',
      assignee: '',
      overdue: '',
      dateFrom: '',
      dateTo: '',
      metricFilter,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 w-full">
          <div>
            <h1 className="text-3xl font-serif text-benne-brown mb-1">Operations Dashboard</h1>
            <p className="text-benne-brown-muted">Monitor and manage issues across all outlets</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* CSV Export — exports currently filtered issues */}
            {!loading && filteredIssues.length > 0 && (
              <button
                id="export-csv-btn"
                onClick={() => exportIssuesToCsv(filteredIssues as any)}
                className="btn-secondary flex items-center gap-2 text-sm py-2"
                title={`Export ${filteredIssues.length} issue${filteredIssues.length !== 1 ? 's' : ''} to CSV`}
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
            <button
              onClick={() => navigate('/issues/new')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Report Issue
            </button>
          </div>
        </div>

        {/* ── Metrics Grid ─────────────────────────────────────────────── */}
        {metricsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 w-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-16 bg-benne-cream rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 w-full">
            <MetricCard
              title="Open Issues"
              count={metrics.totalOpen}
              icon={AlertCircle}
              iconColor="text-blue-600"
              onClick={() => handleMetricClick('open')}
            />
            <MetricCard
              title="High Priority"
              count={metrics.highPriority}
              icon={AlertTriangle}
              iconColor="text-red-600"
              onClick={() => handleMetricClick('high_priority')}
            />
            <MetricCard
              title="Overdue"
              count={metrics.overdue}
              icon={Calendar}
              iconColor="text-orange-600"
              onClick={() => handleMetricClick('overdue')}
            />
            <MetricCard
              title="In Progress"
              count={metrics.inProgress}
              icon={Clock}
              iconColor="text-amber-600"
              onClick={() => handleMetricClick('in_progress')}
            />
            <MetricCard
              title="Resolved (7d)"
              count={metrics.resolvedThisWeek}
              icon={CheckCircle}
              iconColor="text-green-600"
              onClick={() => handleMetricClick('resolved_week')}
            />
            <MetricCard
              title="Resolution Rate"
              count={`${metrics.resolutionRate}%`}
              icon={TrendingUp}
              iconColor="text-purple-600"
            />
          </div>
        )}

        {/* ── Filter Bar ───────────────────────────────────────────────── */}
        <div className="mb-5 w-full">
          <FilterBar
            filters={filters}
            onUpdate={updateFilters}
            onReset={resetFilters}
            activeFilterCount={activeFilterCount}
            outlets={outlets}
            managers={managers}
            totalCount={issues.length}
            filteredCount={filteredIssues.length}
          />
        </div>

        {/* ── Issues Table ─────────────────────────────────────────────── */}
        <div className="card p-0 overflow-hidden w-full">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-benne-border bg-white flex items-center justify-between">
            <h2 className="text-lg font-serif text-benne-brown">
              {activeFilterCount > 0
                ? `Filtered Issues (${filteredIssues.length})`
                : `All Issues (${issues.length})`}
            </h2>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : filteredIssues.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16 px-6">
              <FileSearch className="mx-auto h-12 w-12 text-benne-brown-muted/25 mb-4" />
              <h3 className="text-lg font-medium text-benne-brown mb-2">
                {activeFilterCount > 0 ? 'No issues match your filters' : 'No issues reported yet'}
              </h3>
              <p className="text-benne-brown-muted mb-6 max-w-sm mx-auto text-sm">
                {activeFilterCount > 0
                  ? 'Try adjusting your search terms or clearing some filters'
                  : 'Get started by reporting your first operational issue'}
              </p>
              {activeFilterCount > 0 ? (
                <button onClick={resetFilters} className="btn-secondary">
                  Clear all filters
                </button>
              ) : (
                <button onClick={() => navigate('/issues/new')} className="btn-primary">
                  Report an Issue
                </button>
              )}
            </div>
          ) : (
            /* Table */
            <div className="w-full overflow-x-auto">
              <table className="w-full divide-y divide-benne-border border-collapse">
                <thead className="bg-benne-cream/60">
                  <tr>
                    <SortableHeader
                      field="title"
                      label="Issue"
                      currentField={filters.sortField}
                      currentDir={filters.sortDir}
                      onSort={toggleSort}
                      className="flex-1"
                    />
                    <th className="px-4 py-3 text-left text-xs font-medium text-benne-brown-muted uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-benne-brown-muted uppercase tracking-wider">
                      Category
                    </th>
                    <SortableHeader
                      field="priority"
                      label="Priority"
                      currentField={filters.sortField}
                      currentDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <SortableHeader
                      field="status"
                      label="Status"
                      currentField={filters.sortField}
                      currentDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <SortableHeader
                      field="due_date"
                      label="Due Date"
                      currentField={filters.sortField}
                      currentDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <th className="px-4 py-3 text-left text-xs font-medium text-benne-brown-muted uppercase tracking-wider">
                      Assigned To
                    </th>
                    <SortableHeader
                      field="created_at"
                      label="Reported"
                      currentField={filters.sortField}
                      currentDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <th className="px-4 py-3 text-right text-xs font-medium text-benne-brown-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-benne-border">
                  {filteredIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      className="hover:bg-benne-cream/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/issues/${issue.id}`)}
                    >
                      {/* Issue title + description + overdue */}
                      <td className="px-4 py-3.5 flex-1 min-w-0">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-medium text-benne-brown leading-snug line-clamp-1">
                            {issue.title}
                          </span>
                          <span className="text-xs text-benne-brown-muted line-clamp-1 max-w-xs">
                            {issue.description}
                          </span>
                          {issue.due_date && (
                            <OverdueBadge
                              dueDate={issue.due_date}
                              status={issue.status}
                              size="sm"
                            />
                          )}
                        </div>
                      </td>

                      {/* Outlet */}
                      <td className="px-4 py-3.5 text-sm text-benne-brown whitespace-nowrap min-w-[120px]">
                        {issue.outlets?.name || '—'}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-sm text-benne-brown capitalize whitespace-nowrap min-w-[110px]">
                        {issue.category}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap min-w-[130px]">
                        {issue.due_date ? (
                          <span
                            className={
                              issue.status !== 'resolved' && new Date(issue.due_date) < new Date()
                                ? 'text-red-700 font-medium'
                                : 'text-benne-brown-muted'
                            }
                          >
                            {formatDueDate(issue.due_date)}
                          </span>
                        ) : (
                          <span className="text-benne-brown-muted">—</span>
                        )}
                      </td>

                      {/* Assigned to */}
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap min-w-[140px]">
                        {issue.assigned_profile?.full_name ? (
                          <span className="text-benne-brown">{issue.assigned_profile.full_name}</span>
                        ) : (
                          <span className="text-benne-brown-muted/60 italic text-xs">Unassigned</span>
                        )}
                      </td>

                      {/* Reported date */}
                      <td className="px-4 py-3.5 text-xs text-benne-brown-muted whitespace-nowrap min-w-[100px]">
                        {new Date(issue.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* View button */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/issues/${issue.id}`)}
                          className="text-sm text-benne-gold hover:text-benne-gold-dark font-medium transition-colors"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Result count footer ────────────────────────────────────── */}
        {!loading && filteredIssues.length > 0 && (
          <p className="mt-3 text-xs text-benne-brown-muted text-center">
            Showing {filteredIssues.length} of {issues.length} issues
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="ml-2 text-benne-gold hover:text-benne-gold-dark font-medium"
              >
                (Clear filters)
              </button>
            )}
          </p>
        )}
      </div>
    </Layout>
  );
}
