"use client";

import { useState, useEffect, useCallback } from "react";
import "./main.css";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

/* ============================================================
   Types — mirrors api/tasks/route.ts response shape
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
};

/* ============================================================
   Constants
   ============================================================ */
const STATUSES = [
  { key: "未着手", colClass: "col-todo",       label: "未着手" },
  { key: "進行中", colClass: "col-inprogress",  label: "進行中" },
  { key: "完了",   colClass: "col-done",        label: "完了" },
  { key: "保留",   colClass: "col-hold",        label: "保留" },
] as const;

const PRIORITY_CARD_CLASS: Record<string, string> = {
  Highest: "prio-highest",
  High:    "prio-high",
  Medium:  "prio-medium",
  Low:     "prio-low",
  Lowest:  "prio-lowest",
};

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  Highest: "badge-prio-highest",
  High:    "badge-prio-high",
  Medium:  "badge-prio-medium",
  Low:     "badge-prio-low",
  Lowest:  "badge-prio-lowest",
};

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  "目標関連":   "badge-cat-goal",
  "実務・定常": "badge-cat-routine",
  "プロジェクト": "badge-cat-project",
  "突発・その他": "badge-cat-adhoc",
  "雑務":       "badge-cat-misc",
};

/* ============================================================
   Task Card
   ============================================================ */
function TaskCard({ task, index }: { task: Task; index: number }) {
  const cardClass = PRIORITY_CARD_CLASS[task.priority] ?? "";
  const prioBadge = PRIORITY_BADGE_CLASS[task.priority] ?? "badge-prio-lowest";
  const catBadge  = task.category ? (CATEGORY_BADGE_CLASS[task.category] ?? "badge-cat-misc") : null;
  const isDone    = task.status === "完了";

  const inner = (
    <div
      className={`tasks-card ${cardClass}`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <p className={`tasks-card-title${isDone ? " is-done" : ""}`}>
        {task.title}
      </p>

      {task.summary && (
        <p className="tasks-card-summary">{task.summary}</p>
      )}

      <div className="tasks-card-meta">
        <span className={`tasks-badge ${prioBadge}`}>{task.priority}</span>

        {catBadge && task.category && (
          <span className={`tasks-badge ${catBadge}`}>{task.category}</span>
        )}

        {task.estimatedHours != null && (
          <span className="tasks-badge badge-hours">{task.estimatedHours}h</span>
        )}
      </div>
    </div>
  );

  // If there's a Notion URL, make it a subtle link
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
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

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

  const total = tasks.length;

  return (
    <div className="stagger">
      {/* Header */}
      <div className="tasks-header-row animate-fade-up">
        <span className="tasks-total-badge">{total} タスク</span>
        <button className="tasks-refresh-btn" onClick={fetchTasks} disabled={loading}>
          <RefreshCw size={13} style={loading ? { animation: "tspin 1s linear infinite" } : {}} />
          更新
        </button>
      </div>

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
          <button className="tasks-retry-btn" onClick={fetchTasks}>再試行</button>
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
                      <TaskCard key={task.id} task={task} index={i} />
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