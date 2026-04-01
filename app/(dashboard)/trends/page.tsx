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
  Briefcase,
  FlaskConical,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
type TrendCategory = "AI" | "Tech" | "Business" | "Science" | "World" | "Other";

type TrendItem = {
  id: string;
  title: string;
  summary: string;
  category: TrendCategory;
  impactScore: number;
  keywords: string[];
  sourceUrl?: string;    // ← 追加
  isFeatured?: boolean;
};

type TrendResponse = {
  items: TrendItem[];
  digest: string;
  fetchedAt: string;
};

// ── Cache ──────────────────────────────────────────────────
const CACHE_KEY = "aether_trends_cache";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
  } catch { /* noop */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
}

// ── Category Config ─────────────────────────────────────────
type CategoryConfig = {
  label: string;
  cardClass: string;
  badgeClass: string;
  icon: React.ElementType;
};

const CATEGORY_CONFIG: Record<TrendCategory, CategoryConfig> = {
  AI: { label: "AI", cardClass: "cat-ai", badgeClass: "trend-badge-ai", icon: Sparkles },
  Tech: { label: "Tech", cardClass: "cat-tech", badgeClass: "trend-badge-tech", icon: Cpu },
  Business: { label: "Business", cardClass: "cat-business", badgeClass: "trend-badge-business", icon: Briefcase },
  Science: { label: "Science", cardClass: "cat-science", badgeClass: "trend-badge-science", icon: FlaskConical },
  World: { label: "World", cardClass: "cat-world", badgeClass: "trend-badge-world", icon: Globe },
  Other: { label: "Other", cardClass: "cat-other", badgeClass: "trend-badge-other", icon: Layers },
};

const ALL_CATEGORIES: TrendCategory[] = ["AI", "Tech", "Business", "Science", "World", "Other"];

// ── Helpers ─────────────────────────────────────────────────
function getImpactClass(score: number) {
  if (score >= 8) return "score-high";
  if (score >= 5) return "score-medium";
  return "score-low";
}

function formatFetchedAt(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} 取得`;
  } catch { return isoStr; }
}

function daysUntilExpiry(isoStr: string): number {
  const age = Date.now() - new Date(isoStr).getTime();
  return Math.max(0, Math.ceil((CACHE_TTL_MS - age) / (24 * 60 * 60 * 1000)));
}

/** URLをクリックで新タブ展開 */
function openUrl(url: string | undefined) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

// ── Page ────────────────────────────────────────────────────
export default function TrendPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<TrendCategory | "All">("All");
  const [loadingStep, setLoadingStep] = useState("ウェブを検索中...");
  const [fromCache, setFromCache] = useState(false);

  const LOADING_STEPS = [
    "ウェブを検索中...",
    "ニュースを解析中...",
    "トレンドを分類中...",
    "まとめを生成中...",
  ];

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
    setLoadingStep(LOADING_STEPS[0]);

    let stepIdx = 0;
    const stepTimer = setInterval(() => {
      stepIdx = (stepIdx + 1) % LOADING_STEPS.length;
      setLoadingStep(LOADING_STEPS[stepIdx]);
    }, 4000);

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
      clearInterval(stepTimer);
      setLoading(false);
    }
  }, []);

  if (!mounted) return null;

  // ── フィルター ──────────────────────────────────────────
  const filteredItems = (data?.items ?? []).filter(
    (item) => activeCategory === "All" || item.category === activeCategory
  );

  const featuredItem =
    filteredItems.find((item) => item.isFeatured) ?? filteredItems[0] ?? null;
  const restItems = filteredItems.filter((item) => item.id !== featuredItem?.id);

  const categoryCounts = (data?.items ?? []).reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const daysLeft = data ? daysUntilExpiry(data.fetchedAt) : 0;

  return (
    <div className="stagger">
      {/* ── Header ── */}
      <div className="trend-header-left">
        {data && (
          <div className="trend-last-updated">
            <span className={`trend-last-updated-dot${daysLeft <= 1 ? " stale" : ""}`} />
            {formatFetchedAt(data.fetchedAt)}
            {fromCache && (
              <span className="trend-cache-badge">
                キャッシュ（あと{daysLeft}日）
              </span>
            )}
          </div>
        )}
        {!data && !loading && (
          <div className="trend-last-updated">
            <span className="trend-last-updated-dot stale" />
            未取得 — 週1回の更新
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
              onClick={() => { clearCache(); fetchTrends(); }}
              disabled={loading}
              title="キャッシュを無視して強制更新（API使用量あり）"
            >
              <RefreshCw
                size={13}
                style={loading ? { animation: "tspin 1s linear infinite" } : {}}
              />
              強制更新
            </button>
          )}
          {!data && !loading && (
            <button className="trend-fetch-btn" onClick={fetchTrends}>
              <Zap size={14} />
              トレンドを取得
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
            <Zap size={24} />
          </div>
          <div className="trend-loading-title">最新トレンドを取得中</div>
          <div className="trend-loading-desc">
            AIがウェブを検索してトレンドをキュレーションしています。
            <br />
            完了後は7日間キャッシュされます。
          </div>
          <div className="trend-loading-progress">
            <span className="trend-loading-step">{loadingStep}</span>
            <span className="trend-loading-cursor" />
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
          <div className="trend-empty-title">トレンドがまだ取得されていません</div>
          <div className="trend-empty-desc">
            「トレンドを取得」ボタンから最新情報を取得してください。
            <br />
            取得後は<strong>7日間キャッシュ</strong>されるので、毎回APIを消費しません。
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

      {/* ── AI Digest ── */}
      {!loading && data && activeCategory === "All" && data.digest && (
        <div className="trend-digest">
          <div className="trend-digest-header">
            <div className="trend-digest-icon">
              <Sparkles size={15} />
            </div>
            <span className="trend-digest-title">AI ダイジェスト</span>
          </div>
          <div className="trend-digest-body">{data.digest}</div>
        </div>
      )}

      {/* ── Featured ── */}
      {!loading && featuredItem && (
        <div
          className={`trend-featured${featuredItem.sourceUrl ? " has-url" : ""}`}
          onClick={() => openUrl(featuredItem.sourceUrl)}
          title={featuredItem.sourceUrl ? "クリックして記事を開く" : undefined}
        >
          <div className="trend-featured-label">
            Top Trend
          </div>
          <div className="trend-featured-title">{featuredItem.title}</div>
          <div className="trend-featured-summary">{featuredItem.summary}</div>
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
            {featuredItem.keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="trend-badge trend-badge-keyword">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && restItems.length > 0 && (
        <div className="trend-grid">
          {restItems.map((item) => {
            const cfg = CATEGORY_CONFIG[item.category];
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className={`trend-card ${cfg.cardClass}${item.sourceUrl ? " has-url" : ""}`}
                onClick={() => openUrl(item.sourceUrl)}
                title={item.sourceUrl ? "クリックして記事を開く" : undefined}
              >
                <div className="trend-card-header">
                  <div className="trend-card-title">{item.title}</div>
                  <div className={`trend-impact-score ${getImpactClass(item.impactScore)}`}>
                    {item.impactScore}
                  </div>
                </div>
                <div className="trend-card-summary">{item.summary}</div>
                <div className="trend-card-footer">
                  <span className={`trend-badge ${cfg.badgeClass}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>
                  {item.keywords.slice(0, 2).map((kw) => (
                    <span key={kw} className="trend-badge trend-badge-keyword">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}