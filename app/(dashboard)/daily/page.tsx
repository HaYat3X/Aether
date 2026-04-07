"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "./main.css";
import {
  Clock,
  Coffee,
  Monitor,
  Users,
  FileText,
  BookOpen,
  Utensils,
  Zap,
  LinkIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type DailyPlanStatus = "未着手" | "進行中" | "完了" | "予定変更" | "保留";
type DailyPlanCategory =
  | "目標関連"
  | "実務・定常"
  | "プロジェクト"
  | "突発・その他"
  | "雑務";

type DailyPlanItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: DailyPlanStatus;
  category?: DailyPlanCategory | null;
  memo?: string | null;
  relatedTaskIds?: string[];
  icon: string;
  url?: string | null;
};

const ALL_STATUSES: DailyPlanStatus[] = [
  "未着手",
  "進行中",
  "完了",
  "予定変更",
  "保留",
];

/* ──────────────────────────────────────────
   Time Helpers
   ────────────────────────────────────────── */
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getNowJSTMinutes(): number {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.getUTCHours() * 60 + jst.getUTCMinutes();
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string): string {
  const today = getTodayJST();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const base = `${m}/${d}（${weekdays[date.getDay()]}）`;

  if (dateStr === today) return `${base} — 今日`;
  if (dateStr === yesterday) return `${base} — 昨日`;
  if (dateStr === tomorrow) return `${base} — 明日`;
  return base;
}

/* ──────────────────────────────────────────
   Icon / Style Helpers
   ────────────────────────────────────────── */
function getIconComponent(key: string, size = 14) {
  switch (key) {
    case "mail":
      return <Zap size={size} />;
    case "users":
      return <Users size={size} />;
    case "code":
      return <Monitor size={size} />;
    case "lunch":
      return <Utensils size={size} />;
    case "review":
      return <BookOpen size={size} />;
    case "doc":
      return <FileText size={size} />;
    case "reflect":
      return <Coffee size={size} />;
    default:
      return <Clock size={size} />;
  }
}

function getStatusBadgeClass(status: DailyPlanStatus): string {
  switch (status) {
    case "完了":
      return "badge-status-done";
    case "進行中":
      return "badge-status";
    case "予定変更":
      return "badge-status-changed";
    case "保留":
      return "badge-status-hold";
    case "未着手":
      return "badge-status-todo";
    default:
      return "badge-status-todo";
  }
}

function getCategoryCardClass(category?: DailyPlanCategory | null): string {
  if (!category) return "";
  switch (category) {
    case "目標関連":
      return "cat-goal";
    case "実務・定常":
      return "cat-routine";
    case "プロジェクト":
      return "cat-project";
    case "突発・その他":
      return "cat-adhoc";
    case "雑務":
      return "cat-misc";
    default:
      return "";
  }
}

function getCategoryBadgeClass(category?: DailyPlanCategory | null): string {
  if (!category) return "";
  switch (category) {
    case "目標関連":
      return "badge-cat-goal";
    case "実務・定常":
      return "badge-cat-routine";
    case "プロジェクト":
      return "badge-cat-project";
    case "突発・その他":
      return "badge-cat-adhoc";
    case "雑務":
      return "badge-cat-misc";
    default:
      return "";
  }
}

