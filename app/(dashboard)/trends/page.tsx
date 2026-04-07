"use client";

import { useState, useEffect, useCallback } from "react";
import "./main.css";
import {
  AlertCircle,
  RefreshCw,
  Zap,
  TrendingUp,
  Cpu,
  Globe,
  Layers,
  Sparkles,
  BookOpen,
  Map,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
type TrendCategory = "AI/LLM" | "Frontend" | "GIS" | "Japanese" | "Other";

type TrendItem = {
  id: string;
  title: string;
  summary: string;
  category: TrendCategory;
  publishedAt: string;
  sourceUrl: string;
  sourceName: string;
  isFeatured?: boolean;
};

type TrendResponse = {
  items: TrendItem[];
  fetchedAt: string;
};

// ── Cache ──────────────────────────────────────────────────
const CACHE_KEY = "lumo_rss_trends_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間（RSSは鮮度が命）

function loadCache(): TrendResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: TrendResponse = JSON.parse(raw);
    const age = Date.now() - new Date(data.fetchedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(data: TrendResponse) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* noop */
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* noop */
  }
}

// ── Category Config ─────────────────────────────────────────
type CategoryConfig = {
  label: string;
  cardClass: string;
  badgeClass: string;
  icon: React.ElementType;
  description: string;
};

const CATEGORY_CONFIG: Record<TrendCategory, CategoryConfig> = {
  "AI/LLM": {
    label: "AI / LLM",
    cardClass: "cat-ai",
    badgeClass: "trend-badge-ai",
    icon: Sparkles,
    description: "Anthropic・OpenAI 公式ブログ",
  },
  Frontend: {
    label: "Frontend",
    cardClass: "cat-tech",
    badgeClass: "trend-badge-tech",
    icon: Cpu,
    description: "Vercel・Next.js 公式ブログ",
  },
  GIS: {
    label: "GIS",
    cardClass: "cat-gis",
    badgeClass: "trend-badge-gis",
    icon: Map,
    description: "ESRIジャパン ブログ",
  },
  Japanese: {
    label: "Japanese",
    cardClass: "cat-japanese",
    badgeClass: "trend-badge-japanese",
    icon: BookOpen,
    description: "Zenn・Qiita トレンド",
  },
  Other: {
    label: "Other",
    cardClass: "cat-other",
    badgeClass: "trend-badge-other",
    icon: Layers,
    description: "その他",
  },
};

const ALL_CATEGORIES: TrendCategory[] = [
  "AI/LLM",
  "Frontend",
  "GIS",
  "Japanese",
  "Other",
];

// ── Helpers ─────────────────────────────────────────────────
function formatPublishedAt(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (d.getTime() === 0) return "日付不明";
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "1時間以内";
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}日前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return isoStr;
  }
}

