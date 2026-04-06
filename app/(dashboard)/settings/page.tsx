"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Save, Check, AlertCircle, Bot, FileText } from "lucide-react";
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
  tabs: { id: string; label: string; icon?: React.ElementType }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="settings-tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`settings-tab-btn${active === tab.id ? " active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {Icon && (
              <span className="tab-icon">
                <Icon size={12} />
              </span>
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
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
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setConfig((prev) => ({ ...prev, ...data }));
        }
      } catch {
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

      localStorage.setItem("lumo_config", JSON.stringify(config));

      setSaveStatus({ type: "success", message: "Lumoの設定を保存しました" });
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
    { id: "basic", label: "基本設定", icon: Bot },
    { id: "prompt", label: "プロンプト", icon: FileText },
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
                  AIアシスタントの基本的な設定を行います
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
                  AIアシスタントの基本的な性格と振る舞いを定義するプロンプトです
                </p>
              </div>

              <div className="settings-card-body">
                <FormField
                  label="プロンプト"
                  description="AIアシスタントの性格、会話スタイル、行動ガイドラインを記述してください"
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
あなたはLunoというAIアシスタントです。

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
