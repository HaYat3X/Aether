import { GlassCard } from "@/app/components/ui";

const MOCK_DAILY = [
  { time: "07:00", title: "起床・身支度", icon: "☀️", done: true },
  { time: "08:00", title: "メールチェック", icon: "📧", done: true },
  { time: "09:00", title: "朝会", icon: "🎙", done: true },
  { time: "10:00", title: "開発作業", icon: "💻", done: false, current: true },
  { time: "12:00", title: "ランチ", icon: "🍱", done: false },
  { time: "13:00", title: "MTG準備", icon: "📋", done: false },
  { time: "14:00", title: "1on1", icon: "🤝", done: false },
  { time: "17:00", title: "日報・振り返り", icon: "📝", done: false },
];

export default function DailyPlanPage() {
  return (
    <div className="stagger">
      <GlassCard className="animate-fade-up">
        <div className="relative space-y-0">
          {MOCK_DAILY.map((item, i) => (
            <div key={item.time} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Timeline line */}
              {i < MOCK_DAILY.length - 1 && (
                <div className="absolute left-[19px] top-8 h-[calc(100%-16px)] w-px bg-white/[0.06]" />
              )}

              {/* Timeline dot */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
                {item.current ? (
                  <span className="flex h-4 w-4 items-center justify-center">
                    <span className="absolute h-4 w-4 animate-ping rounded-full bg-[var(--color-accent)]/40" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                  </span>
                ) : (
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      item.done ? "bg-[var(--color-green)]" : "bg-white/10"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div
                className={`flex flex-1 items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                  item.current
                    ? "bg-[var(--color-accent)]/[0.08] ring-1 ring-[var(--color-accent)]/20"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <div className="flex-1">
                  <span
                    className={`text-sm ${
                      item.done
                        ? "text-[var(--color-text-muted)] line-through"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-muted)]">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
