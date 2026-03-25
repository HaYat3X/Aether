// ── APIキー管理ユーティリティ ───────────────────────────
// localStorageへの暗号化保存・取り出しをまとめたモジュール

import { encryptApiKey, decryptApiKey } from "./crypto";

export type ApiKeyId = "anthropic" | "notion";

export const STORAGE_KEYS: Record<ApiKeyId, string> = {
  anthropic: "aether_enc_anthropic_key",
  notion: "aether_enc_notion_key",
};

/** 暗号化してlocalStorageに保存 */
export async function saveApiKey(
  id: ApiKeyId,
  plainText: string,
): Promise<void> {
  const encrypted = await encryptApiKey(plainText);
  localStorage.setItem(STORAGE_KEYS[id], encrypted);
}

/** localStorageから取り出して復号。未設定の場合はnullを返す */
export async function loadApiKey(id: ApiKeyId): Promise<string | null> {
  const stored = localStorage.getItem(STORAGE_KEYS[id]);
  if (!stored) return null;
  const plain = await decryptApiKey(stored);
  return plain || null;
}

/** localStorageから削除 */
export function removeApiKey(id: ApiKeyId): void {
  localStorage.removeItem(STORAGE_KEYS[id]);
}

/** 全APIキーをまとめてロード */
export async function loadAllApiKeys(): Promise<
  Record<ApiKeyId, string | null>
> {
  const [anthropic, notion] = await Promise.all([
    loadApiKey("anthropic"),
    loadApiKey("notion"),
  ]);
  return { anthropic, notion };
}
