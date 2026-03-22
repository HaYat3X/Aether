import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   Tool Definitions for Claude API
   ────────────────────────────────────────── */

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description: `Notionのタスク管理データベースに新しいタスクを登録する。
ユーザーが「タスクを登録して」「○○をやらないと」などタスク追加の意図を示した場合に使用する。
タスク名は必須。それ以外は省略可能で、省略された場合はデフォルト値が使われる。`,
    input_schema: {
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
      },
      required: ["title"],
    },
  },
];