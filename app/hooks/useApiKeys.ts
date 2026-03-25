"use client";

// ── useApiKeys フック ────────────────────────────────────
// APIキーのロード・保存・削除をまとめたカスタムフック
// 設定画面でも、APIを叩く画面でも共通で使える

import { useState, useEffect, useCallback } from "react";
import {
  type ApiKeyId,
  saveApiKey,
  loadAllApiKeys,
  removeApiKey,
} from "../../lib/api-keys";

export type ApiKeyStatus = "idle" | "saving" | "saved" | "error";

export interface ApiKeyState {
  value: string; // 復号済みの平文キー
  saved: boolean; // localStorageに保存済みか
  visible: boolean; // 入力欄で平文表示するか
  status: ApiKeyStatus;
}

export type ApiKeysState = Record<ApiKeyId, ApiKeyState>;

const DEFAULT_STATE: ApiKeyState = {
  value: "",
  saved: false,
  visible: false,
  status: "idle",
};

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeysState>({
    anthropic: { ...DEFAULT_STATE },
    notion: { ...DEFAULT_STATE },
  });
  const [loaded, setLoaded] = useState(false);

  // 初期ロード：localStorageから復号して展開
  useEffect(() => {
    (async () => {
      const all = await loadAllApiKeys();
      setKeys({
        anthropic: all.anthropic
          ? {
              value: all.anthropic,
              saved: true,
              visible: false,
              status: "idle",
            }
          : { ...DEFAULT_STATE },
        notion: all.notion
          ? { value: all.notion, saved: true, visible: false, status: "idle" }
          : { ...DEFAULT_STATE },
      });
      setLoaded(true);
    })();
  }, []);

  /** 入力値を更新（未保存状態に戻す） */
  const handleChange = useCallback((id: ApiKeyId, value: string) => {
    setKeys((prev) => ({
      ...prev,
      [id]: { ...prev[id], value, saved: false, status: "idle" },
    }));
  }, []);

  /** 暗号化してlocalStorageに保存 */
  const handleSave = useCallback(
    async (id: ApiKeyId) => {
      const value = keys[id].value.trim();
      if (!value) return;

      setKeys((prev) => ({ ...prev, [id]: { ...prev[id], status: "saving" } }));

      try {
        await saveApiKey(id, value);
        setKeys((prev) => ({
          ...prev,
          [id]: { ...prev[id], saved: true, status: "saved" },
        }));
        // 2秒後にsaved表示をリセット
        setTimeout(() => {
          setKeys((prev) => ({
            ...prev,
            [id]: { ...prev[id], status: "idle" },
          }));
        }, 2000);
      } catch {
        setKeys((prev) => ({
          ...prev,
          [id]: { ...prev[id], status: "error" },
        }));
      }
    },
    [keys],
  );

  /** localStorageから削除してstateをリセット */
  const handleDelete = useCallback((id: ApiKeyId) => {
    removeApiKey(id);
    setKeys((prev) => ({
      ...prev,
      [id]: { ...DEFAULT_STATE },
    }));
  }, []);

  /** 平文表示のトグル */
  const toggleVisible = useCallback((id: ApiKeyId) => {
    setKeys((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible },
    }));
  }, []);

  /** フォーカス時：保存済みなら再入力モードに切り替え */
  const handleFocus = useCallback((id: ApiKeyId) => {
    setKeys((prev) => {
      const current = prev[id];
      if (!current.visible && current.saved) {
        return { ...prev, [id]: { ...current, saved: false } };
      }
      return prev;
    });
  }, []);

  return {
    keys,
    loaded,
    handleChange,
    handleSave,
    handleDelete,
    toggleVisible,
    handleFocus,
  };
}
