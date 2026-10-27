import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardMetrics {
  totalOpen: number;
  highPriority: number;
  overdue: number;
  inProgress: number;
  resolvedThisWeek: number;
  resolutionRate: number;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOpen: 0,
    highPriority: 0,
    overdue: 0,
    inProgress: 0,
    resolvedThisWeek: 0,
    resolutionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);
      setError(null);

      // Get all issues data in one query
      const { data: issuesRaw, error: issuesError } = await supabase
        .from('issues')
        .select('id, status, priority, due_date, resolved_at, created_at');

      if (issuesError) throw issuesError;

      const issues = issuesRaw as Array<{
        id: string;
        status: string;
        priority: string;
        due_date: string | null;
        resolved_at: string | null;
        created_at: string;
      }> | null;
      if (!issues) {
        setMetrics({
          totalOpen: 0,
          highPriority: 0,
          overdue: 0,
          inProgress: 0,
          resolvedThisWeek: 0,
          resolutionRate: 0,
        });
        return;
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate metrics
      const totalOpen = issues.filter(i => i.status === 'open').length;
      
      const highPriority = issues.filter(
        i => i.priority === 'high' && i.status !== 'resolved'
      ).length;
      
      const overdue = issues.filter(i => {
        if (i.status === 'resolved' || !i.due_date) return false;
        return new Date(i.due_date) < now;
      }).length;
      
      const inProgress = issues.filter(i => i.status === 'in_progress').length;
      
      const resolvedThisWeek = issues.filter(i => {
        if (!i.resolved_at) return false;
        return new Date(i.resolved_at) >= oneWeekAgo;
      }).length;

      // Calculate resolution rate (resolved in last 30 days / created in last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const createdLastMonth = issues.filter(i => new Date(i.created_at) >= thirtyDaysAgo).length;
      const resolvedLastMonth = issues.filter(i => {
        if (!i.resolved_at) return false;
        return new Date(i.resolved_at) >= thirtyDaysAgo;
      }).length;
      
      const resolutionRate = createdLastMonth > 0 
        ? Math.round((resolvedLastMonth / createdLastMonth) * 100)
        : 0;

      setMetrics({
        totalOpen,
        highPriority,
        overdue,
        inProgress,
        resolvedThisWeek,
        resolutionRate,
      });
    } catch (err: any) {
      console.error('Error loading metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }

  return { metrics, loading, error, refresh: loadMetrics };
}
