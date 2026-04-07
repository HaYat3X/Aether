/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const queryNotionDatabaseSchema: Anthropic.Tool["input_schema"] = {
  type: "object" as const,
  properties: {
    database_name: {
      type: "string",
      enum: ["タスク", "デイリープラン", "スクラップ", "ナレッジ"],
      description: "取得したいデータベース名",
    },
    status_filter: {
      type: "string",
      description:
        "ステータスでフィルター（任意）。例: '未着手', '進行中', '完了'",
    },
    limit: {
      type: "number",
      description: "取得件数の上限（デフォルト20）",
    },
  },
  required: ["database_name"],
};
