"use client";

import { useState, useEffect, useCallback } from "react";
import "./main.css";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
} from "lucide-react";

/* ============================================================
   Types
   ============================================================ */
type Task = {
  id: string;
  url: string | null;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  summary: string | null;
  estimatedHours: number | null;
  sprintStatus: string | null;
  progress: number | null;
  dueDate: string | null;
};

type Summary = {
  total: number;
  byStatus: { 未着手: number; 進行中: number; 完了: number; 保留: number };
  avgProgress: number;
  totalEstHours: number;
  completedEstHours: number;
  overdueCount: number;
  dueTodayCount: number;
  todayJST: string;
};

/* ============================================================
   Constants
   ============================================================ */
const STATUSES = [
  { key: "未着手", colClass: "col-todo", label: "未着手" },
  { key: "進行中", colClass: "col-inprogress", label: "進行中" },
  { key: "完了", colClass: "col-done", label: "完了" },
  { key: "保留", colClass: "col-hold", label: "保留" },
] as const;

const PRIORITY_CARD_CLASS: Record<string, string> = {
  Highest: "prio-highest",
  High: "prio-high",
  Medium: "prio-medium",
  Low: "prio-low",
  Lowest: "prio-lowest",
};

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  Highest: "badge-prio-highest",
  High: "badge-prio-high",
  Medium: "badge-prio-medium",
  Low: "badge-prio-low",
  Lowest: "badge-prio-lowest",
};

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  目標関連: "badge-cat-goal",
  "実務・定常": "badge-cat-routine",
  プロジェクト: "badge-cat-project",
  "突発・その他": "badge-cat-adhoc",
  雑務: "badge-cat-misc",
};

/* ============================================================
   Helpers
   ============================================================ */
function normProgress(v: number | null): number {
  if (v === null) return 0;
  return v > 1 ? v / 100 : v;
}

function formatDueDate(
  dueDate: string | null,
  today: string,
): {
  label: string;
  cls: string;
} | null {
  if (!dueDate) return null;
  if (dueDate < today) return { label: "期限切れ", cls: "due-overdue" };
  if (dueDate === today) return { label: "今日期限", cls: "due-today" };
  // 明日
  const tomorrow = (() => {
    const [y, m, d] = today.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + 1));
    return dt.toISOString().split("T")[0];
  })();
  if (dueDate === tomorrow) return { label: "明日期限", cls: "due-soon" };
  // 日付表示
  const [, mm, dd] = dueDate.split("-");
  return { label: `${parseInt(mm)}/${parseInt(dd)}`, cls: "due-normal" };
}

/* ============================================================
   Summary Bar
   ============================================================ */
