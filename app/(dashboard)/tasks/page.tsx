import { GlassCard, Badge } from "@/app/components/ui";

const MOCK_TASKS = [
  { title: "レポート提出", project: "営業", priority: "high" as const, done: false },
  { title: "企画書レビュー", project: "開発", priority: "medium" as const, done: false },
  { title: "MTGアジェンダ作成", project: "営業", priority: "high" as const, done: true },
  { title: "デザインFB返信", project: "開発", priority: "low" as const, done: false },
  { title: "請求書確認", project: "経理", priority: "medium" as const, done: true },
];

const PRIORITY_MAP = {
  high: { label: "High", variant: "red" as const },
  medium: { label: "Med", variant: "amber" as const },
  low: { label: "Low", variant: "muted" as const },
};

export default function TasksPage() {
  const done = MOCK_TASKS.filter((t) => t.done).length;
  const total = MOCK_TASKS.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-5 stagger">
      {/* Progress */}
      <GlassCard className="animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">今週の進捗</p>
            <p className="mt-1 font-[var(--font-mono)] text-2xl font-bold text-[var(--color-text-primary)]">
              {done}/{total}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-[var(--font-mono)] text-sm text-[var(--color-accent-light)]">{pct}%</span>
            {/* Simple progress bar */}
            <div className="h-2 w-32 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-[var(--color-accent)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Task list */}
      <GlassCard className="animate-fade-up">
        <div className="space-y-2">
          {MOCK_TASKS.map((task) => (
            <div
              key={task.title}
              className="flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              {/* Checkbox */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${task.done
                    ? "border-[var(--color-green)] bg-[var(--color-green)]/20 text-[var(--color-green)]"
                    : "border-white/10"
                  }`}
              >
                {task.done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>

              <span
                className={`flex-1 text-sm ${task.done
                    ? "text-[var(--color-text-muted)] line-through"
                    : "text-[var(--color-text-primary)]"
                  }`}
              >
                {task.title}
              </span>

              <Badge variant="muted">{task.project}</Badge>
              <Badge variant={PRIORITY_MAP[task.priority].variant}>
                {PRIORITY_MAP[task.priority].label}
              </Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
