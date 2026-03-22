"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "./main.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  Paperclip,
  Sparkles,
  CalendarPlus,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { Roboto } from "next/font/google";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

/* ──────────────────────────────────────────
   Initial welcome message
   ────────────────────────────────────────── */
const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "こんにちは！Aetherです。\nスケジュール管理、タスク登録、メモ作成など、なんでもお手伝いします。何をしましょうか？",
  timestamp: "—",
};

/* ──────────────────────────────────────────
   Quick actions
   ────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { icon: CalendarPlus, label: "予定を追加", prompt: "明日の14時に会議を追加して" },
  { icon: ListChecks, label: "タスク登録", prompt: "タスクを新しく登録して" },
  { icon: Sparkles, label: "今日の要約", prompt: "今日の予定とタスクをまとめて" },
];

/* ──────────────────────────────────────────
   Right sidebar data
   ────────────────────────────────────────── */
const NEXT_UP = [
  { time: "10:00", title: "チームMTG", color: "var(--color-accent-bright)" },
  { time: "14:00", title: "1on1 田中さん", color: "var(--color-amber)" },
  { time: "16:00", title: "コードレビュー", color: "var(--color-purple)" },
];

const TODAY_TASKS = [
  { title: "レポート提出", done: false, priority: "high" },
  { title: "企画書レビュー", done: false, priority: "medium" },
  { title: "MTGアジェンダ作成", done: true, priority: "high" },
  { title: "デザインFB返信", done: false, priority: "low" },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "var(--color-red)",
  medium: "var(--color-amber)",
  low: "var(--color-text-muted)",
};

/* ──────────────────────────────────────────
   Helper
   ────────────────────────────────────────── */
function getTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/* ──────────────────────────────────────────
   ChatPage Component
   ────────────────────────────────────────── */
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // ── Send message + stream response ──
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const timeStr = getTimeStr();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: timeStr,
    };

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aiMsgId, role: "assistant", content: "", timestamp: timeStr },
    ]);
    setInput("");
    setIsStreaming(true);

    const apiMessages = [
      ...messages.filter((m) => m.id !== "welcome"),
      userMsg,
    ].map(({ role, content }) => ({ role, content }));

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "API error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: m.content + parsed.text }
                    : m
                )
              );
            }
            if (parsed.status) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId && m.content === ""
                    ? { ...m, content: `⏳ ${parsed.status}` }
                    : m
                )
              );
              setTimeout(() => {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId && m.content.startsWith("⏳")
                      ? { ...m, content: "" }
                      : m
                  )
                );
              }, 100);
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
              ...m,
              content: `エラーが発生しました: ${(err as Error).message}\n\n.env に ANTHROPIC_API_KEY が設定されているか確認してください。`,
            }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages]);

  // ── Key handler: Enter=改行、Cmd/Ctrl+Enter=送信 ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      (e.metaKey || e.ctrlKey) &&
      !e.nativeEvent.isComposing
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Quick action ──
  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  // ── New conversation ──
  const handleNewChat = () => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setIsStreaming(false);
  };

  return (
    <div className="chat-layout">
      {/* ════════ Chat Main ════════ */}
      <div className="chat-main">
        {/* Messages */}
        <div className="chat-messages">
          <div className="chat-messages-inner">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-row ${msg.role === "user" ? "chat-row-user" : "chat-row-ai"}`}
              >
                {msg.role === "assistant" && (
                  <div className="chat-avatar chat-avatar-ai">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
                >
                  <div className="chat-bubble-content">
                    {msg.role === "assistant" &&
                      msg.content === "" &&
                      isStreaming ? (
                      <div className="typing-indicator">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    ) : msg.role === "assistant" ? (
                      /* AI応答: Markdownレンダリング */
                      <div className="md-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      /* ユーザー: そのまま表示（改行は保持） */
                      msg.content.split("\n").map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.content.split("\n").length - 1 && <br />}
                        </span>
                      ))
                    )}
                  </div>
                  {!(msg.content === "" && isStreaming) && (
                    <span className="chat-time">{msg.timestamp}</span>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="chat-avatar chat-avatar-user">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="chat-quick-actions">
          {messages.length > 1 && (
            <button className="quick-action-btn" onClick={handleNewChat}>
              <RotateCcw size={14} />
              <span>新しい会話</span>
            </button>
          )}
        </div>

        {/* Input — textarea with Cmd/Ctrl+Enter to send */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <button className="chat-input-action" title="ファイルを添付">
              <Bot size={16} />
            </button>
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="メッセージを入力... (Cmd/Ctrl + Enterで送信)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              rows={1}
            />
            <button
              className={`chat-send-btn ${input.trim() && !isStreaming ? "active" : ""}`}
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ════════ Right Sidebar ════════ */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-card">
          <h3 className="chat-sidebar-title">Next Up</h3>
          <div className="chat-sidebar-list">
            {NEXT_UP.map((item) => (
              <div key={item.time} className="sidebar-schedule-item">
                <span
                  className="sidebar-schedule-dot"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 6px ${item.color}40`,
                  }}
                />
                <span className="sidebar-schedule-time">{item.time}</span>
                <span className="sidebar-schedule-title">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-sidebar-card">
          <h3 className="chat-sidebar-title">Today&apos;s Tasks</h3>
          <div className="chat-sidebar-list">
            {TODAY_TASKS.map((task) => (
              <div key={task.title} className="sidebar-task-item">
                <span
                  className={`sidebar-task-check ${task.done ? "done" : ""}`}
                >
                  {task.done && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span
                  className={`sidebar-task-title ${task.done ? "done" : ""}`}
                >
                  {task.title}
                </span>
                <span
                  className="sidebar-task-dot"
                  style={{ background: PRIORITY_COLORS[task.priority] }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="chat-sidebar-card">
          <h3 className="chat-sidebar-title">Connections</h3>
          <div className="chat-sidebar-list">
            <div className="sidebar-connection">
              <span className="connection-dot connected" />
              <span className="connection-label">Google Calendar</span>
            </div>
            <div className="sidebar-connection">
              <span className="connection-dot connected" />
              <span className="connection-label">Notion</span>
            </div>
            <div className="sidebar-connection">
              <span className="connection-dot disconnected" />
              <span className="connection-label">LINE Bot</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}