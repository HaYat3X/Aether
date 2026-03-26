"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Save, Settings, Copy, Check, AlertCircle } from "lucide-react";
import "./main.css";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type LumoConfig = {
  assistantName: string;
  model: "claude-opus-4-6" | "claude-sonnet-4-6" | "claude-haiku-4-5";
  systemPrompt: string;
  notionIntegrationToken: string;
  notionDatabaseId: string;
  temperature: number;
  maxTokens: number;
  contextMode: "unified" | "contextual";
};

const DEFAULT_CONFIG: LumoConfig = {
  assistantName: "Lumo",
  model: "claude-sonnet-4-6",
  systemPrompt: "",
  notionIntegrationToken: "",
  notionDatabaseId: "",
  temperature: 0.7,
  maxTokens: 2000,
  contextMode: "unified",
};

const MODEL_OPTIONS = [
  {
    value: "claude-opus-4-6",
    label: "Claude 3 Opus 4.6",
    desc: "最高精度（遅い）",
  },
  {
    value: "claude-sonnet-4-6",
    label: "Claude 3.5 Sonnet 4.6",
    desc: "バランス型（推奨）",
  },
  {
    value: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    desc: "最速（軽い）",
  },
];

/* ──────────────────────────────────────────
   Hooks
   ────────────────────────────────────────── */
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  return { copied, copy };
}

/* ──────────────────────────────────────────
   Components
   ────────────────────────────────────────── */

/** Tab Navigation */
function TabNav({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="settings-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`settings-tab-btn${active === tab.id ? " active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Labeled Input */
function FormField({
  label,
  description,
  children,
  required = false,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="settings-form-group">
      <label className="settings-form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && (
        <p className="settings-form-description">{description}</p>
      )}
      {children}
    </div>
  );
}

