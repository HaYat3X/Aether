/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const createEventSchema: Anthropic.Tool["input_schema"] = {
  type: "object" as const,
  properties: {
    title: {
      type: "string",
      description: "予定のタイトル（必須）",
    },
    date: {
      type: "string",
      description:
        "日付（YYYY-MM-DD形式、必須）。「明日」「来週月曜」などは適切な日付に変換する。",
    },
    start_time: {
      type: "string",
      description: "開始時刻（HH:mm形式、必須）",
    },
    end_time: {
      type: "string",
      description:
        "終了時刻（HH:mm形式、必須）。ユーザーが指定しない場合は開始の1時間後。",
    },
    description: {
      type: "string",
      description: "予定の説明（任意）",
    },
  },
  required: ["title", "date", "start_time", "end_time"],
};
