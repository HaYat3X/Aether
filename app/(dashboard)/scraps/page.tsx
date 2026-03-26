"use client";

import { useState, useEffect, useCallback } from "react";
import "./main.css";
import {
  Plus,
  Loader2,
  AlertCircle,
  BookOpen,
  ExternalLink,
  X,
} from "lucide-react";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type ScrapItem = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  createdAt: string;
  url?: string | null;
};

const CATEGORIES = [
  { label: "アイデア", color: "#fbbf24" },
  { label: "気づき", color: "#60a5fa" },
  { label: "調べたいこと", color: "#a78bfa" },
  { label: "モヤモヤ", color: "#f472b6" },
  { label: "ひとこと", color: "#f87171" },
];

/* ──────────────────────────────────────────
   Component
   ────────────────────────────────────────── */
export default function ScrapsPage() {
  const [scraps, setScraps] = useState<ScrapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<string>("");

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

  const handleSubmit = async () => {
    const title = formTitle.trim();
    const content = formContent.trim();

    if (!title) {
      alert("タイトルは必須です");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/scraps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category: formCategory || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Reset form
      setFormTitle("");
      setFormContent("");
      setFormCategory("");
      setIsModalOpen(false);

      // Refresh list
      await fetchScraps();
    } catch (err) {
      console.error("[Scraps] submit error:", err);
      alert(`エラーが発生しました: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormTitle("");
    setFormContent("");
    setFormCategory("");
  };

  const handleOpenLink = (url: string | null | undefined) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toISOString().split("T")[0];
  };

  const getCategoryColor = (category?: string | null): string => {
    const found = CATEGORIES.find((c) => c.label === category);
    return found?.color || "#94a3b8";
  };

  return (
    <div className="stagger">
      {/* ── Header ── */}
      <div className="scraps-header animate-fade-up">
        <button
          className="scraps-new-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>新しいスクラップを作成</span>
        </button>
      </div>

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
          <AlertCircle size={20} />
          <div>
            <div className="scraps-error-title">データの取得に失敗しました</div>
            <div className="scraps-error-detail">{error}</div>
          </div>
          <button className="scraps-retry-btn" onClick={fetchScraps}>
            再試行
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && scraps.length === 0 && (
        <div className="scraps-empty animate-fade-up">
          <div className="scraps-empty-icon">
            <BookOpen size={24} />
          </div>
          <div className="scraps-empty-title">スクラップはまだありません</div>
          <div className="scraps-empty-desc">
            思いついたアイデアやメモを<br />
            「新しいスクラップを作成」ボタンから保存できます。
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && !error && scraps.length > 0 && (
        <div className="scraps-grid">
          {scraps.map((scrap) => (
            <div key={scrap.id} className="scraps-card">
              {/* Header */}
              <div className="scraps-card-header">
                <h3 className="scraps-card-title">{scrap.title}</h3>
                <div className="scraps-card-actions">
                  {scrap.url && (
                    <button
                      className="scraps-card-action-btn"
                      onClick={() => handleOpenLink(scrap.url)}
                      title="Notionで開く"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="scraps-card-body">
                <p className="scraps-card-content">{scrap.content}</p>
              </div>

              {/* Footer */}
              <div className="scraps-card-footer">
                {scrap.category && (
                  <span
                    className="scraps-card-category"
                    style={{ backgroundColor: getCategoryColor(scrap.category) + "20" }}
                  >
                    {scrap.category}
                  </span>
                )}
                <span className="scraps-card-date">
                  {formatDate(scrap.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Overlay ── */}
      <div
        className={`scraps-modal-overlay ${isModalOpen ? "open" : ""}`}
        onClick={handleCloseModal}
      />

      {/* ── Modal ── */}
      <div className={`scraps-modal-overlay ${isModalOpen ? "open" : ""}`}>
        <div
          className="scraps-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="scraps-modal-header">
            <h2 className="scraps-modal-title">新しいスクラップ</h2>
            <button
              className="scraps-modal-close"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              title="閉じる"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form
            className="scraps-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* Title */}
            <div className="scraps-form-group">
              <label className="scraps-form-label">タイトル</label>
              <input
                type="text"
                className="scraps-form-input"
                placeholder="スクラップのタイトルを入力"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Content */}
            <div className="scraps-form-group">
              <label className="scraps-form-label">内容（任意）</label>
              <textarea
                className="scraps-form-textarea"
                placeholder="スクラップの内容を入力"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="scraps-form-group">
              <label className="scraps-form-label">種類（任意）</label>
              <select
                className="scraps-form-select"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">--- 選択してください ---</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.label} value={cat.label}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="scraps-form-actions">
              <button
                type="button"
                className="scraps-btn scraps-btn-cancel"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="scraps-btn scraps-btn-submit"
                disabled={isSubmitting || !formTitle.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} style={{ display: "inline", marginRight: "6px", animation: "spin 1s linear infinite" }} />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}