function SummaryBar({
  summary,
  loading,
}: {
  summary: Summary | null;
  loading: boolean;
}) {
  if (loading || !summary) {
    return (
      <div className="tasks-summary-bar tasks-summary-skeleton animate-fade-up">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="tasks-summary-card tasks-summary-card--skeleton"
          />
        ))}
      </div>
    );
  }

  const {
    total,
    byStatus,
    avgProgress,
    totalEstHours,
    completedEstHours,
    overdueCount,
    dueTodayCount,
  } = summary;
  const completionRate =
    total > 0 ? Math.round((byStatus.完了 / total) * 100) : 0;

  return (
    <div className="tasks-summary-bar animate-fade-up">
      {/* 全体進捗 */}
      <div className="tasks-summary-card tasks-summary-card--progress">
        <div className="tasks-summary-label">
          <TrendingUp size={13} />
          全体進捗
        </div>
        <div className="tasks-summary-value">
          {avgProgress}
          <span className="tasks-summary-unit">%</span>
        </div>
        <div className="tasks-summary-track">
          <div
            className="tasks-summary-fill tasks-summary-fill--progress"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
        <div className="tasks-summary-sub">完了率 {completionRate}%</div>
      </div>

      {/* タスク件数 */}
      <div className="tasks-summary-card">
        <div className="tasks-summary-label">
          <CheckCircle2 size={13} />
          タスク
        </div>
        <div className="tasks-summary-value">
          {byStatus.完了}
          <span className="tasks-summary-unit">/{total}</span>
        </div>
        <div className="tasks-summary-status-row">
          <span className="tasks-status-chip chip-todo">
            {byStatus.未着手} 未着手
          </span>
          <span className="tasks-status-chip chip-inprogress">
            {byStatus.進行中} 進行中
          </span>
          {byStatus.保留 > 0 && (
            <span className="tasks-status-chip chip-hold">
              {byStatus.保留} 保留
            </span>
          )}
        </div>
      </div>

      {/* 時間 */}
      <div className="tasks-summary-card">
        <div className="tasks-summary-label">
          <Clock size={13} />
          見積時間
        </div>
        <div className="tasks-summary-value">
          {totalEstHours}
          <span className="tasks-summary-unit">h</span>
        </div>
        <div className="tasks-summary-track">
          <div
            className="tasks-summary-fill tasks-summary-fill--hours"
            style={{
              width:
                totalEstHours > 0
                  ? `${Math.min(100, (completedEstHours / totalEstHours) * 100)}%`
                  : "0%",
            }}
          />
        </div>
        <div className="tasks-summary-sub">完了 {completedEstHours}h</div>
      </div>

      {/* 期限アラート */}
      <div
        className={`tasks-summary-card${overdueCount > 0 ? " tasks-summary-card--alert" : ""}`}
      >
        <div className="tasks-summary-label">
          <Flame size={13} />
          期限アラート
        </div>
        {overdueCount > 0 || dueTodayCount > 0 ? (
          <>
            <div
              className={`tasks-summary-value${overdueCount > 0 ? " tasks-summary-value--alert" : ""}`}
            >
              {overdueCount}
              <span className="tasks-summary-unit"> 期限切れ</span>
            </div>
            <div className="tasks-summary-sub">
              早急に対応が必要
              {/* {dueTodayCount > 0 && `今日期限 ${dueTodayCount}件`}
              {dueTodayCount === 0 && "早急に"} */}
            </div>
          </>
        ) : (
          <>
            <div className="tasks-summary-value tasks-summary-value--ok">0</div>
            <div className="tasks-summary-sub">期限切れなし ✓</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Task Card
   ============================================================ */
function TaskCard({
  task,
  index,
  today,
}: {
  task: Task;
  index: number;
  today: string;
}) {
  const cardClass = PRIORITY_CARD_CLASS[task.priority] ?? "";
  const prioBadge = PRIORITY_BADGE_CLASS[task.priority] ?? "badge-prio-lowest";
  const catBadge = task.category
    ? (CATEGORY_BADGE_CLASS[task.category] ?? "badge-cat-misc")
    : null;
  const isDone = task.status === "完了";
  const progress = normProgress(task.progress);
  const due = formatDueDate(task.dueDate, today);
  const isOverdue = due?.cls === "due-overdue";

  const inner = (
    <div
      className={`tasks-card ${cardClass}${isOverdue ? " is-overdue" : ""}`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      {/* タイトル */}
      <p className={`tasks-card-title${isDone ? " is-done" : ""}`}>
        {task.title}
      </p>

      {/* サマリ */}
      {task.summary && <p className="tasks-card-summary">{task.summary}</p>}

      {/* 進捗バー（完了以外かつ進捗データがある場合） */}
      {!isDone && task.progress !== null && (
        <div className="tasks-card-progress-row">
          <div className="tasks-card-progress-track">
            <div
              className="tasks-card-progress-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="tasks-card-progress-pct">
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}

      {/* メタ行 */}
      <div className="tasks-card-meta">
        <span className={`tasks-badge ${prioBadge}`}>{task.priority}</span>

        {catBadge && task.category && (
          <span className={`tasks-badge ${catBadge}`}>{task.category}</span>
        )}

        {task.estimatedHours != null && (
          <span className="tasks-badge badge-hours">
            {task.estimatedHours}h
          </span>
        )}

        {/* 期限バッジ */}
        {due && (
          <span className={`tasks-badge tasks-due-badge ${due.cls}`}>
            {due.label}
          </span>
        )}
      </div>
    </div>
  );

  if (task.url) {
    return (
      <a
        href={task.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block" }}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

/* ============================================================
   Page
   ============================================================ */
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      setError((err as Error).message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group tasks by status
  const grouped = STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s.key] = tasks.filter((t) => t.status === s.key);
    return acc;
  }, {});

  const today = summary?.todayJST ?? new Date().toISOString().split("T")[0];

  return (
    <div className="stagger">
      {/* Header */}
      <div className="tasks-header-row animate-fade-up">
        <span className="tasks-total-badge">{tasks.length} タスク</span>
        <button
          className="tasks-refresh-btn"
          onClick={fetchTasks}
          disabled={loading}
        >
          <RefreshCw
            size={13}
            style={loading ? { animation: "tspin 1s linear infinite" } : {}}
          />
          更新
        </button>
      </div>

      {/* Summary Bar */}
      <SummaryBar summary={summary} loading={loading} />

      {/* Loading */}
      {loading && (
        <div className="tasks-loading animate-fade-up">
          <Loader2 size={22} className="tasks-spinner" />
          <span>タスクを取得中...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="tasks-error animate-fade-up">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="tasks-retry-btn" onClick={fetchTasks}>
            再試行
          </button>
        </div>
      )}

      {/* Board */}
      {!loading && !error && (
        <div className="tasks-board">
          {STATUSES.map((status) => {
            const cols = grouped[status.key] ?? [];
            return (
              <div key={status.key} className={`tasks-col ${status.colClass}`}>
                {/* Column header */}
                <div className="tasks-col-header">
                  <span className="tasks-col-dot" />
                  <span className="tasks-col-title">{status.label}</span>
                  <span className="tasks-col-count">{cols.length}</span>
                </div>

                {/* Cards */}
                <div className="tasks-col-cards">
                  {cols.length === 0 ? (
                    <p className="tasks-col-empty">タスクなし</p>
                  ) : (
                    cols.map((task, i) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={i}
                        today={today}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
