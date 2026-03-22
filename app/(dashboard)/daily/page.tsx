"use client";

import { useState, useEffect, useCallback } from "react";
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
  CheckCircle2,
  LinkIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

/* ──────────────────────────────────────────
   Types — Notion「TGP - デイリープラン」DB対応
   ────────────────────────────────────────── */
type DailyPlanStatus = "未着手" | "進行中" | "完了" | "予定変更" | "保留";
type DailyPlanCategory = "目標関連" | "実務・定常" | "プロジェクト" | "突発・その他" | "雑務";

type DailyPlanItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: DailyPlanStatus;
  category?: DailyPlanCategory | null;
  memo?: string | null;
  targetProgress?: number | null;
  actualProgress?: number | null;
  relatedTaskIds?: string[];
  icon: string;
  url?: string | null;
};

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

function formatNowTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ──────────────────────────────────────────
   Date Helpers
   ────────────────────────────────────────── */
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
    case "mail": return <Zap size={size} />;
    case "users": return <Users size={size} />;
    case "code": return <Monitor size={size} />;
    case "lunch": return <Utensils size={size} />;
    case "review": return <BookOpen size={size} />;
    case "doc": return <FileText size={size} />;
    case "reflect": return <Coffee size={size} />;
    default: return <Clock size={size} />;
  }
}

function getStatusDotClass(status: DailyPlanStatus): string {
  switch (status) {
    case "完了": return "status-done";
    case "進行中": return "status-in-progress";
    case "予定変更": return "status-changed";
    case "保留": return "status-hold";
    default: return "status-todo";
  }
}

function getStatusBadgeClass(status: DailyPlanStatus): string {
  switch (status) {
    case "完了": return "badge-status-done";
    case "進行中": return "badge-status";
    case "予定変更": return "badge-status-changed";
    case "保留": return "badge-status-hold";
    default: return "badge-status";
  }
}

function getCategoryCardClass(category?: DailyPlanCategory | null): string {
  if (!category) return "";
  switch (category) {
    case "目標関連": return "cat-goal";
    case "実務・定常": return "cat-routine";
    case "プロジェクト": return "cat-project";
    case "突発・その他": return "cat-adhoc";
    case "雑務": return "cat-misc";
    default: return "";
  }
}

function getCategoryBadgeClass(category?: DailyPlanCategory | null): string {
  if (!category) return "";
  switch (category) {
    case "目標関連": return "badge-cat-goal";
    case "実務・定常": return "badge-cat-routine";
    case "プロジェクト": return "badge-cat-project";
    case "突発・その他": return "badge-cat-adhoc";
    case "雑務": return "badge-cat-misc";
    default: return "";
  }
}

function isCurrent(item: DailyPlanItem): boolean {
  if (item.status === "完了") return false;
  return item.status === "進行中";
}

