import { Client } from "@notionhq/client";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const NOTIF_DS_ID = process.env.NOTION_NOTIFICATION_DS_ID!;

// ── helpers ──────────────────────────────────────────────
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
function extractSelect(prop: any): string | null {
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCheckbox(prop: any): boolean {
  if (!prop || prop.type !== "checkbox") return false;
  return prop.checkbox === true;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUrl(prop: any): string | null {
  if (!prop || prop.type !== "url") return null;
  return prop.url ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCreatedTime(prop: any): string {
  if (!prop || prop.type !== "created_time") return new Date().toISOString();
  return prop.created_time ?? new Date().toISOString();
}

// ── GET /api/notifications ────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    if (!NOTIF_DS_ID) {
      throw new Error("NOTION_NOTIFICATION_DS_ID が設定されていません");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion.dataSources as any).query({
      data_source_id: NOTIF_DS_ID,
      page_size: 50,
      sorts: [{ property: "作成日時", direction: "descending" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications = (res.results ?? []).map((page: any) => {
      const p = page.properties ?? {};
      return {
        id: page.id,
        title: extractTitle(p["タイトル"]),
        body: extractRichText(p["本文"]),
        type: extractSelect(p["種別"]) ?? "schedule",
        isRead: extractCheckbox(p["既読"]),
        link: extractUrl(p["リンク"]),
        createdAt: extractCreatedTime(p["作成日時"]),
      };
    });

    return Response.json(
      { success: true, count: notifications.length, notifications },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err) {
    console.error("[Notifications API] GET error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
