/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import { getNotionClient } from "@/services/NotionClient";
import { getTodayJST } from "@/utils/getTodayJST";
import { toISODateTime } from "@/utils/toISODateTime";

/* ──────────────────────────────────────────
   環境変数
   ────────────────────────────────────────── */
const DAILY_DS_ID = process.env.NOTION_DAILY_DS_ID!;

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
type DailyPlanItem = {
  title: string;
  start_time: string;
  end_time: string;
  memo?: string;
  target_progress?: number;
  related_task_id?: string;
};

export type CreateDailyPlanInput = {
  items: DailyPlanItem[];
  date?: string;
};

type CreateResult = {
  title: string;
  start: string;
  end: string;
  success: boolean;
  error?: string;
};

/* ──────────────────────────────────────────
   ユーティリティ
   Notionプロパティを生成
   ────────────────────────────────────────── */
const buildProperties = (
  item: DailyPlanItem,
  startISO: string,
  endISO: string,
) => {
  const properties: Record<string, unknown> = {
    作業: {
      title: [{ text: { content: item.title } }],
    },
    ステータス: {
      status: { name: "未着手" },
    },
    作業時間: {
      date: {
        start: startISO,
        end: endISO,
      },
    },
  };

  if (item.memo) {
    properties["メモ"] = {
      rich_text: [{ text: { content: item.memo } }],
    };
  }

  if (item.target_progress !== undefined) {
    properties["目標進捗率"] = {
      number: item.target_progress,
    };
  }

  if (item.related_task_id) {
    properties["TGP - タスク"] = {
      relation: [{ id: item.related_task_id }],
    };
  }

  return properties;
};

/* ──────────────────────────────────────────
   デイリープランを作成
   ────────────────────────────────────────── */
export const createDailyPlan = async (input: CreateDailyPlanInput) => {
  const dateStr = input.date ?? getTodayJST();

  const results: CreateResult[] = [];

  for (const item of input.items) {
    const startISO = toISODateTime(dateStr, item.start_time);
    const endISO = toISODateTime(dateStr, item.end_time);

    try {
      const properties = buildProperties(item, startISO, endISO);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (getNotionClient.pages as any).create({
        parent: { data_source_id: DAILY_DS_ID },
        properties,
      });

      results.push({
        title: item.title,
        start: item.start_time,
        end: item.end_time,
        success: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      console.error(`[DailyPlan] 作成失敗: ${item.title}`, errorMessage);

      results.push({
        title: item.title,
        start: item.start_time,
        end: item.end_time,
        success: false,
        error: errorMessage,
      });
    }
  }

  const created = results.filter((r) => r.success).length;

  return {
    success: created > 0,
    date: dateStr,
    total: results.length,
    created,
    failed: results.length - created,
    items: results,
  };
};
