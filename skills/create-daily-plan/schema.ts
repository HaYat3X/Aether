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
          target_progress: {
            type: "number",
            description: "目標進捗率 0.0〜1.0（任意）",
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
