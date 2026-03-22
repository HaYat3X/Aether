import { GlassCard } from "@/app/components/ui";

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100dvh-120px)] gap-5">
      {/* Chat main area */}
      <div className="flex flex-1 flex-col">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="mx-auto max-w-2xl space-y-4 stagger">
            <div className="animate-fade-up flex justify-start">
              <GlassCard className="max-w-md">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  こんにちは！AI秘書です。何をお手伝いしましょうか？
                </p>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="mx-auto w-full max-w-2xl">
          <GlassCard className="flex items-center gap-3 !p-3">
            <input
              type="text"
              placeholder="メッセージを入力..."
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
            />
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white transition-shadow hover:shadow-lg hover:shadow-[var(--color-accent-glow)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Right sidebar — Next Up / Tasks */}
      <aside className="hidden w-72 shrink-0 space-y-4 xl:block">
        <GlassCard className="animate-fade-up">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Next Up
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-[var(--font-mono)] text-xs text-[var(--color-accent-light)]">10:00</span>
              <span className="text-sm text-[var(--color-text-secondary)]">チームMTG</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-[var(--font-mono)] text-xs text-[var(--color-amber)]">14:00</span>
              <span className="text-sm text-[var(--color-text-secondary)]">1on1</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Today&apos;s Tasks
          </h3>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
              レポート提出
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />
              企画書レビュー
            </div>
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}
