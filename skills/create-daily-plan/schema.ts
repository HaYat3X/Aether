/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const createDailyPlanSchema: Anthropic.Tool["input_schema"] = {
  type: "object" as const,
  properties: {
    items: {
      type: "array",
      description: "デイリープランの各作業項目の配列",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "作業名（必須）",
          },
          start_time: {
            type: "string",
            description: "開始時刻 HH:mm（必須）",
          },
          end_time: {
            type: "string",
            description: "終了時刻 HH:mm（必須）",
          },
          memo: {
            type: "string",
            description: "メモ（任意）",
          },
          category: {
            type: "string",
            enum: [
              "目標関連",
              "実務・定常",
              "プロジェクト",
              "突発・その他",
              "雑務",
            ],
            description: "タスクの種類（任意）。関連タスクの種類から引き継ぐ。",
          },
          related_task_id: {
            type: "string",
            description: "関連タスクのNotion page ID（任意）",
          },
        },
        required: ["title", "start_time", "end_time"],
      },
    },
    date: {
      type: "string",
      description: "日付 YYYY-MM-DD。省略時は今日。",
    },
  },
  required: ["items"],
};
