"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import "./main.css";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  ExternalLink,
  Send,
  Eye,
  BookOpen,
} from "lucide-react";
import type { ZennArticle } from "@/app/api/zenn/route";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type Tab = "all" | "published" | "draft";

type Toast = {
  type: "success" | "error";
  message: string;
};

/* ──────────────────────────────────────────
   Helpers
   ────────────────────────────────────────── */
function formatDate(isoOrDate: string | null): string {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

/* ──────────────────────────────────────────
   Page Component
   ────────────────────────────────────────── */
export default function ZennPage() {
  const [articles, setArticles] = useState<ZennArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [publishingSlug, setPublishingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  /* ── データ取得 ── */
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/zenn", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch (err) {
      setError((err as Error).message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  /* ── トースト自動消去 ── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── タブフィルタ ── */
  const filtered = useMemo(() => {
    if (activeTab === "published") return articles.filter((a) => a.published);
    if (activeTab === "draft") return articles.filter((a) => !a.published);
    return articles;
  }, [articles, activeTab]);

  const counts = useMemo(
    () => ({
      all: articles.length,
      published: articles.filter((a) => a.published).length,
      draft: articles.filter((a) => !a.published).length,
    }),
    [articles]
  );

  /* ── 公開処理 ── */
  const handlePublish = async (article: ZennArticle) => {
    if (publishingSlug) return;
    setPublishingSlug(article.slug);

    try {
      const res = await fetch("/api/zenn/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: article.slug, sha: article.sha }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "公開に失敗しました");

      // 楽観的更新
      setArticles((prev) =>
        prev.map((a) =>
          a.slug === article.slug ? { ...a, published: true } : a
        )
      );

      setToast({
        type: "success",
        message: `「${article.title.slice(0, 24)}…」をZennに公開しました`,
      });
    } catch (err) {
      setToast({
        type: "error",
        message: (err as Error).message,
      });
    } finally {
      setPublishingSlug(null);
    }
  };

  /* ── Zennで記事を開く ── */
  const openZenn = (slug: string) => {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "";
    window.open(
      `https://zenn.dev/${owner}/articles/${slug}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ──────────────────────────────────────────
     Render
     ────────────────────────────────────────── */
  return (
    <div className="zenn-container stagger">
      {/* ── Header ── */}
      <div className="zenn-header animate-fade-up">
        {/* タブ */}
        <div className="zenn-tabs">
          {(
            [
              { key: "all", label: "すべて" },
              { key: "published", label: "公開済み" },
              { key: "draft", label: "下書き" },
            ] as { key: Tab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              className={`zenn-tab-btn${activeTab === key ? " active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              <span className="zenn-tab-count">{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* アクション */}
        <div className="zenn-header-actions">
          <button
            className="zenn-refresh-btn"
            onClick={fetchArticles}
            disabled={loading}
          >
            <RefreshCw
              size={13}
              style={loading ? { animation: "zspin 1s linear infinite" } : {}}
            />
            更新
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="zenn-loading animate-fade-up">
          <Loader2 size={22} className="zenn-spinner" />
          <span>記事を取得中...</span>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="zenn-error animate-fade-up">
          <AlertCircle size={20} />
          <div>
            <div className="zenn-error-title">取得に失敗しました</div>
            <div className="zenn-error-detail">{error}</div>
          </div>
          <button className="zenn-retry-btn" onClick={fetchArticles}>
            再試行
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="zenn-empty animate-fade-up">
          <div className="zenn-empty-icon">
            <BookOpen size={22} />
          </div>
          <div className="zenn-empty-title">
            {activeTab === "draft"
              ? "下書き記事がありません"
              : activeTab === "published"
                ? "公開済み記事がありません"
                : "記事がありません"}
          </div>
          <div className="zenn-empty-desc">
            {activeTab === "draft"
              ? "AIアシスタントに「Zenn記事を書いて」と話しかけると下書きを生成します"
              : "GitHubリポジトリの articles/ フォルダに .md ファイルを追加してください"}
          </div>
        </div>
      )}

      {/* ── Article List ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="zenn-list">
          {filtered.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              isPublishing={publishingSlug === article.slug}
              onPublish={handlePublish}
              onOpen={openZenn}
            />
          ))}
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`zenn-toast ${toast.type}`}>
          {toast.type === "success" ? (
            <ExternalLink size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   ArticleCard
   ────────────────────────────────────────── */
function ArticleCard({
  article,
  isPublishing,
  onPublish,
  onOpen,
}: {
  article: ZennArticle;
  isPublishing: boolean;
  onPublish: (a: ZennArticle) => void;
  onOpen: (slug: string) => void;
}) {
  return (
    <div className="zenn-card">
      {/* Top */}
      <div className="zenn-card-top">
        <span className="zenn-card-emoji">{article.emoji}</span>

        <div className="zenn-card-main">
          <div className="zenn-card-title-row">
            <Link href={`/zenn/${article.slug}`} className="zenn-card-title">
              {article.title}
            </Link>
            <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
              <span
                className={`zenn-badge ${article.published
                  ? "zenn-badge-published"
                  : "zenn-badge-draft"
                  }`}
              >
                {article.published ? "公開済み" : "下書き"}
              </span>
              {article.aiGenerated && (
                <span className="zenn-badge zenn-badge-ai">AI生成</span>
              )}
            </div>
          </div>

          {/* Preview */}
          {article.bodyPreview && (
            <p className="zenn-card-preview">{article.bodyPreview}</p>
          )}

          {/* Topics */}
          {article.topics.length > 0 && (
            <div className="zenn-card-meta" style={{ marginTop: 2 }}>
              {article.topics.slice(0, 4).map((t: any) => (
                <span key={t} className="zenn-card-topic">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="zenn-card-footer">
        <div className="zenn-card-footer-left">
          <span className="zenn-card-date">
            {formatDate(article.publishedAt ?? article.updatedAt)}
          </span>
          <span
            style={{
              width: 1,
              height: 10,
              background: "var(--color-border)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: "var(--color-text-muted)",
              fontFamily: "monospace",
            }}
          >
            {article.slug}
          </span>
        </div>

        <div className="zenn-card-footer-right">
          {article.published ? (
            /* 公開済み → Zennで開くボタン */
            <button
              className="zenn-action-btn"
              onClick={() => onOpen(article.slug)}
            >
              <ExternalLink size={12} />
              Zennで開く
            </button>
          ) : (
            /* 下書き → 公開ボタン */
            <button
              className="zenn-action-btn publish"
              onClick={() => onPublish(article)}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 size={12} style={{ animation: "zspin 1s linear infinite" }} />
                  公開中...
                </>
              ) : (
                <>
                  <Send size={12} />
                  Zennに公開
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}