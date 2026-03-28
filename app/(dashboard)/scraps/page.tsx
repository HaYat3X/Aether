"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import "./main.css";
import { Loader2, AlertCircle, BookOpen, ExternalLink } from "lucide-react";
import { Lightbulb, Sparkles, TowelRack, Search, BadgeQuestionMark, MessageCircleMore, RefreshCw } from "lucide-react";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type ScrapItem = {
  id: string;
  title: string;
  overview: string;
  category?: string | null;
  status?: string | null;
  createdAt: string;
  url?: string | null;
};

type ScrapCategory = "アイデア" | "気づき" | "調べたいこと" | "モヤモヤ" | "ひとこと";

interface CategoryConfig {
  label: string;
  badgeClass: string;
  icon: React.ElementType;
}

const CATEGORY_CONFIG: Record<ScrapCategory, CategoryConfig> = {
  "アイデア": { label: "アイデア", badgeClass: "badge-idea", icon: Lightbulb },
  "気づき": { label: "気づき", badgeClass: "badge-insight", icon: Sparkles },
  "調べたいこと": { label: "調べたいこと", badgeClass: "badge-research", icon: Search },
  "モヤモヤ": { label: "モヤモヤ", badgeClass: "badge-unclear", icon: BadgeQuestionMark },
  "ひとこと": { label: "ひとこと", badgeClass: "badge-note", icon: MessageCircleMore },
};

const ALL_CATEGORIES: ScrapCategory[] = [
  "アイデア",
  "気づき",
  "調べたいこと",
  "モヤモヤ",
  "ひとこと",
];

/* ──────────────────────────────────────────
   Component
   ────────────────────────────────────────── */
export default function ScrapsPage() {
  const [scraps, setScraps] = useState<ScrapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchScraps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scraps", {
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setScraps(data.items ?? []);
    } catch (err) {
      console.error("[Scraps] fetch error:", err);
      setError((err as Error).message);
      setScraps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScraps();
  }, [fetchScraps]);

  // フィルタリング
  const filteredScraps = useMemo(() => {
    if (!activeCategory) return scraps;
    return scraps.filter((s) => s.category === activeCategory);
  }, [scraps, activeCategory]);

  // タブ用のカウント
  const categoryCounts = useMemo(() => {
    const counts: Record<ScrapCategory, number> = {} as Record<ScrapCategory, number>;
    ALL_CATEGORIES.forEach((cat) => {
      counts[cat] = scraps.filter((s) => s.category === cat).length;
    });
    return counts;
  }, [scraps]);

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toISOString().split("T")[0];
  };

  const getStatusClass = (status?: string | null): string => {
    if (!status) return "";

    const normalized = status.toLowerCase();

    if (normalized === "inbox") return "status-inbox";
    if (normalized === "ボツ") return "status-rejected";
    if (normalized === "ナレッジ化") return "status-documented";
    if (normalized === "タスク化") return "status-tasked";

    return "";
  };

  const handleOpenLink = (url: string | null | undefined) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="scraps-container">
      {/* ── Header ── */}
      <div className="scraps-header animate-fade-up">
        {/* ── Tabs ── */}
        {!loading && !error && (
          <div className="scraps-filters animate-fade-up">
            <button
              className={`scraps-filter-btn${activeCategory === null ? " active" : ""}`}
              onClick={() => setActiveCategory(null)}
            >
              <TowelRack size={12} />
              すべて
              <span className="scraps-filter-count">{scraps.length}</span>
            </button>

            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  className={`scraps-filter-btn${activeCategory === cat ? " active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <Icon size={12} />
                  {cfg.label}
                  <span className="scraps-filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          className="refresh-btn"
          onClick={fetchScraps}
          disabled={loading}
        >
          <RefreshCw
            size={13}
            style={loading ? { animation: "tspin 1s linear infinite" } : {}}
          />
          更新
        </button>
      </div>

      {/* ── Content ── */}
      <div className="scraps-content">
        {/* ── Loading ── */}
        {loading && (
          <div className="scraps-loading animate-fade-up">
            <Loader2 size={24} className="scraps-spinner" />
            <span>スクラップを取得中...</span>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="scraps-error animate-fade-up">
            <div className="scraps-error-icon">
              <AlertCircle size={18} />
            </div>
            <div className="scraps-error-content">
              <div className="scraps-error-title">
                データの取得に失敗しました
              </div>
              <div className="scraps-error-detail">{error}</div>
            </div>
            <button className="scraps-retry-btn" onClick={fetchScraps}>
              再試行
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && filteredScraps.length === 0 && (
          <div className="scraps-empty animate-fade-up">
            <div className="scraps-empty-icon">
              <BookOpen size={28} />
            </div>
            <div className="scraps-empty-title">スクラップはありません</div>
            <div className="scraps-empty-desc">
              {activeCategory
                ? `「${activeCategory}」カテゴリにはスクラップがありません`
                : "スクラップがまだ保存されていません"}
            </div>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && !error && filteredScraps.length > 0 && (
          <div className="scraps-grid">
            {filteredScraps.map((scrap) => (
              <div key={scrap.id} className="scraps-card">
                {/* Header */}
                <div className="scraps-card-header">
                  <h3 className="scraps-card-title">{scrap.title}</h3>
                  {scrap.url && (
                    <button
                      className="scraps-card-link"
                      onClick={() => handleOpenLink(scrap.url)}
                      title="外部リンクで開く"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>

                {/* Body */}
                {scrap.overview && (
                  <div className="scraps-card-body">
                    <p className="scraps-card-overview">{scrap.overview}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="scraps-card-footer">
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {scrap.category && (
                      <span
                        className={`scraps-card-category ${CATEGORY_CONFIG[scrap.category as ScrapCategory].badgeClass}`}
                      >
                        {scrap.category}
                      </span>
                    )}
                    {scrap.status && (
                      <span
                        className={`scraps-card-status ${getStatusClass(scrap.status)}`}
                      >
                        {scrap.status}
                      </span>
                    )}
                  </div>
                  <span className="scraps-card-date">
                    {formatDate(scrap.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}