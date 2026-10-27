import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import PhotoUpload from '../components/PhotoUpload';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import type { IssueCategory, IssuePriority } from '../types/database';

// ─── Priority → default due date offset (hours) ────────────────────────────
const PRIORITY_DUE_HOURS: Record<IssuePriority, number> = {
  high: 4,
  medium: 24,
  low: 72,
};

const PRIORITY_META: Record<IssuePriority, { label: string; color: string; desc: string }> = {
  high: {
    label: 'High',
    color: 'text-red-700 bg-red-50 border-red-200',
    desc: 'Requires immediate attention — default due in 4 hours',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    desc: 'Should be addressed soon — default due in 24 hours',
  },
  low: {
    label: 'Low',
    color: 'text-green-700 bg-green-50 border-green-200',
    desc: 'Can wait — default due in 72 hours',
  },
};

function getDefaultDueDate(priority: IssuePriority): string {
  const hours = PRIORITY_DUE_HOURS[priority];
  const due = new Date(Date.now() + hours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T${pad(due.getHours())}:${pad(due.getMinutes())}`;
}

export default function NewIssue() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('maintenance');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [outletId, setOutletId] = useState('');
  const [dueDate, setDueDate] = useState<string>(getDefaultDueDate('medium'));
  const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { uploadPhotos, uploading: uploadingPhotos, error: uploadError } = usePhotoUpload();

  const isManager = profile?.role === 'operations_manager';
  const isStaff = profile?.role === 'outlet_staff';
  const priorityMeta = PRIORITY_META[priority];

  useEffect(() => {
    if (isStaff && profile.outlet_id) {
      setOutletId(profile.outlet_id);
    }
    if (isManager) {
      loadOutlets();
    }
  }, [profile, isStaff, isManager]);

  function handlePriorityChange(newPriority: IssuePriority) {
    setPriority(newPriority);
    setDueDate(getDefaultDueDate(newPriority));
  }

  async function loadOutlets() {
    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setOutlets(data || []);
    } catch (err) {
      console.error('Error loading outlets:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalOutletId = isStaff ? profile?.outlet_id : outletId;
    if (!finalOutletId) {
      setError('Please select an outlet');
      setLoading(false);
      return;
    }

    try {
      const newIssue: any = {
        title,
        description,
        category,
        priority,
        outlet_id: finalOutletId,
        reported_by: user!.id,
        status: 'open',
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      // Create the issue first so we get an ID for the storage path
      const { data: insertedIssueRaw, error: insertError } = await supabase
        .from('issues')
        .insert(newIssue)
        .select('id')
        .single();
      const insertedIssue = insertedIssueRaw as { id: string } | null;

      if (insertError) throw insertError;

      // Upload any pending photos after the issue is created
      if (pendingPhotos.length > 0 && insertedIssue?.id) {
        await uploadPhotos(insertedIssue.id, pendingPhotos, user!.id);
        // Upload errors are non-blocking — the issue was already created successfully
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-benne-brown-muted hover:text-benne-brown mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="card">
          <div className="border-b border-benne-border pb-5 mb-6">
            <h1 className="text-2xl font-serif text-benne-brown mb-1">Report an Issue</h1>
            <p className="text-sm text-benne-brown-muted">
              Fill in the details below. A due date will be auto-set based on priority.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">Issue reported successfully! Redirecting to dashboard…</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-benne-brown mb-1.5">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Brief, clear description of the issue"
                required
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-benne-brown mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[120px] resize-y"
                placeholder="Provide detailed information: what happened, where, when, impact…"
                required
              />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Outlet (manager only) */}
              {isManager && (
                <div className="sm:col-span-2">
                  <label htmlFor="outlet" className="block text-sm font-medium text-benne-brown mb-1.5">
                    Outlet <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="outlet"
                    value={outletId}
                    onChange={(e) => setOutletId(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select an outlet…</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-benne-brown mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="input-field"
                  required
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="equipment">Equipment</option>
                  <option value="inventory">Inventory</option>
                  <option value="quality">Quality</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-benne-brown mb-1.5">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => handlePriorityChange(e.target.value as IssuePriority)}
                  className="input-field"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <p className={`mt-2 text-xs px-2.5 py-1.5 rounded-md border flex items-start gap-1.5 ${priorityMeta.color}`}>
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  {priorityMeta.desc}
                </p>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-benne-brown mb-1.5 flex items-center gap-1.5">
                <Calendar size={15} />
                Due Date
                <span className="text-xs font-normal text-benne-brown-muted ml-1">(auto-set from priority)</span>
              </label>
              <input
                id="due_date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
              <p className="mt-1.5 text-xs text-benne-brown-muted">
                You can adjust the due date. If left blank, the system will set it automatically based on priority.
              </p>
            </div>

            {/* Photo Attachments */}
            <div>
              <label className="block text-sm font-medium text-benne-brown mb-2">
                Photos
                <span className="text-xs font-normal text-benne-brown-muted ml-2">(optional)</span>
              </label>
              <PhotoUpload
                onPhotosChange={setPendingPhotos}
                maxFiles={5}
                maxSizeMB={10}
              />
              {uploadError && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-start gap-1.5">
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  Photos could not be uploaded — but the issue was still created. You can add them from the issue details page.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-benne-border">
              <button
                type="submit"
                disabled={loading || uploadingPhotos || success}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading || uploadingPhotos ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadingPhotos ? 'Uploading photos…' : 'Submitting…'}
                  </>
                ) : (
                  'Submit Issue'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
                disabled={loading || uploadingPhotos}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
