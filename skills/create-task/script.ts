import { getNotionClient } from "@/services/NotionClient";

/* ──────────────────────────────────────────
   環境変数
   ────────────────────────────────────────── */
const TASK_DB_ID = process.env.NOTION_TASK_DB_ID!;

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
export type CreateTaskInput = {
  title: string;
  summary?: string;
  priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest";
  category?: "目標関連" | "実務・定常" | "プロジェクト" | "突発・その他";
  estimated_hours?: number;
  deadline?: Date;
};

/* ──────────────────────────────────────────
   タスクを作成
   ────────────────────────────────────────── */
export const createTask = async (input: CreateTaskInput) => {
  const properties: Record<string, unknown> = {
    タスク: {
      title: [{ text: { content: input.title } }],
    },
    ステータス: {
      status: { name: "未着手" },
    },
    優先度: {
      select: { name: input.priority ?? "Medium" },
    },
    種類: {
      select: { name: input.category ?? "突発・その他" },
    },
    期限: input.deadline
      ? {
          date: {
            start: input.deadline,
          },
        }
      : undefined,
  };

  if (input.summary) {
    properties["概要"] = {
      rich_text: [{ text: { content: input.summary } }],
    };
  }

  if (input.estimated_hours !== undefined) {
    properties["見積時間(h)"] = {
      number: input.estimated_hours,
    };
  }

  const response = await getNotionClient.pages.create({
    parent: { database_id: TASK_DB_ID },
    properties: properties as Parameters<
      typeof getNotionClient.pages.create
    >[0]["properties"],
  });

  return {
    success: true,
    taskId: response.id,
    url: (response as { url?: string }).url ?? null,
    title: input.title,
    priority: input.priority ?? "Medium",
    category: input.category ?? "突発・その他",
  };
};