function formatFetchedAt(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} 取得`;
  } catch {
    return isoStr;
  }
}

function minutesUntilExpiry(isoStr: string): number {
  const age = Date.now() - new Date(isoStr).getTime();
  return Math.max(0, Math.ceil((CACHE_TTL_MS - age) / (1000 * 60)));
}

// ── Page ────────────────────────────────────────────────────
export default function TrendPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<TrendCategory | "All">(
    "All",
  );
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cached = loadCache();
    if (cached) {
      setData(cached);
      setFromCache(true);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trends", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json: TrendResponse = await res.json();
      saveCache(json);
      setData(json);
      setFromCache(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!mounted) return null;

  // ── フィルター ──────────────────────────────────────────
  const filteredItems = (data?.items ?? []).filter(
    (item) => activeCategory === "All" || item.category === activeCategory,
  );

  const featuredItem =
    filteredItems.find((item) => item.isFeatured) ?? filteredItems[0] ?? null;
  const restItems = filteredItems.filter(
    (item) => item.id !== featuredItem?.id,
  );

  const categoryCounts = (data?.items ?? []).reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const minsLeft = data ? minutesUntilExpiry(data.fetchedAt) : 0;
  const isStale = minsLeft <= 10;

  return (
    <div className="stagger">
      {/* ── Header meta ── */}
      <div className="trend-header-left">
        {data && (
          <div className="trend-last-updated">
            <span
              className={`trend-last-updated-dot${isStale ? " stale" : ""}`}
            />
            {formatFetchedAt(data.fetchedAt)}
            {fromCache && (
              <span className="trend-cache-badge">
                キャッシュ（あと{minsLeft}分）
              </span>
            )}
          </div>
        )}
        {!data && !loading && (
          <div className="trend-last-updated">
            <span className="trend-last-updated-dot stale" />
            未取得 — 1時間キャッシュ
          </div>
        )}
      </div>

      <div className="trend-header animate-fade-up">
        {/* ── Category Filters ── */}
        {!loading && data && (
          <div className="trend-filters animate-fade-up">
            <button
              className={`trend-filter-btn${activeCategory === "All" ? " active" : ""}`}
              onClick={() => setActiveCategory("All")}
            >
              <TrendingUp size={12} />
              すべて
              <span className="trend-filter-count">{data.items.length}</span>
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const count = categoryCounts[cat] ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  className={`trend-filter-btn${activeCategory === cat ? " active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                  title={cfg.description}
                >
                  <Icon size={12} />
                  {cfg.label}
                  <span className="trend-filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="trend-header-actions">
          {fromCache && data && (
            <button
              className="trend-force-btn"
              onClick={() => {
                clearCache();
                fetchTrends();
              }}
              disabled={loading}
              title="キャッシュを無視して強制更新"
            >
              <RefreshCw
                size={13}
                style={loading ? { animation: "tspin 1s linear infinite" } : {}}
              />
              更新
            </button>
          )}
          {!data && !loading && (
            <button className="trend-fetch-btn" onClick={fetchTrends}>
              <Zap size={14} />
              RSSを取得
            </button>
          )}
          {loading && (
            <button className="trend-fetch-btn fetching" disabled>
              <RefreshCw size={14} className="trend-spinning" />
              取得中...
            </button>
          )}
          {data && !fromCache && !loading && (
            <span className="trend-freshbadge">✓ 最新</span>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="trend-loading animate-fade-up">
          <div className="trend-loading-icon">
            <Globe size={24} />
          </div>
          <div className="trend-loading-title">RSSフィードを取得中</div>
          <div className="trend-loading-desc">
            Anthropic・OpenAI・Vercel・Next.js・Zenn・Qiita・ESRIジャパン
            <br />
            から最新記事を並列取得しています。
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="trend-error animate-fade-up">
          <AlertCircle size={20} />
          <div>
            <div className="trend-error-title">取得に失敗しました</div>
            <div className="trend-error-detail">{error}</div>
          </div>
          <button className="trend-retry-btn" onClick={fetchTrends}>
            再試行
          </button>
        </div>
      )}

      {/* ── Empty（未取得）── */}
      {!loading && !error && !data && (
        <div className="trend-empty animate-fade-up">
          <div className="trend-empty-icon">
            <TrendingUp size={24} />
          </div>
          <div className="trend-empty-title">
            RSSフィードがまだ取得されていません
          </div>
          <div className="trend-empty-desc">
            「RSSを取得」から最新記事を取得してください。
            <br />
            取得後は<strong>1時間キャッシュ</strong>されます。
          </div>
          <button
            className="trend-fetch-btn"
            style={{ margin: "16px auto 0", display: "flex" }}
            onClick={fetchTrends}
          >
            <Zap size={14} />
            今すぐ取得
          </button>
        </div>
      )}

      {/* ── Featured ── */}
      {!loading && featuredItem && (
        <a
          className="trend-featured has-url"
          href={featuredItem.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="trend-featured-label">Latest</div>
          <div className="trend-featured-title">{featuredItem.title}</div>
          {featuredItem.summary && (
            <div className="trend-featured-summary">{featuredItem.summary}</div>
          )}
          <div className="trend-featured-meta">
            {(() => {
              const cfg = CATEGORY_CONFIG[featuredItem.category];
              const Icon = cfg.icon;
              return (
                <span className={`trend-badge ${cfg.badgeClass}`}>
                  <Icon size={10} />
                  {cfg.label}
                </span>
              );
            })()}
            <span className="trend-badge trend-badge-keyword">
              {featuredItem.sourceName}
            </span>
            <span className="trend-badge trend-badge-keyword trend-badge-time">
              {formatPublishedAt(featuredItem.publishedAt)}
            </span>
          </div>
        </a>
      )}

      {/* ── Grid ── */}
      {!loading && restItems.length > 0 && (
        <div className="trend-grid">
          {restItems.map((item) => {
            const cfg = CATEGORY_CONFIG[item.category];
            const Icon = cfg.icon;
            return (
              <a
                key={item.id}
                className={`trend-card ${cfg.cardClass} has-url`}
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="trend-card-header">
                  <div className="trend-card-title">{item.title}</div>
                  <div className="trend-card-time">
                    {formatPublishedAt(item.publishedAt)}
                  </div>
                </div>
                {item.summary && (
                  <div className="trend-card-summary">{item.summary}</div>
                )}
                <div className="trend-card-footer">
                  <span className={`trend-badge ${cfg.badgeClass}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>
                  <span className="trend-badge trend-badge-keyword">
                    {item.sourceName}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
