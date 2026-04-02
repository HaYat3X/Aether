/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const scrapUrlSchema: Anthropic.Tool["input_schema"] = {
  type: "object" as const,
  properties: {
    url: {
      type: "string",
      description: "スクラップ対象のURL（必須）",
    },
    kind: {
      type: "string",
      enum: ["アイデア", "気づき", "調べたいこと", "モヤモヤ", "ひとこと"],
      description: "種類。未指定の場合はAIがページ内容から自動判定する。",
    },
    memo: {
      type: "string",
      description: "ユーザーのひとこと・コメント（任意）",
    },
  },
  required: ["url"],
};
