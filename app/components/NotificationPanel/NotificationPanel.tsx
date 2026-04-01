"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  CalendarCheck,
  Clock,
  AlarmClock,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import "./NotificationPanel.css";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
export type NotificationType =
  | "schedule"
  | "reminder"
  | "daily_plan"
  | "action";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
};

/* ──────────────────────────────────────────
   Helpers
   ────────────────────────────────────────── */
function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "今";
  if (mins < 60) return `${mins}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; colorClass: string }
> = {
  schedule: { icon: CalendarCheck, colorClass: "notif-type-schedule" },
  reminder: { icon: AlarmClock, colorClass: "notif-type-reminder" },
  daily_plan: { icon: Clock, colorClass: "notif-type-daily" },
  action: { icon: Sparkles, colorClass: "notif-type-action" },
};

/* ──────────────────────────────────────────
   API functions
   ────────────────────────────────────────── */
async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.notifications ?? [];
}

async function markAsRead(id: string): Promise<void> {
  await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

async function markAllAsRead(): Promise<void> {
  await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  });
}

async function deleteNotif(id: string): Promise<void> {
  await fetch("/api/notifications/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

async function deleteAllReadNotifs(): Promise<void> {
  await fetch("/api/notifications/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ readAll: true }),
  });
}

/* ──────────────────────────────────────────
   Notification Item
   ────────────────────────────────────────── */
function NotificationItem({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.schedule;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
    if (notif.link) window.location.href = notif.link;
  };

  return (
    <div
      className={`notif-item${notif.isRead ? " is-read" : " is-unread"}${notif.link ? " has-link" : ""}`}
      onClick={handleClick}
    >
      {!notif.isRead && <div className="notif-unread-dot" />}

      <div className={`notif-icon ${cfg.colorClass}`}>
        <Icon size={14} />
      </div>

      <div className="notif-content">
        <div className="notif-header-row">
          <span className="notif-title">{notif.title}</span>
          <span className="notif-time">
            {formatRelativeTime(notif.createdAt)}
          </span>
        </div>
        <p className="notif-body">{notif.body}</p>
        {notif.link && (
          <span className="notif-link-hint">
            確認する <ChevronRight size={11} />
          </span>
        )}
      </div>

      <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
        {!notif.isRead && (
          <button
            className="notif-action-btn"
            title="既読にする"
            onClick={(e) => {
              e.stopPropagation();
              onRead(notif.id);
            }}
          >
            <Check size={13} />
          </button>
        )}
        <button
          className="notif-action-btn notif-action-delete"
          title="削除"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.id);
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Bell Button
   ────────────────────────────────────────── */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── 通知取得 ──
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回マウント時に取得
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // パネルを開いたときに再取得
  useEffect(() => {
    if (isOpen) loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 30秒ごとにバックグラウンドポーリング（バッジ更新用）
  useEffect(() => {
    if (isOpen) return;
    const timer = setInterval(async () => {
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch {
        /* silent */
      }
    }, 30_000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // パネル外クリックで閉じる
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  // Escキー
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  // ── 楽観的更新 + API ──
  const handleRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await markAsRead(id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      const next = prev.filter((n) => n.id !== id);
      deleteNotif(id).catch(() => {
        if (target) setNotifications((p) => [target, ...p]);
      });
      return next;
    });
  }, []);

  const handleReadAll = useCallback(async () => {
    const snapshot = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllAsRead();
    } catch {
      setNotifications(snapshot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const handleDeleteAllRead = useCallback(async () => {
    const snapshot = notifications;
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await deleteAllReadNotifs();
    } catch {
      setNotifications(snapshot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const displayed =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const hasRead = notifications.some((n) => n.isRead);

  return (
    <div className="notif-bell-wrapper" ref={panelRef}>
      {/* ── Bell Button ── */}
      <button
        className={`notif-bell-btn${isOpen ? " is-active" : ""}`}
        onClick={() => setIsOpen((p) => !p)}
        title="通知"
        aria-label={`通知 ${unreadCount}件未読`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {isOpen && (
        <>
          <div className="notif-backdrop" onClick={() => setIsOpen(false)} />

          <div className="notif-panel animate-notif-in">
            {/* Header */}
            <div className="notif-panel-header">
              <div className="notif-panel-title-row">
                <h2 className="notif-panel-title">通知</h2>
                {unreadCount > 0 && (
                  <span className="notif-panel-count">{unreadCount}件未読</span>
                )}
              </div>
              <div className="notif-panel-header-actions">
                {unreadCount > 0 && (
                  <button className="notif-header-btn" onClick={handleReadAll}>
                    <CheckCheck size={13} />
                    すべて既読
                  </button>
                )}
                <button
                  className="notif-close-btn"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="notif-tabs">
              <button
                className={`notif-tab${activeTab === "all" ? " active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                すべて
                <span className="notif-tab-count">{notifications.length}</span>
              </button>
              <button
                className={`notif-tab${activeTab === "unread" ? " active" : ""}`}
                onClick={() => setActiveTab("unread")}
              >
                未読
                {unreadCount > 0 && (
                  <span className="notif-tab-count notif-tab-count-unread">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* List */}
            <div className="notif-list">
              {loading ? (
                <div className="notif-loading">
                  <Loader2 size={20} className="notif-spinner" />
                  <span>通知を取得中...</span>
                </div>
              ) : error ? (
                <div className="notif-error">
                  <AlertCircle size={16} />
                  <span>取得に失敗しました</span>
                  <button
                    className="notif-retry-btn"
                    onClick={loadNotifications}
                  >
                    再試行
                  </button>
                </div>
              ) : displayed.length === 0 ? (
                <div className="notif-empty">
                  <div className="notif-empty-icon">
                    <Bell size={22} />
                  </div>
                  <p className="notif-empty-title">
                    {activeTab === "unread"
                      ? "未読通知はありません"
                      : "通知はありません"}
                  </p>
                  <p className="notif-empty-desc">
                    期限アラートや週次サマリがここに届きます
                  </p>
                </div>
              ) : (
                displayed.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onRead={handleRead}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {hasRead && !loading && (
              <div className="notif-panel-footer">
                <button
                  className="notif-footer-btn"
                  onClick={handleDeleteAllRead}
                >
                  <Trash2 size={12} />
                  既読をすべて削除
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