function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0%";
  return `${Math.round(n * 100)}%`;
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
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

  // 1分ごとに現在時刻を更新
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

  const goToday = () => setDate(getTodayJST());
  const goPrev = () => setDate((d) => addDays(d, -1));
  const goNext = () => setDate((d) => addDays(d, 1));
  const refresh = () => fetchData(date);

  // Stats
  const total = items.length;
  const done = items.filter((i) => i.status === "完了").length;
  const inProgress = items.filter((i) => i.status === "進行中").length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const totalMins = items.reduce((sum, i) => {
    if (!i.startTime || !i.endTime) return sum;
    const [sh, sm] = i.startTime.split(":").map(Number);
    const [eh, em] = i.endTime.split(":").map(Number);
    return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }, 0);
  const totalHours = (totalMins / 60).toFixed(1);

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
              今日
            </button>
          )}
        </div>
        <button className="daily-nav-btn" onClick={goNext} title="翌日">
          <ChevronRight size={16} />
        </button>
        <button className="daily-nav-btn daily-refresh-btn" onClick={refresh} title="更新">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Header Stats ── */}
      {!loading && !error && items.length > 0 && (
        <div className="daily-header animate-fade-up">
          <div className="daily-stat-card">
            <div className="daily-stat-label">進捗</div>
            <div className="daily-stat-value">
              {done}<span className="unit">/{total}</span>
            </div>
            <div className="daily-progress-track">
              <div
                className="daily-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="daily-stat-card">
            <div className="daily-stat-label">ステータス</div>
            <div className="daily-stat-value">
              {inProgress > 0 ? (
                <>
                  {inProgress}<span className="unit"> 進行中</span>
                </>
              ) : done === total && total > 0 ? (
                <span style={{ fontSize: 16, color: "var(--color-green)" }}>
                  <CheckCircle2 size={20} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
                  All Done
                </span>
              ) : (
                <>
                  {total - done}<span className="unit"> 残り</span>
                </>
              )}
            </div>
            <div className="daily-stat-sub">
              完了 {done} / 未着手 {total - done - inProgress} / 進行中 {inProgress}
            </div>
          </div>

          <div className="daily-stat-card">
            <div className="daily-stat-label">作業時間</div>
            <div className="daily-stat-value">
              {totalHours}<span className="unit">h</span>
            </div>
            <div className="daily-stat-sub">
              {items[0]?.startTime ?? "--:--"} 〜 {items[items.length - 1]?.endTime ?? "--:--"}
            </div>
          </div>
        </div>
      )}

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
            AIアシスタントに「デイリープランを作って」と話しかけると、<br />
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

            // 独立した now-line（アイテム間に挿入するタイプ）
            const NowLineBetween = (
              <div key="now-line" className="timeline-now-line">
                <div className="timeline-now-time-col" />
                <div className="timeline-now-dot-col">
                  <div className="timeline-now-dot" />
                </div>
                <div className="timeline-now-rule" />
              </div>
            );

            const elements: React.ReactNode[] = [];

            items.forEach((item) => {
              const itemStart = item.startTime ? toMinutes(item.startTime) : 0;
              const itemEnd = item.endTime ? toMinutes(item.endTime) : 0;
              const isNowInside = isToday_ && !nowLineRendered && nowMinutes >= itemStart && nowMinutes < itemEnd && itemEnd > itemStart;

              // アイテムの開始より前に now がある（どのアイテムの中にも入らない隙間）
              if (isToday_ && !nowLineRendered && !isNowInside && nowMinutes < itemStart) {
                elements.push(NowLineBetween);
                nowLineRendered = true;
              }

              // now がこのカードの中にある場合、カード内オーバーレイ位置を計算
              const nowPct = isNowInside
                ? ((nowMinutes - itemStart) / (itemEnd - itemStart)) * 100
                : -1;

              if (isNowInside) {
                nowLineRendered = true;
              }

              const current = isCurrent(item);
              const isDone = item.status === "完了";
              const duration = calcDuration(item.startTime, item.endTime);

              elements.push(
                <div key={item.id} className="timeline-item">
                  {/* Time */}
                  <div className="timeline-time-col">
                    <span className="timeline-time">{item.startTime}</span>
                    <span className="timeline-time-end">{item.endTime}</span>
                  </div>

                  {/* Dot */}
                  <div className="timeline-dot-col">
                    <div className={`timeline-dot ${getStatusDotClass(item.status)}`} />
                  </div>

                  {/* Card */}
                  <div className="timeline-content">
                    <div
                      className={`timeline-card${current ? " is-current" : ""}${isDone ? " is-done" : ""} ${getCategoryCardClass(item.category)}`}
                      style={{ position: "relative" }}
                    >
                      {/* Now indicator overlay inside the card */}
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
                        <span className="timeline-card-title">{item.title}</span>
                        <span
                          className={`timeline-badge ${getStatusBadgeClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                        {duration && (
                          <span className="timeline-badge badge-task">
                            {duration}
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="timeline-card-meta">
                        {item.category && (
                          <span className={`timeline-badge ${getCategoryBadgeClass(item.category)}`}>
                            {item.category}
                          </span>
                        )}
                        {item.relatedTaskIds && item.relatedTaskIds.length > 0 && (
                          <span className="timeline-badge badge-task">
                            <LinkIcon size={10} />
                            タスク紐づけ {item.relatedTaskIds.length}件
                          </span>
                        )}
                      </div>

                      {/* Progress bars */}
                      {item.targetProgress != null && (
                        <div className="timeline-progress-row">
                          <span className="timeline-progress-label">目標</span>
                          <div className="timeline-progress-track">
                            <div
                              className="timeline-progress-fill fill-target"
                              style={{ width: pct(item.targetProgress) }}
                            />
                          </div>
                          <span className="timeline-progress-pct">
                            {pct(item.targetProgress)}
                          </span>
                        </div>
                      )}
                      {item.actualProgress != null && (
                        <div className="timeline-progress-row">
                          <span className="timeline-progress-label">実績</span>
                          <div className="timeline-progress-track">
                            <div
                              className="timeline-progress-fill fill-actual"
                              style={{ width: pct(item.actualProgress) }}
                            />
                          </div>
                          <span className="timeline-progress-pct">
                            {pct(item.actualProgress)}
                          </span>
                        </div>
                      )}

                      {/* Memo */}
                      {item.memo && (
                        <div className="timeline-memo">{item.memo}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            });

            // 全アイテムの後に現在時刻が来る場合
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