import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Tag,
  Activity,
  ChevronDown,
  Save,
  Paperclip,
  Upload,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AttachmentGallery from '../components/AttachmentGallery';
import PhotoUpload from '../components/PhotoUpload';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import OverdueBadge from '../components/OverdueBadge';
import ActivityFeed from '../components/ActivityFeed';
import type { Database, IssueStatus, IssuePriority } from '../types/database';

type Issue = Database['public']['Tables']['issues']['Row'] & {
  outlets: { name: string } | null;
  reporter: { full_name: string } | null;
  assigned_profile: { full_name: string } | null;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

// ─── Utility helpers ────────────────────────────────────────────────────────

function formatDateTime(dateStr: string | null, fallback = '—'): string {
  if (!dateStr) return fallback;
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return '';
  // datetime-local input needs format: YYYY-MM-DDTHH:mm
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDueDateStatus(issue: Issue): 'overdue' | 'due-soon' | 'ok' | 'none' {
  if (!issue.due_date || issue.status === 'resolved') return 'none';
  const now = new Date();
  const due = new Date(issue.due_date);
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 0) return 'overdue';
  if (diffHours <= 2) return 'due-soon';
  return 'ok';
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetaItem({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-benne-cream border border-benne-border flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-benne-brown-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-benne-brown-muted uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-benne-brown font-medium">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={16} className="text-benne-gold" />}
        <h2 className="text-sm font-semibold text-benne-brown uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function IssueDetails() {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showActivity, setShowActivity] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const [attachmentRefreshKey, setAttachmentRefreshKey] = useState(0);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Local editable state for resolution note (controlled textarea)
  const [resolutionNote, setResolutionNote] = useState('');
  const resolutionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const isManager = profile?.role === 'operations_manager';
  const { uploadPhotos } = usePhotoUpload();

  async function handleUploadPhotos() {
    if (!issue || !user || pendingPhotos.length === 0) return;
    setUploadingPhotos(true);
    try {
      await uploadPhotos(issue.id, pendingPhotos, user.id);
      setPendingPhotos([]);
      setAttachmentRefreshKey((k) => k + 1);
      setSuccessMsg('Photos uploaded successfully');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingPhotos(false);
    }
  }

  useEffect(() => {
    loadIssue();
    if (isManager) loadManagers();
  }, [id, isManager]);

  useEffect(() => {
    if (issue) setResolutionNote(issue.resolution_note || '');
  }, [issue?.resolution_note]);

  async function loadIssue() {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          outlets (name),
          reporter:profiles!issues_reported_by_fkey (full_name),
          assigned_profile:profiles!issues_assigned_to_fkey (full_name)
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      setIssue(data as unknown as Issue);
    } catch (err) {
      console.error('Error loading issue:', err);
      setError('Failed to load issue');
    } finally {
      setLoading(false);
    }
  }

  async function loadManagers() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'operations_manager')
        .order('full_name');
      setManagers(data || []);
    } catch (err) {
      console.error('Error loading managers:', err);
    }
  }

  async function updateIssue(updates: Record<string, any>) {
    if (!isManager || !issue) return;
    setUpdating(true);
    setError('');
    try {
      const { error } = await supabase
        .from('issues')
        // @ts-ignore
        .update(updates)
        .eq('id', issue.id);
      if (error) throw error;
      setSuccessMsg('Saved');
      setTimeout(() => setSuccessMsg(''), 2000);
      await loadIssue();
    } catch (err: any) {
      setError(err.message || 'Failed to update issue');
    } finally {
      setUpdating(false);
    }
  }

  // Debounced auto-save for resolution note
  function handleResolutionChange(value: string) {
    setResolutionNote(value);
    if (resolutionSaveTimer.current) clearTimeout(resolutionSaveTimer.current);
    resolutionSaveTimer.current = setTimeout(() => {
      updateIssue({ resolution_note: value || null });
    }, 1200);
  }

  async function saveResolutionNow() {
    if (resolutionSaveTimer.current) clearTimeout(resolutionSaveTimer.current);
    await updateIssue({ resolution_note: resolutionNote || null });
  }

  // ── Loading & error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-benne-cream rounded w-24" />
            <div className="card space-y-4">
              <div className="h-8 bg-benne-cream rounded w-2/3" />
              <div className="h-4 bg-benne-cream rounded w-1/3" />
              <div className="h-20 bg-benne-cream rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!issue) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-benne-brown-muted/30 mb-4" />
          <p className="text-benne-brown-muted mb-4">Issue not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const dueDateStatus = getDueDateStatus(issue);

  // Due date display style
  const dueDateClasses: Record<string, string> = {
    overdue: 'text-red-700 font-semibold',
    'due-soon': 'text-amber-700 font-semibold',
    ok: 'text-benne-brown',
    none: 'text-benne-brown-muted italic',
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Back button ──────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-benne-brown-muted hover:text-benne-brown mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* ── Error / Success banners ─────────────────────────────── */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">{successMsg}</p>
          </div>
        )}

        {/* ── Layout: main content + sidebar ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left / Main column ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Issue header card */}
            <div className="card">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mb-4">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-benne-cream text-benne-brown border border-benne-border capitalize">
                  <Tag size={11} className="mr-1" />
                  {issue.category}
                </span>
                {issue.due_date && (
                  <OverdueBadge dueDate={issue.due_date} status={issue.status} size="sm" />
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-serif text-benne-brown mb-2 leading-snug">{issue.title}</h1>

              {/* Subtitle */}
              <p className="text-sm text-benne-brown-muted flex flex-wrap items-center gap-x-3 gap-y-1 mb-6">
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {issue.outlets?.name || 'Unknown outlet'}
                </span>
                <span className="text-benne-border">•</span>
                <span className="flex items-center gap-1">
                  <User size={13} />
                  Reported by {issue.reporter?.full_name || 'Unknown'}
                </span>
                <span className="text-benne-border">•</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {formatDateTime(issue.created_at)}
                </span>
              </p>

              {/* Description */}
              <Section title="Description">
                <p className="text-benne-brown-muted whitespace-pre-wrap leading-relaxed text-sm">
                  {issue.description}
                </p>
              </Section>

              {/* Resolution notes (read-only for staff) */}
              {!isManager && issue.resolution_note && (
                <div className="mt-6 pt-6 border-t border-benne-border">
                  <Section title="Resolution Notes" icon={CheckCircle2}>
                    <p className="text-benne-brown-muted whitespace-pre-wrap leading-relaxed text-sm">
                      {issue.resolution_note}
                    </p>
                    {issue.resolved_at && (
                      <p className="mt-2 text-xs text-benne-brown-muted flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-green-600" />
                        Resolved on {formatDateTime(issue.resolved_at)}
                      </p>
                    )}
                  </Section>
                </div>
              )}
            </div>

            {/* Manager controls card */}
            {isManager && (
              <div className="card">
                <Section title="Management Controls">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-xs font-semibold text-benne-brown-muted uppercase tracking-wider mb-1.5">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          id="status"
                          value={issue.status}
                          onChange={(e) => updateIssue({ status: e.target.value as IssueStatus })}
                          disabled={updating}
                          className="input-field pr-9 appearance-none"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-benne-brown-muted pointer-events-none" />
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label htmlFor="priority" className="block text-xs font-semibold text-benne-brown-muted uppercase tracking-wider mb-1.5">
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          id="priority"
                          value={issue.priority}
                          onChange={(e) => updateIssue({ priority: e.target.value as IssuePriority })}
                          disabled={updating}
                          className="input-field pr-9 appearance-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-benne-brown-muted pointer-events-none" />
                      </div>
                    </div>

                    {/* Assigned To */}
                    <div>
                      <label htmlFor="assigned" className="block text-xs font-semibold text-benne-brown-muted uppercase tracking-wider mb-1.5">
                        Assigned To
                      </label>
                      <div className="relative">
                        <select
                          id="assigned"
                          value={issue.assigned_to || ''}
                          onChange={(e) => updateIssue({ assigned_to: e.target.value || null })}
                          disabled={updating}
                          className="input-field pr-9 appearance-none"
                        >
                          <option value="">Unassigned</option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.full_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-benne-brown-muted pointer-events-none" />
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label htmlFor="due_date" className="block text-xs font-semibold text-benne-brown-muted uppercase tracking-wider mb-1.5">
                        Due Date
                      </label>
                      <input
                        id="due_date"
                        type="datetime-local"
                        defaultValue={formatDateForInput(issue.due_date)}
                        onBlur={(e) => {
                          const val = e.target.value;
                          updateIssue({ due_date: val ? new Date(val).toISOString() : null });
                        }}
                        disabled={updating}
                        className="input-field"
                      />
                      {dueDateStatus === 'overdue' && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle size={11} /> This issue is overdue
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Resolution Notes (full width) */}
                  <div className="mt-5">
                    <label htmlFor="resolution" className="block text-xs font-semibold text-benne-brown-muted uppercase tracking-wider mb-1.5">
                      Resolution Notes
                    </label>
                    <textarea
                      id="resolution"
                      value={resolutionNote}
                      onChange={(e) => handleResolutionChange(e.target.value)}
                      disabled={updating}
                      className="input-field min-h-[110px] resize-y"
                      placeholder="Add notes about how this issue was / will be resolved…"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-benne-brown-muted">Auto-saves after typing stops</p>
                      <button
                        type="button"
                        onClick={saveResolutionNow}
                        disabled={updating}
                        className="flex items-center gap-1.5 text-xs text-benne-gold hover:text-benne-gold-dark font-medium disabled:opacity-50 transition-colors"
                      >
                        <Save size={12} />
                        Save now
                      </button>
                    </div>
                  </div>

                  {/* Resolved At info */}
                  {issue.resolved_at && (
                    <div className="mt-4 pt-4 border-t border-benne-border">
                      <p className="text-xs text-benne-brown-muted flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-green-600" />
                        Marked resolved on{' '}
                        <span className="font-medium text-benne-brown">{formatDateTime(issue.resolved_at)}</span>
                      </p>
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* Attachments card */}
            <div className="card">
              <button
                className="w-full flex items-center justify-between mb-4"
                onClick={() => setShowAttachments((v) => !v)}
                aria-expanded={showAttachments}
              >
                <div className="flex items-center gap-2">
                  <Paperclip size={16} className="text-benne-gold" />
                  <h2 className="text-sm font-semibold text-benne-brown uppercase tracking-wider">
                    Attachments
                  </h2>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-benne-brown-muted transition-transform ${showAttachments ? 'rotate-180' : ''}`}
                />
              </button>

              {showAttachments && (
                <div className="space-y-4">
                  <AttachmentGallery
                    issueId={issue.id}
                    canDelete={true}
                    refreshKey={attachmentRefreshKey}
                  />

                  {/* Upload new photos */}
                  <div className="pt-4 border-t border-benne-border">
                    <p className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Upload size={12} />
                      Add Photos
                    </p>
                    <PhotoUpload
                      onPhotosChange={setPendingPhotos}
                      maxFiles={5}
                      maxSizeMB={10}
                    />
                    {pendingPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUploadPhotos}
                        disabled={uploadingPhotos}
                        className="mt-3 btn-primary text-sm py-2 flex items-center gap-2 disabled:opacity-50"
                      >
                        {uploadingPhotos ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            Upload {pendingPhotos.length} photo{pendingPhotos.length !== 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Activity feed card */}
            <div className="card">
              <button
                className="w-full flex items-center justify-between mb-4"
                onClick={() => setShowActivity((v) => !v)}
                aria-expanded={showActivity}
              >
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-benne-gold" />
                  <h2 className="text-sm font-semibold text-benne-brown uppercase tracking-wider">
                    Activity History
                  </h2>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-benne-brown-muted transition-transform ${showActivity ? 'rotate-180' : ''}`}
                />
              </button>

              {showActivity && <ActivityFeed issueId={issue.id} />}
            </div>
          </div>

          {/* ── Right / Sidebar column ──────────────────────────── */}
          <div className="space-y-5">
            {/* Issue metadata card */}
            <div className="card space-y-5">
              <h2 className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider">
                Issue Details
              </h2>

              <MetaItem icon={MapPin} label="Outlet">
                {issue.outlets?.name || 'Unknown'}
              </MetaItem>

              <MetaItem icon={User} label="Reported By">
                {issue.reporter?.full_name || 'Unknown'}
              </MetaItem>

              <MetaItem icon={User} label="Assigned To">
                {issue.assigned_profile?.full_name || (
                  <span className="text-benne-brown-muted italic font-normal">Unassigned</span>
                )}
              </MetaItem>

              <MetaItem icon={Tag} label="Category">
                <span className="capitalize">{issue.category}</span>
              </MetaItem>

              <MetaItem icon={Clock} label="Reported">
                {formatDateTime(issue.created_at)}
              </MetaItem>

              <MetaItem icon={Clock} label="Last Updated">
                {formatDateTime(issue.updated_at)}
              </MetaItem>

              <MetaItem icon={Calendar} label="Due Date">
                <span className={dueDateClasses[dueDateStatus]}>
                  {issue.due_date ? formatDateTime(issue.due_date) : '—'}
                </span>
                {issue.due_date && (
                  <div className="mt-1">
                    <OverdueBadge dueDate={issue.due_date} status={issue.status} size="sm" />
                  </div>
                )}
              </MetaItem>

              {issue.resolved_at && (
                <MetaItem icon={CheckCircle2} label="Resolved At">
                  <span className="text-green-700">{formatDateTime(issue.resolved_at)}</span>
                </MetaItem>
              )}
            </div>

            {/* Staff view: assigned + resolution info */}
            {!isManager && (
              <div className="card space-y-4">
                <h2 className="text-xs font-semibold text-benne-brown-muted uppercase tracking-wider">
                  Resolution
                </h2>
                {issue.resolution_note ? (
                  <p className="text-sm text-benne-brown-muted whitespace-pre-wrap leading-relaxed">
                    {issue.resolution_note}
                  </p>
                ) : (
                  <p className="text-sm text-benne-brown-muted italic">No resolution notes yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
