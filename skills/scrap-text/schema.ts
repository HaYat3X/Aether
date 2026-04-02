/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const scrapTextSchema: Anthropic.Tool["input_schema"] = {
  type: "object" as const,
  properties: {
    content: {
      type: "string",
      description: "スクラップ対象のテキスト・メモ・壁打ち内容（必須）",
    },
    kind: {
      type: "string",
      enum: ["アイデア", "気づき", "調べたいこと", "モヤモヤ", "ひとこと"],
      description: "種類。未指定の場合はAIが内容から自動判定する。",
    },
    context: {
      type: "string",
      description:
        "補足コンテキスト。どういった状況で生まれた内容かなど（任意）",
    },
  },
  required: ["content"],
};
