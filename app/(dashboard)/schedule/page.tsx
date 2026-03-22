import { GlassCard, Badge } from "@/app/components/ui";

const MOCK_SCHEDULE = [
  { time: "09:00", title: "朝会", color: "accent" as const, duration: "30min" },
  { time: "10:00", title: "チームMTG", color: "purple" as const, duration: "1h" },
  { time: "13:00", title: "ランチ", color: "green" as const, duration: "1h" },
  { time: "14:00", title: "1on1", color: "amber" as const, duration: "30min" },
  { time: "16:00", title: "コードレビュー", color: "pink" as const, duration: "1h" },
  { time: "18:00", title: "振り返り", color: "accent" as const, duration: "30min" },
];

export default function SchedulePage() {
  return (
    <div className="space-y-5 stagger">
      {/* Today's timeline */}
      <GlassCard className="animate-fade-up">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Today
        </h3>
        <div className="space-y-3">
          {MOCK_SCHEDULE.map((item) => (
            <div key={item.time} className="flex items-center gap-4">
              <span className="w-12 font-[var(--font-mono)] text-xs text-[var(--color-text-muted)]">
                {item.time}
              </span>
              <div className="flex flex-1 items-center gap-3 rounded-lg bg-white/[0.03] px-4 py-2.5">
                <span className="text-sm text-[var(--color-text-primary)]">{item.title}</span>
                <Badge variant={item.color}>{item.duration}</Badge>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