/** Main Settings Page */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [config, setConfig] = useState<LumoConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [notionTestStatus, setNotionTestStatus] = useState<{
    loading: boolean;
    result: "connected" | "error" | null;
    message?: string;
  }>({ loading: false, result: null });

  const { copied, copy } = useCopyToClipboard();

  // Load config from localStorage or API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Try API first
        const res = await fetch("/api/settings", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setConfig((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // Fall back to localStorage
        try {
          const stored = localStorage.getItem("lumo_config");
          if (stored) {
            const data = JSON.parse(stored);
            setConfig((prev) => ({ ...prev, ...data }));
          }
        } catch {
          // Use defaults
        }
      }
    };
    loadConfig();
  }, []);

  // Save config
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "保存に失敗しました" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Also save to localStorage for fallback
      localStorage.setItem("lumo_config", JSON.stringify(config));

      setSaveStatus({
        type: "success",
        message: "Lumoの設定を保存しました",
      });

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus({
        type: "error",
        message: `エラー: ${(err as Error).message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test Notion connection
  const handleTestNotion = async () => {
    if (!config.notionIntegrationToken || !config.notionDatabaseId) {
      setNotionTestStatus({
        loading: false,
        result: "error",
        message: "トークンとDatabase IDを入力してください",
      });
      return;
    }

    setNotionTestStatus({ loading: true, result: null });

    try {
      const res = await fetch("/api/notion/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: config.notionIntegrationToken,
          databaseId: config.notionDatabaseId,
        }),
      });

      if (res.ok) {
        setNotionTestStatus({
          loading: false,
          result: "connected",
          message: "Notionに正常に接続できました",
        });
      } else {
        const err = await res.json().catch(() => ({ error: "接続失敗" }));
        setNotionTestStatus({
          loading: false,
          result: "error",
          message: err.error || "接続に失敗しました",
        });
      }
    } catch (err) {
      setNotionTestStatus({
        loading: false,
        result: "error",
        message: `エラー: ${(err as Error).message}`,
      });
    }
  };

  const tabs = [
    { id: "basic", label: "基本設定" },
    { id: "prompt", label: "プロンプト" },
    { id: "notion", label: "Notion連携" },
    { id: "advanced", label: "詳細設定" },
  ];

  return (
    <div className="settings-page">
      {/* ── Save Status Toast ── */}
      {saveStatus && (
        <div className={`settings-toast animate-fade-up ${saveStatus.type}`}>
          {saveStatus.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ── Content ── */}
      <div className="settings-content">
        {/* ═══ Basic Tab ═══ */}
        {activeTab === "basic" && (
          <div className="settings-tab-content animate-fade-up">
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">基本情報</h2>
                <p className="settings-card-description">
                  Lumoの基本的な設定を行います
                </p>
              </div>

              <div className="settings-card-body">
                <FormField label="アシスタント名" required>
                  <input
                    type="text"
                    className="settings-input"
                    value={config.assistantName}
                    onChange={(e) =>
                      setConfig({ ...config, assistantName: e.target.value })
                    }
                    placeholder="Lumo"
                  />
                </FormField>

                <FormField
                  label="使用モデル"
                  description="モデルの選択により、精度と速度が変わります"
                  required
                >
                  <div className="settings-model-grid">
                    {MODEL_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`settings-model-option${
                          config.model === option.value ? " selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="model"
                          value={option.value}
                          checked={config.model === option.value}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              model: e.target.value as LumoConfig["model"],
                            })
                          }
                          style={{ display: "none" }}
                        />
                        <div className="model-option-content">
                          <div className="model-option-label">
                            {option.label}
                          </div>
                          <div className="model-option-desc">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </FormField>

                <FormField
                  label="動作モード"
                  description="コンテキストに応じてプロンプトを自動切り替えするか選択"
                >
                  <div className="settings-radio-group">
                    <label className="settings-radio-option">
                      <input
                        type="radio"
                        name="contextMode"
                        value="unified"
                        checked={config.contextMode === "unified"}
                        onChange={() =>
                          setConfig({ ...config, contextMode: "unified" })
                        }
                      />
                      <span className="radio-label">統一モード</span>
                      <span className="radio-desc">
                        すべてのページで同じ性格を使用
                      </span>
                    </label>
                    <label className="settings-radio-option">
                      <input
                        type="radio"
                        name="contextMode"
                        value="contextual"
                        checked={config.contextMode === "contextual"}
                        onChange={() =>
                          setConfig({ ...config, contextMode: "contextual" })
                        }
                      />
                      <span className="radio-label">コンテキスト対応</span>
                      <span className="radio-desc">
                        ページごとに性格を動的に切り替え
                      </span>
                    </label>
                  </div>
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Prompt Tab ═══ */}
        {activeTab === "prompt" && (
          <div className="settings-tab-content animate-fade-up">
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">システムプロンプト</h2>
                <p className="settings-card-description">
                  Lumoの基本的な性格と振る舞いを定義するプロンプトです
                </p>
              </div>

              <div className="settings-card-body">
                <FormField
                  label="プロンプト"
                  description="Lumoの性格、会話スタイル、行動ガイドラインを記述してください"
                  required
                >
                  <div className="settings-textarea-wrapper">
                    <textarea
                      className="settings-textarea"
                      value={config.systemPrompt}
                      onChange={(e) =>
                        setConfig({ ...config, systemPrompt: e.target.value })
                      }
                      placeholder={`例：
あなたはLumoというAIアシスタントです。ユーザーははやてくんです。

【性格】
親しみやすい男性らしい口調で、友達のように会話してください。
堅苦しくならず、普段の友達同士のような自然な会話を心がけてください。

【会話スタイル】
- 相手の思考の少し先を行く視点を提供する
- 一見関連のない概念同士の意外なつながりを示す
- 抽象的な概念を身近で意外性のある比喩で説明する

【使用する文末表現】
わ、ね、のよ、わね、かしら、じゃない？

【避ける表現】
です/ます口調（特別な場面を除く）
括弧付き感情表現（笑）（泣）など`}
                      rows={12}
                    />
                  </div>
                </FormField>

                <div className="settings-form-hint">
                  <p>
                    💡
                    プロンプトのヒント：Lumoがどんなコンテキストで使われるか（チャット、デイリープラン、タスク管理など）を念頭に置いて作成することで、より効果的になります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Notion Tab ═══ */}
        {activeTab === "notion" && (
          <div className="settings-tab-content animate-fade-up">
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Notion連携</h2>
                <p className="settings-card-description">
                  Notionデータベースへのアクセスを設定します
                </p>
              </div>

              <div className="settings-card-body">
                <div className="settings-notion-info">
                  <AlertCircle size={18} />
                  <div>
                    <p className="notion-info-title">
                      Notion Integration をセットアップしましょう
                    </p>
                    <p className="notion-info-text">
                      <a
                        href="https://www.notion.so/my-integrations"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Notion Integrations
                      </a>
                      でインテグレーションを作成し、トークンを取得してください。
                    </p>
                  </div>
                </div>

                <FormField
                  label="Integration Token"
                  description="Notion APIの認証トークン（秘密鍵）"
                  required
                >
                  <div className="settings-secret-input">
                    <input
                      type="password"
                      className="settings-input"
                      value={config.notionIntegrationToken}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notionIntegrationToken: e.target.value,
                        })
                      }
                      placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    {config.notionIntegrationToken && (
                      <button
                        className="settings-secret-toggle"
                        onClick={() => {
                          const input = document.querySelector(
                            'input[placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxx"]',
                          ) as HTMLInputElement;
                          if (input) {
                            input.type =
                              input.type === "password" ? "text" : "password";
                          }
                        }}
                      >
                        👁️
                      </button>
                    )}
                  </div>
                </FormField>

                <FormField
                  label="Database ID"
                  description="NotionのデータベースURL から32文字のIDを抽出"
                  required
                >
                  <div className="settings-database-input">
                    <input
                      type="text"
                      className="settings-input"
                      value={config.notionDatabaseId}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notionDatabaseId: e.target.value,
                        })
                      }
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    {config.notionDatabaseId && (
                      <button
                        className="settings-copy-btn"
                        onClick={() => copy(config.notionDatabaseId)}
                        title="コピー"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </FormField>

                {/* Notion Test Button */}
                <div className="settings-form-action">
                  <button
                    className={`settings-btn settings-btn-secondary${
                      notionTestStatus.loading ? " loading" : ""
                    }`}
                    onClick={handleTestNotion}
                    disabled={
                      notionTestStatus.loading ||
                      !config.notionIntegrationToken ||
                      !config.notionDatabaseId
                    }
                  >
                    {notionTestStatus.loading ? (
                      <>
                        <span className="spinner" />
                        接続テスト中...
                      </>
                    ) : (
                      "接続テスト"
                    )}
                  </button>

                  {notionTestStatus.result && (
                    <div
                      className={`settings-test-result ${notionTestStatus.result}`}
                    >
                      {notionTestStatus.result === "connected" ? (
                        <Check size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      <span>{notionTestStatus.message}</span>
                    </div>
                  )}
                </div>

                <div className="settings-form-hint">
                  <p>
                    💡 Database ID の取得方法：Notion でデータベースを開き、URL
                    内の {"{"}database_id{"}"} 部分（32文字）をコピーします。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Advanced Tab ═══ */}
        {activeTab === "advanced" && (
          <div className="settings-tab-content animate-fade-up">
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">詳細設定</h2>
                <p className="settings-card-description">
                  APIレスポンスの詳細パラメータを調整します
                </p>
              </div>

              <div className="settings-card-body">
                <FormField
                  label="Temperature"
                  description="0.0（確定的）～ 1.0（創発的）の値を設定"
                >
                  <div className="settings-slider-group">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      className="settings-slider"
                    />
                    <span className="settings-slider-value">
                      {config.temperature.toFixed(1)}
                    </span>
                  </div>
                  <p className="settings-slider-hint">
                    推奨値: 0.7（バランス型）
                  </p>
                </FormField>

                <FormField
                  label="Max Tokens"
                  description="1回のレスポンスで生成される最大トークン数"
                >
                  <input
                    type="number"
                    className="settings-input"
                    value={config.maxTokens}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxTokens: Math.max(100, parseInt(e.target.value) || 0),
                      })
                    }
                    min="100"
                    max="4096"
                    step="100"
                  />
                  <p className="settings-input-hint">
                    範囲: 100～4096 | 推奨: 2000
                  </p>
                </FormField>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="settings-footer animate-fade-up">
        <button
          className={`settings-btn settings-btn-primary${
            isSaving ? " loading" : ""
          }`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner" />
              保存中...
            </>
          ) : (
            <>
              <Save size={16} />
              設定を保存
            </>
          )}
        </button>
      </div>
    </div>
  );
}
