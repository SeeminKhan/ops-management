import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle, Search, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import OverdueBadge from '../components/OverdueBadge';
import type { Database, IssueStatus, IssuePriority } from '../types/database';

type Issue = Database['public']['Tables']['issues']['Row'] & {
  outlets: { name: string } | null;
};

export default function OutletStaffDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [outletName, setOutletName] = useState('');
  const [loading, setLoading] = useState(true);

  // Search & filter state (local — no URL persistence needed for staff)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.outlet_id) {
      loadData();
    }
  }, [profile]);

  async function loadData() {
    if (!profile?.outlet_id) return;
    try {
      const [outletRes, issuesRes] = await Promise.all([
        supabase.from('outlets').select('name').eq('id', profile.outlet_id).single(),
        supabase
          .from('issues')
          .select('*, outlets (name)')
          .eq('outlet_id', profile.outlet_id)
          .order('created_at', { ascending: false }),
      ]);

      const outletData = outletRes.data as unknown as { name: string } | null;
      if (outletData?.name) setOutletName(outletData.name);
      if (issuesRes.error) throw issuesRes.error;
      setIssues((issuesRes.data as unknown as Issue[]) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // ── Client-side filtering ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return issues.filter((issue) => {
      if (statusFilter && issue.status !== statusFilter) return false;
      if (priorityFilter && issue.priority !== priorityFilter) return false;
      if (q) {
        const haystack = [issue.title, issue.description, issue.category].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [issues, search, statusFilter, priorityFilter]);

  const hasFilters = !!(search || statusFilter || priorityFilter);

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
  }

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-benne-cream rounded w-48" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="card space-y-3">
                <div className="h-5 bg-benne-cream rounded w-2/3" />
                <div className="h-4 bg-benne-cream rounded w-full" />
                <div className="h-4 bg-benne-cream rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 w-full">
          <div>
            <h1 className="text-3xl font-serif text-benne-brown mb-1">{outletName || 'My Outlet'}</h1>
            <p className="text-benne-brown-muted text-sm">
              {issues.length} issue{issues.length !== 1 ? 's' : ''} reported
            </p>
          </div>
          <button
            onClick={() => navigate('/issues/new')}
            className="btn-primary flex items-center gap-2 shrink-0"
          >
            <Plus size={18} />
            Report an Issue
          </button>
        </div>

        {/* ── Search & Filter Bar ─────────────────────────────────────── */}
        <div className="card p-4 mb-5 space-y-3 w-full">
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-benne-brown-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-benne-border rounded-md bg-white text-benne-brown placeholder:text-benne-brown-muted/50 focus:outline-none focus:ring-2 focus:ring-benne-gold/20 focus:border-benne-gold transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-benne-brown-muted hover:text-benne-brown">
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                showFilters || statusFilter || priorityFilter
                  ? 'bg-benne-gold/10 border-benne-gold/30 text-benne-gold'
                  : 'bg-white border-benne-border text-benne-brown-muted hover:text-benne-brown'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filter
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-benne-brown-muted hover:text-benne-brown px-3 py-2.5 rounded-md border border-benne-border bg-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-benne-border">
              <div className="flex flex-col gap-1 min-w-[130px]">
                <label htmlFor="staff-status" className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider">Status</label>
                <select
                  id="staff-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')}
                  className="input-field text-sm py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-[130px]">
                <label htmlFor="staff-priority" className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider">Priority</label>
                <select
                  id="staff-priority"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as IssuePriority | '')}
                  className="input-field text-sm py-2"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}

          {/* Result count */}
          {(hasFilters || filtered.length !== issues.length) && (
            <p className="text-xs text-benne-brown-muted">
              {filtered.length === issues.length
                ? `${issues.length} issue${issues.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${issues.length} issues`}
            </p>
          )}
        </div>

        {/* ── Issues List ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="card text-center py-14 w-full">
            <AlertCircle className="mx-auto h-12 w-12 text-benne-brown-muted/25 mb-4" />
            <h3 className="text-lg font-medium text-benne-brown mb-2">
              {hasFilters ? 'No issues match your filters' : 'No issues reported yet'}
            </h3>
            <p className="text-benne-brown-muted mb-6 text-sm">
              {hasFilters
                ? 'Try adjusting your search or filters'
                : 'Report any operational issues that need attention'}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="btn-secondary">
                Clear Filters
              </button>
            ) : (
              <button onClick={() => navigate('/issues/new')} className="btn-primary">
                Report an Issue
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {filtered.map((issue) => (
              <div
                key={issue.id}
                className="card hover:border-benne-gold/50 hover:shadow-md transition-all cursor-pointer p-4 group"
                onClick={() => navigate(`/issues/${issue.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: title + description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-benne-brown group-hover:text-benne-gold transition-colors mb-1 line-clamp-1">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-benne-brown-muted line-clamp-2 mb-2">
                      {issue.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-benne-brown-muted">
                      <span className="capitalize">{issue.category}</span>
                      <span>•</span>
                      <span>
                        Reported {new Date(issue.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {issue.due_date && (
                        <>
                          <span>•</span>
                          <span>
                            Due {new Date(issue.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: badges */}
                  <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
                    <div className="flex gap-2">
                      <PriorityBadge priority={issue.priority} />
                      <StatusBadge status={issue.status} />
                    </div>
                    {issue.due_date && (
                      <OverdueBadge dueDate={issue.due_date} status={issue.status} size="sm" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
