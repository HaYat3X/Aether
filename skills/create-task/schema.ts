/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const createTaskSchema: Anthropic.Tool["input_schema"] = {
  type: "object" as const,
  properties: {
    title: {
      type: "string",
      description: "タスクのタイトル（必須）",
    },
    summary: {
      type: "string",
      description: "タスクの概要・詳細説明（任意）",
    },
    priority: {
      type: "string",
      enum: ["Highest", "High", "Medium", "Low", "Lowest"],
      description:
        "優先度。ユーザーが明示しない場合はMediumをデフォルトとする。",
    },
    category: {
      type: "string",
      enum: ["目標関連", "実務・定常", "プロジェクト", "突発・その他"],
      description:
        "タスクの種類。ユーザーが明示しない場合は「突発・その他」をデフォルトとする。",
    },
    estimated_hours: {
      type: "number",
      description: "見積時間（時間単位、任意）",
    },
    deadline: {
      type: "string",
      format: "date",
      description: "期限（日付単位、任意）",
    },
  },
  required: ["title"],
};
