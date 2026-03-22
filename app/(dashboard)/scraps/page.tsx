import { GlassCard, Badge } from "@/app/components/ui";
import { Plus } from "lucide-react";

const MOCK_SCRAPS = [
  {
    title: "LLMのファインチューニング手法",
    body: "LoRAとQLoRAの違いについて調査。メモリ効率の面でQLoRAが有利...",
    tags: ["AI", "技術メモ"],
    date: "2025-03-20",
  },
  {
    title: "新規プロジェクトのアイデア",
    body: "社内ナレッジ検索をRAGで構築する案。既存のConfluenceデータを活用...",
    tags: ["アイデア", "プロジェクト"],
    date: "2025-03-19",
  },
  {
    title: "読書メモ: チームトポロジー",
    body: "ストリームアラインドチームの考え方が参考になった。認知負荷の軽減...",
    tags: ["読書", "組織"],
    date: "2025-03-18",
  },
];

export default function ScrapsPage() {
  return (
    <div className="stagger">
      {/* New scrap button */}
      <button className="animate-fade-up mb-5 flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent-light)]">
        <Plus size={16} />
        新しいスクラップを作成
      </button>

      {/* Scrap cards grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {MOCK_SCRAPS.map((scrap) => (
          <GlassCard
            key={scrap.title}
            className="animate-fade-up cursor-pointer transition-all hover:border-white/10 hover:bg-white/[0.04]"
          >
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
              {scrap.title}
            </h3>
            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {scrap.body}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {scrap.tags.map((tag) => (
                  <Badge key={tag} variant="accent">
                    {tag}
                  </Badge>
                ))}
              </div>
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
                {scrap.date}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
