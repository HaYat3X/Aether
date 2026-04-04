"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import markdownToHtml from "zenn-markdown-html";
import "zenn-content-css";
import {
  ArrowLeft,
  Eye,
  Edit3,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import "./main.css";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type ViewMode = "edit" | "preview" | "split";

type SaveState = "idle" | "saving" | "saved" | "error";

/* ──────────────────────────────────────────
   frontmatter parser（route.tsと同じロジック）
   ────────────────────────────────────────── */
function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {} as Record<string, unknown>, body: raw };

  const [, fmStr, body] = match;
  const meta: Record<string, unknown> = {};

  for (const line of fmStr.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();
    if (rawVal === "true") meta[key] = true;
    else if (rawVal === "false") meta[key] = false;
    else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
      meta[key] = rawVal
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/['"]/g, ""))
        .filter(Boolean);
    } else {
      meta[key] = rawVal.replace(/^['"]|['"]$/g, "");
    }
  }
  return { meta, body: body.trim() };
}

/* ──────────────────────────────────────────
   Page
   ────────────────────────────────────────── */
export default function ZennEditorPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [rawContent, setRawContent] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── 記事取得 ── */
  const fetchArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/zenn/articles/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRawContent(data.content);
      setSha(data.sha);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  /* ── Markdown → HTML（非同期） ── */
  useEffect(() => {
    let cancelled = false;
    const { body } = parseFrontmatter(rawContent);
    (async () => {
      const html = await markdownToHtml(body, {
        embedOrigin: "https://embed.zenn.studio",
      });
      if (!cancelled) setHtmlPreview(html);
    })();
    return () => { cancelled = true; };
  }, [rawContent]);

  /* ── 保存（手動） ── */
  const handleSave = useCallback(async () => {
    if (saveState === "saving" || !sha) return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch(`/api/zenn/articles/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawContent, sha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      // 新しい sha に更新（次の保存のため）
      if (data.newSha) setSha(data.newSha);
      setSaveState("saved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveState("error");
      setSaveError((err as Error).message);
    }
  }, [slug, rawContent, sha, saveState]);

  /* ── Cmd/Ctrl+S で保存 ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  /* ── frontmatterから記事メタ取得 ── */
  const { meta, body } = parseFrontmatter(rawContent);

  const title = String(meta["title"] ?? slug);
  const emoji = String(meta["emoji"] ?? "📝");
  const topics = Array.isArray(meta["topics"]) ? (meta["topics"] as string[]) : [];
  const isPublished = meta["published"] === true;

  /* ── Zennリンク ── */
  const zennUrl = `https://zenn.dev/${process.env.NEXT_PUBLIC_GITHUB_OWNER ?? ""}/articles/${slug}`;

  /* ── slug コピー ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ──────────────────────────────────────────
     Loading / Error
     ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="editor-loading">
        <Loader2 size={24} className="editor-spinner" />
        <span>記事を読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-error-full">
        <AlertCircle size={32} />
        <div className="editor-error-msg">{error}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="editor-btn" onClick={fetchArticle}>再試行</button>
          <Link href="/zenn" className="editor-btn secondary">一覧に戻る</Link>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────
     Render
     ────────────────────────────────────────── */
  return (
    <div className="editor-root">
      {/* ── Toolbar ── */}
      <header className="editor-toolbar">
        <div className="editor-toolbar-left">
          <Link href="/zenn" className="editor-back-btn">
            <ArrowLeft size={15} />
            <span>一覧</span>
          </Link>

          <div className="editor-title-info">
            <span className="editor-title-emoji">{emoji}</span>
            <span className="editor-title-text">{title}</span>
            <span
              className={`editor-status-badge ${isPublished ? "published" : "draft"}`}
            >
              {isPublished ? "公開済み" : "下書き"}
            </span>
          </div>
        </div>

        <div className="editor-toolbar-right">
          {/* View mode トグル */}
          <div className="editor-view-toggle">
            <button
              className={`editor-toggle-btn ${viewMode === "edit" ? "active" : ""}`}
              onClick={() => setViewMode("edit")}
              title="編集のみ"
            >
              <Edit3 size={13} />
              <span>編集</span>
            </button>
            <button
              className={`editor-toggle-btn ${viewMode === "split" ? "active" : ""}`}
              onClick={() => setViewMode("split")}
              title="分割表示"
            >
              <span className="split-icon" />
              <span>分割</span>
            </button>
            <button
              className={`editor-toggle-btn ${viewMode === "preview" ? "active" : ""}`}
              onClick={() => setViewMode("preview")}
              title="プレビューのみ"
            >
              <Eye size={13} />
              <span>プレビュー</span>
            </button>
          </div>

          {/* Topics */}
          {topics.length > 0 && (
            <div className="editor-topics">
              {topics.slice(0, 3).map((t) => (
                <span key={t} className="editor-topic">#{t}</span>
              ))}
            </div>
          )}

          {/* Zennで開く */}
          {isPublished && (
            <a
              href={zennUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="editor-btn secondary small"
            >
              <ExternalLink size={12} />
              Zennで開く
            </a>
          )}

          {/* 保存ボタン */}
          <button
            className={`editor-btn save ${saveState}`}
            onClick={handleSave}
            disabled={saveState === "saving"}
          >
            {saveState === "saving" ? (
              <><Loader2 size={13} className="editor-spinner" />保存中...</>
            ) : saveState === "saved" ? (
              <><CheckCircle2 size={13} />保存済み</>
            ) : saveState === "error" ? (
              <><AlertCircle size={13} />エラー</>
            ) : (
              <><Save size={13} />保存</>
            )}
          </button>
        </div>
      </header>

      {/* ── Save error banner ── */}
      {saveState === "error" && saveError && (
        <div className="editor-save-error">
          <AlertCircle size={14} />
          {saveError}
        </div>
      )}

      {/* ── Editor Body ── */}
      <div className={`editor-body ${viewMode}`}>
        {/* 編集ペイン */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className="editor-pane editor-write-pane">
            <div className="editor-pane-header">
              <span>Markdown</span>
              <button className="editor-copy-btn" onClick={handleCopy}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "コピー済み" : slug}
              </button>
            </div>
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              spellCheck={false}
              placeholder="Markdown を入力..."
            />
          </div>
        )}

        {/* プレビューペイン */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="editor-pane editor-preview-pane">
            <div className="editor-pane-header">
              <span>プレビュー</span>
              <span className="editor-pane-hint">Zenn と同じレンダリング</span>
            </div>
            <div className="zenn-preview-scroll">
              <article className="zenn-preview-article">
                {/* Zennヘッダー風 */}
                <div className="zenn-preview-hero">
                  <div className="zenn-preview-emoji">{emoji}</div>
                  <h1 className="zenn-preview-title">{title}</h1>
                  {topics.length > 0 && (
                    <div className="zenn-preview-topics">
                      {topics.map((t) => (
                        <span key={t} className="zenn-preview-topic">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 本文 */}
                <div
                  className="znc"
                  dangerouslySetInnerHTML={{ __html: htmlPreview }}
                />
              </article>
            </div>
          </div>
        )}
      </div>

      {/* ── Shortcut hint ── */}
      <div className="editor-footer">
        <span>⌘S / Ctrl+S で保存</span>
      </div>
    </div>
  );
}