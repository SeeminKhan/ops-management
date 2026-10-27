import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  X,
  Check,
  CheckCheck,
  AlertTriangle,
  User,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { Database } from '../types/database';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationType = Notification['notification_type'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNotifIcon(type: NotificationType) {
  switch (type) {
    case 'high_priority_issue':
      return <AlertTriangle size={14} className="text-red-600" />;
    case 'issue_assigned':
      return <User size={14} className="text-purple-600" />;
    case 'issue_resolved':
      return <CheckCircle2 size={14} className="text-green-600" />;
    case 'issue_overdue':
      return <Clock size={14} className="text-orange-600" />;
    case 'issue_updated':
      return <Info size={14} className="text-blue-600" />;
    default:
      return <Bell size={14} className="text-benne-brown-muted" />;
  }
}

function getNotifIconBg(type: NotificationType): string {
  switch (type) {
    case 'high_priority_issue':  return 'bg-red-100';
    case 'issue_assigned':       return 'bg-purple-100';
    case 'issue_resolved':       return 'bg-green-100';
    case 'issue_overdue':        return 'bg-orange-100';
    case 'issue_updated':        return 'bg-blue-100';
    default:                      return 'bg-benne-cream';
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ─── Notification item ────────────────────────────────────────────────────────

function NotifItem({
  notif,
  onRead,
  onNavigate,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onNavigate: (issueId: string | null) => void;
}) {
  return (
    <div
      className={`relative flex gap-3 px-4 py-3 border-b border-benne-border/50 transition-colors cursor-pointer hover:bg-benne-cream/60 ${
        !notif.is_read ? 'bg-benne-cream/40' : ''
      }`}
      onClick={() => {
        if (!notif.is_read) onRead(notif.id);
        onNavigate(notif.issue_id);
      }}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-benne-gold" />
      )}

      {/* Icon */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getNotifIconBg(notif.notification_type)}`}>
        {getNotifIcon(notif.notification_type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notif.is_read ? 'text-benne-brown-muted' : 'text-benne-brown font-medium'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-benne-brown-muted mt-0.5 line-clamp-2 leading-snug">
          {notif.message}
        </p>
        <p className="text-xs text-benne-brown-muted/60 mt-1">{timeAgo(notif.created_at)}</p>
      </div>

      {/* Mark read button */}
      {!notif.is_read && (
        <button
          onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
          className="flex-shrink-0 p-1 rounded text-benne-brown-muted hover:text-benne-gold hover:bg-benne-cream transition-colors mt-0.5"
          title="Mark as read"
        >
          <Check size={13} />
        </button>
      )}
    </div>
  );
}

// ─── Main NotificationBell ────────────────────────────────────────────────────

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handleNavigate(issueId: string | null) {
    setOpen(false);
    if (issueId) navigate(`/issues/${issueId}`);
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-md transition-colors ${
          open
            ? 'text-benne-gold bg-benne-gold/10'
            : 'text-benne-brown-muted hover:text-benne-brown hover:bg-benne-cream'
        }`}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellRing size={20} className="animate-[wiggle_0.5s_ease-in-out]" />
        ) : (
          <Bell size={20} />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-benne-border rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-benne-border bg-benne-cream/50">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-benne-brown" />
              <h3 className="text-sm font-semibold text-benne-brown">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-benne-gold hover:text-benne-gold-dark font-medium transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-benne-brown-muted hover:text-benne-brown rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 56px)' }}>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-benne-cream flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-benne-cream rounded w-3/4" />
                      <div className="h-2.5 bg-benne-cream rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto h-10 w-10 text-benne-brown-muted/20 mb-3" />
                <p className="text-sm text-benne-brown-muted">No notifications yet</p>
                <p className="text-xs text-benne-brown-muted/60 mt-1">
                  You'll be notified of high-priority issues and assignments
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onRead={markAsRead}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
