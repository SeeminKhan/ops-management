import { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  UserMinus,
  Calendar,
  FileText,
  Paperclip,
  PaperclipIcon,
  Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ActivityType } from '../types/database';

interface ActivityItem {
  id: string;
  issue_id: string;
  activity_type: ActivityType;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor_name: string | null;
  actor_role: string | null;
}

interface ActivityFeedProps {
  issueId: string;
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'created':
      return <Plus size={14} className="text-green-600" />;
    case 'status_changed':
      return <CheckCircle2 size={14} className="text-blue-600" />;
    case 'priority_changed':
      return <AlertTriangle size={14} className="text-amber-600" />;
    case 'assigned':
      return <User size={14} className="text-purple-600" />;
    case 'unassigned':
      return <UserMinus size={14} className="text-gray-500" />;
    case 'due_date_changed':
      return <Calendar size={14} className="text-orange-500" />;
    case 'resolution_added':
    case 'resolution_updated':
      return <FileText size={14} className="text-teal-600" />;
    case 'attachment_added':
      return <Paperclip size={14} className="text-indigo-500" />;
    case 'attachment_removed':
      return <PaperclipIcon size={14} className="text-red-500" />;
    default:
      return <Clock size={14} className="text-benne-brown-muted" />;
  }
}

function getActivityIconBg(type: ActivityType): string {
  switch (type) {
    case 'created':
      return 'bg-green-100 border-green-200';
    case 'status_changed':
      return 'bg-blue-100 border-blue-200';
    case 'priority_changed':
      return 'bg-amber-100 border-amber-200';
    case 'assigned':
      return 'bg-purple-100 border-purple-200';
    case 'unassigned':
      return 'bg-gray-100 border-gray-200';
    case 'due_date_changed':
      return 'bg-orange-100 border-orange-200';
    case 'resolution_added':
    case 'resolution_updated':
      return 'bg-teal-100 border-teal-200';
    case 'attachment_added':
      return 'bg-indigo-100 border-indigo-200';
    case 'attachment_removed':
      return 'bg-red-100 border-red-200';
    default:
      return 'bg-benne-cream border-benne-border';
  }
}

function formatActivityText(item: ActivityItem): string {
  const actor = item.actor_name || 'System';
  switch (item.activity_type) {
    case 'created':
      return `${actor} created this issue`;
    case 'status_changed':
      return `${actor} changed status from "${item.old_value}" to "${item.new_value}"`;
    case 'priority_changed':
      return `${actor} changed priority from "${item.old_value}" to "${item.new_value}"`;
    case 'assigned':
      return `${actor} assigned this issue`;
    case 'unassigned':
      return `${actor} unassigned this issue`;
    case 'due_date_changed': {
      const oldDate = item.old_value && item.old_value !== 'none'
        ? new Date(item.old_value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'none';
      const newDate = item.new_value && item.new_value !== 'none'
        ? new Date(item.new_value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'none';
      return `${actor} changed due date from ${oldDate} to ${newDate}`;
    }
    case 'resolution_added':
      return `${actor} added resolution notes`;
    case 'resolution_updated':
      return `${actor} updated resolution notes`;
    case 'attachment_added':
      return `${actor} added attachment: ${item.new_value || 'file'}`;
    case 'attachment_removed':
      return `${actor} removed attachment: ${item.old_value || 'file'}`;
    default:
      return `${actor} updated this issue`;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActivityFeed({ issueId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadActivity();
  }, [issueId]);

  async function loadActivity() {
    try {
      setLoading(true);
      // Query issue_activity joined with profiles for actor name
      const { data, error: fetchError } = await supabase
        .from('issue_activity')
        .select(`
          id,
          issue_id,
          activity_type,
          old_value,
          new_value,
          created_at,
          actor:profiles!issue_activity_actor_id_fkey (full_name, role)
        `)
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Normalize the join data
      const normalized: ActivityItem[] = (data || []).map((row: any) => ({
        id: row.id,
        issue_id: row.issue_id,
        activity_type: row.activity_type as ActivityType,
        old_value: row.old_value,
        new_value: row.new_value,
        created_at: row.created_at,
        actor_name: row.actor?.full_name ?? null,
        actor_role: row.actor?.role ?? null,
      }));

      setActivities(normalized);
    } catch (err: any) {
      console.error('Error loading activity:', err);
      setError('Failed to load activity history');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-benne-cream border border-benne-border flex-shrink-0" />
            <div className="flex-1 space-y-1.5 py-1">
              <div className="h-3 bg-benne-cream rounded w-3/4" />
              <div className="h-2.5 bg-benne-cream rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">{error}</p>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-benne-brown-muted italic">No activity recorded yet.</p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line connecting activities */}
      <div className="absolute left-3.5 top-4 bottom-4 w-px bg-benne-border" aria-hidden="true" />

      <ul className="space-y-4">
        {activities.map((item, idx) => (
          <li key={item.id} className="relative flex gap-3">
            {/* Icon */}
            <div
              className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center ${getActivityIconBg(item.activity_type)}`}
            >
              {getActivityIcon(item.activity_type)}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 pb-4 ${idx === activities.length - 1 ? 'pb-0' : ''}`}>
              <p className="text-sm text-benne-brown leading-snug break-words">
                {formatActivityText(item)}
              </p>
              <p
                className="mt-0.5 text-xs text-benne-brown-muted"
                title={new Date(item.created_at).toLocaleString()}
              >
                {formatTimeAgo(item.created_at)}
                {item.actor_role && (
                  <span className="ml-1.5 capitalize opacity-60">· {item.actor_role.replace('_', ' ')}</span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
