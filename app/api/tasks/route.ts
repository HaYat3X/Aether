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
  return (
    prop.title?.map((t: { plain_text: string }) => t.plain_text).join("") ?? ""
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRichText(prop: any): string {
  if (!prop || prop.type !== "rich_text") return "";
  return (
    prop.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ??
    ""
  );
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDate(prop: any): string | null {
  if (!prop || prop.type !== "date" || !prop.date) return null;
  return prop.date.start ?? null;
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
        title: extractTitle(p["タスク"]),
        status: extractStatus(p["ステータス"]) ?? "未着手",
        priority: extractSelect(p["優先度"]) ?? "Medium",
        category: extractSelect(p["種類"]) ?? null,
        summary: extractRichText(p["概要"]) || null,
        estimatedHours: extractNumber(p["見積時間(h)"]),
        progress: extractNumber(p["進捗率"]), // 0.0〜1.0 or 0〜100
        dueDate: extractDate(p["期限"]),
      };
    });

    // ステータス順に並べる
    const STATUS_ORDER = ["未着手", "進行中", "保留", "完了"];
    tasks.sort(
      (
        a: { status: string; dueDate: string | null },
        b: { status: string; dueDate: string | null },
      ) => {
        const statusDiff =
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        if (statusDiff !== 0) return statusDiff;
        // 同ステータス内は期限が近い順
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      },
    );

    // ── サマリ計算 ──────────────────────────────────────
    const total = tasks.length;
    const byStatus = {
      未着手: tasks.filter((t: { status: string }) => t.status === "未着手")
        .length,
      進行中: tasks.filter((t: { status: string }) => t.status === "進行中")
        .length,
      完了: tasks.filter((t: { status: string }) => t.status === "完了").length,
      保留: tasks.filter((t: { status: string }) => t.status === "保留").length,
    };

    // 進捗率の平均（進捗率がnullのものは0扱い）
    const progressValues = tasks
      .filter((t: { status: string }) => t.status !== "保留")
      .map((t: { progress: number | null }) => {
        if (t.progress === null) return 0;
        // 0〜1 の小数 or 0〜100 の整数を 0〜1 に正規化
        return t.progress > 1 ? t.progress / 100 : t.progress;
      });
    const avgProgress =
      progressValues.length > 0
        ? progressValues.reduce((a: number, b: number) => a + b, 0) /
          progressValues.length
        : 0;

    // 合計見積時間
    const totalEstHours = tasks.reduce(
      (sum: number, t: { estimatedHours: number | null }) =>
        sum + (t.estimatedHours ?? 0),
      0,
    );
    const completedEstHours = tasks
      .filter((t: { status: string }) => t.status === "完了")
      .reduce(
        (sum: number, t: { estimatedHours: number | null }) =>
          sum + (t.estimatedHours ?? 0),
        0,
      );

    // 今日の日付（JST）
    const todayJST = (() => {
      const now = new Date();
      const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      return jst.toISOString().split("T")[0];
    })();

    const overdueCount = tasks.filter(
      (t: { status: string; dueDate: string | null }) =>
        t.dueDate && t.dueDate < todayJST && t.status !== "完了",
    ).length;
    const dueTodayCount = tasks.filter(
      (t: { status: string; dueDate: string | null }) =>
        t.dueDate === todayJST && t.status !== "完了",
    ).length;

    const summary = {
      total,
      byStatus,
      avgProgress: Math.round(avgProgress * 100),
      totalEstHours,
      completedEstHours,
      overdueCount,
      dueTodayCount,
      todayJST,
    };

    return Response.json(
      { success: true, count: tasks.length, tasks, summary },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err) {
    console.error("[Tasks API] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
