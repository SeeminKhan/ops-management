import { useEffect, useState, useCallback } from 'react';
import { Paperclip, Trash2, Download, ZoomIn, X, Loader2, FileImage } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type Attachment = Database['public']['Tables']['issue_attachments']['Row'];

const BUCKET = 'issue-attachments';

interface AttachmentGalleryProps {
  issueId: string;
  canDelete?: boolean;
  refreshKey?: number; // increment to trigger re-fetch
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

interface LightboxProps {
  url: string;
  name: string;
  onClose: () => void;
}

function Lightbox({ url, name, onClose }: LightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={url}
          alt={name}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-benne-brown flex items-center justify-center shadow-lg hover:bg-benne-cream transition-colors"
        >
          <X size={16} />
        </button>
        <p className="mt-2 text-center text-white/70 text-sm truncate">{name}</p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AttachmentGallery({ issueId, canDelete = false, refreshKey = 0 }: AttachmentGalleryProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const { user } = useAuth();

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('issue_attachments')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = (data || []) as Attachment[];
      setAttachments(rows);

      // Generate signed URLs for all attachments
      if (rows.length > 0) {
        const urlMap: Record<string, string> = {};
        await Promise.all(
          rows.map(async (att) => {
            const { data: urlData } = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(att.file_path, 3600); // 1-hour expiry
            if (urlData?.signedUrl) urlMap[att.id] = urlData.signedUrl;
          })
        );
        setSignedUrls(urlMap);
      }
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments, refreshKey]);

  async function deleteAttachment(att: Attachment) {
    if (!window.confirm(`Delete "${att.file_name}"?`)) return;
    setDeleting(att.id);
    try {
      // Delete from storage
      await supabase.storage.from(BUCKET).remove([att.file_path]);
      // Delete from DB (trigger will log activity)
      await supabase.from('issue_attachments').delete().eq('id', att.id);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      setSignedUrls((prev) => {
        const next = { ...prev };
        delete next[att.id];
        return next;
      });
    } catch (err) {
      console.error('Error deleting attachment:', err);
    } finally {
      setDeleting(null);
    }
  }

  function canDeleteAttachment(att: Attachment): boolean {
    if (!canDelete || !user) return false;
    return att.uploaded_by === user.id;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-benne-brown-muted text-sm">
        <Loader2 size={14} className="animate-spin" />
        Loading attachments…
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-benne-brown-muted text-sm italic">
        <Paperclip size={14} />
        No attachments yet.
      </div>
    );
  }

  const images = attachments.filter((a) => a.content_type.startsWith('image/'));
  const others = attachments.filter((a) => !a.content_type.startsWith('image/'));

  return (
    <>
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {images.map((att) => {
            const url = signedUrls[att.id];
            const isDeleting = deleting === att.id;
            return (
              <div
                key={att.id}
                className="relative group aspect-square rounded-lg overflow-hidden border border-benne-border bg-benne-cream"
              >
                {url ? (
                  <img
                    src={url}
                    alt={att.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage size={24} className="text-benne-brown-muted" />
                  </div>
                )}

                {/* Hover actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {url && (
                    <button
                      onClick={() => setLightbox({ url, name: att.file_name })}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      title="View full size"
                    >
                      <ZoomIn size={14} className="text-benne-brown" />
                    </button>
                  )}
                  {url && (
                    <a
                      href={url}
                      download={att.file_name}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      title="Download"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={14} className="text-benne-brown" />
                    </a>
                  )}
                  {canDeleteAttachment(att) && (
                    <button
                      onClick={() => deleteAttachment(att)}
                      disabled={isDeleting}
                      className="w-8 h-8 rounded-full bg-red-50/90 flex items-center justify-center hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin text-red-600" /> : <Trash2 size={14} className="text-red-600" />}
                    </button>
                  )}
                </div>

                {/* Name tooltip */}
                <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {att.file_name} · {formatBytes(att.file_size)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Non-image files list */}
      {others.length > 0 && (
        <ul className="space-y-2">
          {others.map((att) => {
            const url = signedUrls[att.id];
            const isDeleting = deleting === att.id;
            return (
              <li
                key={att.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-benne-border bg-benne-cream/50 hover:bg-benne-cream transition-colors"
              >
                <Paperclip size={15} className="text-benne-brown-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-benne-brown truncate">{att.file_name}</p>
                  <p className="text-xs text-benne-brown-muted">{formatBytes(att.file_size)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {url && (
                    <a
                      href={url}
                      download={att.file_name}
                      className="p-1.5 text-benne-brown-muted hover:text-benne-gold transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                  )}
                  {canDeleteAttachment(att) && (
                    <button
                      onClick={() => deleteAttachment(att)}
                      disabled={isDeleting}
                      className="p-1.5 text-benne-brown-muted hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox url={lightbox.url} name={lightbox.name} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