function isCurrent(item: DailyPlanItem): boolean {
  if (item.status === "完了") return false;
  return item.status === "進行中";
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

/* ──────────────────────────────────────────
   StatusDropdown
   ────────────────────────────────────────── */
function StatusDropdown({
  item,
  onUpdate,
  updating,
}: {
  item: DailyPlanItem;
  onUpdate: (id: string, status: DailyPlanStatus) => void;
  updating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      ref={ref}
      className="status-dropdown-wrapper"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className={`timeline-badge ${getStatusBadgeClass(item.status)} status-badge-btn${updating ? " updating" : ""}`}
        onClick={() => setOpen((p) => !p)}
        disabled={updating}
        title="ステータスを変更"
      >
        {updating ? (
          <Loader2 size={10} className="status-updating-icon" />
        ) : null}
        {item.status}
        <ChevronDown
          size={10}
          className={`status-chevron${open ? " open" : ""}`}
        />
      </button>

      {open && (
        <div className="status-dropdown">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={`status-dropdown-item${s === item.status ? " active" : ""}`}
              onClick={() => {
                setOpen(false);
                if (s !== item.status) onUpdate(item.id, s);
              }}
            >
              <span
                className={`status-dropdown-dot ${getStatusBadgeClass(s)}`}
              />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Component
   ────────────────────────────────────────── */
export default function DailyPlanPage() {
  const [date, setDate] = useState(getTodayJST);
  const [items, setItems] = useState<DailyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMinutes, setNowMinutes] = useState(getNowJSTMinutes);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMinutes(getNowJSTMinutes());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async (targetDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-plan?date=${targetDate}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      console.error("[DailyPlan] fetch error:", err);
      setError((err as Error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(date);
  }, [date, fetchData]);

  /* ── ステータス更新（楽観的） ── */
  const handleStatusUpdate = useCallback(
    async (id: string, newStatus: DailyPlanStatus) => {
      // 楽観的更新
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        ),
      );
      setUpdatingIds((prev) => new Set(prev).add(id));

      try {
        const res = await fetch("/api/daily-plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "API error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("[DailyPlan] status update error:", err);
        // ロールバック: 再フェッチで最新状態に戻す
        fetchData(date);
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [date, fetchData],
  );

  const goToday = () => setDate(getTodayJST());
  const goPrev = () => setDate((d) => addDays(d, -1));
  const goNext = () => setDate((d) => addDays(d, 1));
  const refresh = () => fetchData(date);

  const isToday = date === getTodayJST();

  return (
    <div className="stagger">
      {/* ── Date Navigation ── */}
      <div className="daily-date-nav animate-fade-up">
        <button className="daily-nav-btn" onClick={goPrev} title="前日">
          <ChevronLeft size={16} />
        </button>
        <div className="daily-date-center">
          <span className="daily-date-label">{formatDateLabel(date)}</span>
          {!isToday && (
            <button className="daily-today-btn" onClick={goToday}>
              今日へ
            </button>
          )}
        </div>
        <button className="daily-nav-btn" onClick={goNext} title="翌日">
          <ChevronRight size={16} />
        </button>

        <button className="refresh-btn" onClick={refresh} disabled={loading}>
          <RefreshCw
            size={14}
            style={loading ? { animation: "spin 1s linear infinite" } : {}}
          />
          更新
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="daily-loading animate-fade-up">
          <Loader2 size={24} className="daily-spinner" />
          <span>デイリープランを取得中...</span>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="daily-error animate-fade-up">
          <AlertCircle size={20} />
          <div>
            <div className="daily-error-title">データの取得に失敗しました</div>
            <div className="daily-error-detail">{error}</div>
          </div>
          <button className="daily-retry-btn" onClick={refresh}>
            再試行
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && items.length === 0 && (
        <div className="daily-empty animate-fade-up">
          <div className="daily-empty-icon">
            <Clock size={22} />
          </div>
          <div className="daily-empty-title">プランが未作成です</div>
          <div className="daily-empty-desc">
            AIアシスタントに「デイリープランを作って」と話しかけると、
            <br />
            今日のスケジュールとタスクから自動でプランを作成します。
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      {!loading && !error && items.length > 0 && (
        <div className="daily-timeline">
          {(() => {
            const isToday_ = date === getTodayJST();
            let nowLineRendered = false;

            const NowLineBetween = (
              <div key="now-line" className="timeline-now-line">
                <div className="timeline-now-time-col">
                  <span className="timeline-now-time">
                    {`${String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:${String(nowMinutes % 60).padStart(2, "0")}`}
                  </span>
                </div>
                <div className="timeline-now-rule" />
              </div>
            );

            const elements: React.ReactNode[] = [];

            items.forEach((item) => {
              const itemStart = item.startTime ? toMinutes(item.startTime) : 0;
              const itemEnd = item.endTime ? toMinutes(item.endTime) : 0;
              const isNowInside =
                isToday_ &&
                !nowLineRendered &&
                nowMinutes >= itemStart &&
                nowMinutes < itemEnd &&
                itemEnd > itemStart;

              if (
                isToday_ &&
                !nowLineRendered &&
                !isNowInside &&
                nowMinutes < itemStart
              ) {
                elements.push(NowLineBetween);
                nowLineRendered = true;
              }

              const nowPct = isNowInside
                ? ((nowMinutes - itemStart) / (itemEnd - itemStart)) * 100
                : -1;

              if (isNowInside) nowLineRendered = true;

              const current = isCurrent(item);
              const isDone = item.status === "完了";
              const duration = calcDuration(item.startTime, item.endTime);
              const isUpdating = updatingIds.has(item.id);

              const cardClassName = [
                current ? "is-current" : "",
                isDone ? "is-done" : "",
                getCategoryCardClass(item.category),
              ]
                .filter(Boolean)
                .join(" ");

              elements.push(
                <div key={item.id} className="timeline-item">
                  {/* Time */}
                  <div className="timeline-time-col">
                    <span className="timeline-time">{item.startTime}</span>
                    <span className="timeline-time-end">{item.endTime}</span>
                  </div>

                  {/* Dot */}
                  <div className="timeline-dot-col" />

                  {/* Card — 常に div、Notionリンクはアイコンボタンで */}
                  <div className="timeline-content">
                    <div
                      className={`timeline-card ${cardClassName}`}
                      style={{ position: "relative" }}
                    >
                      {/* Now indicator overlay */}
                      {nowPct >= 0 && (
                        <div
                          className="timeline-now-overlay"
                          style={{ top: `${nowPct}%` }}
                        >
                          <div className="timeline-now-overlay-dot" />
                          <div className="timeline-now-overlay-line" />
                        </div>
                      )}

                      {/* Header */}
                      <div className="timeline-card-header">
                        <span className="timeline-card-icon">
                          {getIconComponent(item.icon)}
                        </span>
                        <span className="timeline-card-title">
                          {item.title}
                        </span>

                        {/* Notionリンクボタン */}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="timeline-notion-link"
                            title="Notionで開く"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {/* ステータスドロップダウン */}
                        <StatusDropdown
                          item={item}
                          onUpdate={handleStatusUpdate}
                          updating={isUpdating}
                        />

                        {duration && (
                          <span className="timeline-badge badge-task">
                            {duration}
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="timeline-card-meta">
                        {item.category && (
                          <span
                            className={`timeline-badge ${getCategoryBadgeClass(item.category)}`}
                          >
                            {item.category}
                          </span>
                        )}
                        {item.relatedTaskIds &&
                          item.relatedTaskIds.length > 0 && (
                            <span className="timeline-badge badge-task">
                              <LinkIcon size={10} />
                              タスク {item.relatedTaskIds.length}件
                            </span>
                          )}
                      </div>

                      {/* Memo */}
                      {item.memo && (
                        <div className="timeline-memo">{item.memo}</div>
                      )}
                    </div>
                  </div>
                </div>,
              );
            });

            if (isToday_ && !nowLineRendered) {
              elements.push(NowLineBetween);
            }

            return elements;
          })()}
        </div>
      )}
    </div>
  );
}
