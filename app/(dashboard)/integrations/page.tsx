"use client";

import { type ApiKeyId } from "@/lib/api-keys";
import { useApiKeys } from "../../hooks/useApiKeys";
import "./main.css";

// ── アイコン ────────────────────────────────────────────
const AnthropicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-3.654 0H6.57L0 20h3.603l1.357-3.415h6.43l-1.357-3.415H6.57l2.139-5.378 1.464 3.793z"
      fill="currentColor"
    />
  </svg>
);

const NotionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933z"
      fill="currentColor"
    />
  </svg>
);

// ── APIキー設定定義 ──────────────────────────────────────
interface ApiKeyConfig {
  id: ApiKeyId;
  label: string;
  description: string;
  placeholder: string;
  docsUrl: string;
  icon: React.ReactNode;
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    id: "anthropic",
    label: "Anthropic API Key",
    description:
      "Claude との対話に使用します。Anthropic Console から取得できます。",
    placeholder: "sk-ant-api03-...",
    docsUrl: "https://console.anthropic.com/",
    icon: <AnthropicIcon />,
  },
  {
    id: "notion",
    label: "Notion API Key",
    description:
      "タスクやログの読み書きに使用します。Notion インテグレーションから取得できます。",
    placeholder: "secret_...",
    docsUrl: "https://www.notion.so/my-integrations",
    icon: <NotionIcon />,
  },
];

// ── マスク表示 ──────────────────────────────────────────
function maskKey(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return (
    value.slice(0, 6) +
    "•".repeat(Math.min(value.length - 10, 20)) +
    value.slice(-4)
  );
}

// ── メインコンポーネント ────────────────────────────────
export default function SettingsPage() {
  const {
    keys,
    loaded,
    handleChange,
    handleSave,
    handleDelete,
    toggleVisible,
    handleFocus,
  } = useApiKeys();

  if (!loaded) {
    return (
      <div className="settings-loading">
        <div className="settings-loading-dot" />
      </div>
    );
  }

  return (
    <div className="settings-root">
      {/* セクションラベル */}
      <p className="settings-section-label">API キー</p>

      {/* カード一覧 */}
      {API_KEY_CONFIGS.map((config) => {
        const state = keys[config.id];
        const isSet = state.saved && state.value;
        const canSave = state.value.trim().length > 0 && !state.saved;

        const btnClass = [
          "settings-btn-save",
          state.status === "saving"
            ? "settings-btn-save-saving"
            : state.status === "saved"
              ? "settings-btn-save-saved"
              : canSave
                ? "settings-btn-save-active"
                : "settings-btn-save-disabled",
        ].join(" ");

        const btnLabel =
          state.status === "saving"
            ? "保存中..."
            : state.status === "saved"
              ? "✓ 保存済み"
              : "保存";

        return (
          <div key={config.id} className="settings-card">
            {/* カードヘッダー */}
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <div className="settings-card-icon">{config.icon}</div>
                <div>
                  <p className="settings-card-label">{config.label}</p>
                  <p className="settings-card-desc">{config.description}</p>
                </div>
              </div>
              <span
                className={`settings-badge ${isSet ? "settings-badge-set" : "settings-badge-unset"}`}
              >
                {isSet ? "設定済み" : "未設定"}
              </span>
            </div>

            {/* インプット */}
            <div className="settings-input-row">
              <div className="settings-input-wrap">
                <input
                  className="settings-input"
                  type={state.visible ? "text" : "password"}
                  value={
                    state.visible
                      ? state.value
                      : state.saved
                        ? maskKey(state.value)
                        : state.value
                  }
                  onChange={(e) => {
                    if (!state.visible && state.saved) return;
                    handleChange(config.id, e.target.value);
                  }}
                  onFocus={() => handleFocus(config.id)}
                  placeholder={config.placeholder}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  className="settings-input-eye"
                  onClick={() => toggleVisible(config.id)}
                  tabIndex={-1}
                >
                  {state.visible ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                className={btnClass}
                onClick={() => handleSave(config.id)}
                disabled={
                  !canSave ||
                  state.status === "saving" ||
                  state.status === "saved"
                }
              >
                {btnLabel}
              </button>
            </div>

            {/* フッター */}
            <div className="settings-card-footer">
              <a
                href={config.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="settings-docs-link"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                キーを取得する
              </a>
              {isSet && (
                <button
                  className="settings-btn-delete"
                  onClick={() => handleDelete(config.id)}
                >
                  削除
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* 注意書き */}
      <div className="settings-notice">
        <span className="settings-notice-icon">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <p className="settings-notice-text">
          <strong>API キーはこのブラウザにのみ保存されます。</strong>
          サーバーには送信されません。
          ブラウザのデータを削除するとキーも失われます。複数端末で使う場合は各端末で設定してください。
        </p>
      </div>
    </div>
  );
}
