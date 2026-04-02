/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const scrapRegisterSchema: Anthropic.Tool["input_schema"] = {
  type: "object" as const,
  properties: {
    title: {
      type: "string",
      description: "スクラップのタイトル（必須）",
    },
    summary: {
      type: "string",
      description: "スクラップの概要（必須）",
    },
    kind: {
      type: "string",
      enum: ["アイデア", "気づき", "調べたいこと", "モヤモヤ", "ひとこと"],
      description: "スクラップの種類（必須）",
    },
    source_url: {
      type: "string",
      description: "参照元URL（任意。URLスクラップの場合のみ設定）",
    },
  },
  required: ["title", "summary", "kind"],
};
