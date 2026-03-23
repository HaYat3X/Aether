import { Client } from "@notionhq/client";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const TASK_DS_ID = process.env.NOTION_TASK_DS_ID!;

// ── helpers ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(prop: any): string {
  if (!prop || prop.type !== "title") return "";
  return prop.title?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRichText(prop: any): string {
  if (!prop || prop.type !== "rich_text") return "";
  return prop.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractStatus(prop: any): string | null {
  if (!prop || prop.type !== "status") return null;
  return prop.status?.name ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSelect(prop: any): string | null {
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNumber(prop: any): number | null {
  if (!prop || prop.type !== "number") return null;
  return prop.number ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFormula(prop: any): string | null {
  if (!prop || prop.type !== "formula") return null;
  return prop.formula?.string ?? String(prop.formula?.number ?? "") ?? null;
}

// ── GET /api/tasks ─────────────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion.dataSources as any).query({
      data_source_id: TASK_DS_ID,
      page_size: 50,
      sorts: [{ property: "優先度", direction: "ascending" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks = (res.results ?? []).map((page: any) => {
      const p = page.properties ?? {};
      return {
        id: page.id,
        url: page.url ?? null,
        title:           extractTitle(p["タスク"]),
        status:          extractStatus(p["ステータス"]) ?? "未着手",
        priority:        extractSelect(p["優先度"]) ?? "Medium",
        category:        extractSelect(p["種類"]) ?? null,
        summary:         extractRichText(p["概要"]) || null,
        estimatedHours:  extractNumber(p["見積時間(h)"]),
        sprintStatus:    extractFormula(p["取得用：スプリントステータス"]),
      };
    });

    // ステータス順に並べる
    const STATUS_ORDER = ["未着手", "進行中", "完了", "保留"];
    tasks.sort(
      (a: { status: string }, b: { status: string }) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    );

    return Response.json(
      { success: true, count: tasks.length, tasks },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("[Tasks API] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}