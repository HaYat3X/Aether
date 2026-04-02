import { Client } from "@notionhq/client";
import { getEvents, createEvent } from "./googleCalendar";
import { queryNotionDatabase, searchNotion } from "./notionRenderer";
import { createDailyPlan } from "./dailyPlan";

/* ──────────────────────────────────────────
   Notion Client
   ────────────────────────────────────────── */
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// タスクDB の data_source_id (collection ID)
const TASK_DB_ID = process.env.NOTION_TASK_DB_ID!;

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type CreateTaskInput = {
  title: string;
  summary?: string;
  priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest";
  category?: "目標関連" | "実務・定常" | "プロジェクト" | "突発・その他";
  estimated_hours?: number;
};

/* ──────────────────────────────────────────
   Create Task
   ────────────────────────────────────────── */
export async function createTask(input: CreateTaskInput) {
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

  const response = await notion.pages.create({
    parent: { database_id: TASK_DB_ID },
    properties: properties as Parameters<
      typeof notion.pages.create
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
}

/* ──────────────────────────────────────────
   Tool Executor
   ────────────────────────────────────────── */
export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
): Promise<string> {
  try {
    switch (toolName) {
      case "create_task": {
        const result = await createTask(toolInput as CreateTaskInput);
        return JSON.stringify(result);
      }
      case "query_notion_database": {
        const result = await queryNotionDatabase(
          toolInput as {
            database_name: string;
            status_filter?: string;
            sprint_status_filter?: string;
            limit?: number;
          },
        );
        return JSON.stringify(result);
      }
      case "search_notion": {
        const result = await searchNotion(
          toolInput as { query: string; limit?: number },
        );
        return JSON.stringify(result);
      }
      case "create_daily_plan": {
        const result = await createDailyPlan(
          toolInput as {
            items: Array<{
              title: string;
              start_time: string;
              end_time: string;
              memo?: string;
              target_progress?: number;
              related_task_id?: string;
            }>;
            date?: string;
          },
        );
        return JSON.stringify(result);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Tool execution failed";
    console.error(`Tool ${toolName} error:`, err);
    return JSON.stringify({ error: message });
  }
}
