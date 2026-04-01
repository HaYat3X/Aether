import { Client } from "@notionhq/client";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ── POST /api/notifications/read ──────────────────────────
// body: { id: string } | { ids: string[] } | { all: true }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 全件既読
    if (body.all === true) {
      const NOTIF_DS_ID = process.env.NOTION_NOTIFICATION_DS_ID!;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (notion.dataSources as any).query({
        data_source_id: NOTIF_DS_ID,
        page_size: 100,
        filter: {
          property: "既読",
          checkbox: { equals: false },
        },
      });

      const ids: string[] = (res.results ?? []).map(
        (p: { id: string }) => p.id,
      );

      await Promise.all(
        ids.map((pageId) =>
          notion.pages.update({
            page_id: pageId,
            properties: {
              既読: { checkbox: true },
            } as Parameters<typeof notion.pages.update>[0]["properties"],
          }),
        ),
      );

      return Response.json({ success: true, updated: ids.length });
    }

    // 複数 or 単体
    const ids: string[] = body.ids ?? (body.id ? [body.id] : []);
    if (ids.length === 0) {
      return Response.json(
        { error: "id / ids / all が必要です" },
        { status: 400 },
      );
    }

    await Promise.all(
      ids.map((pageId) =>
        notion.pages.update({
          page_id: pageId,
          properties: {
            既読: { checkbox: true },
          } as Parameters<typeof notion.pages.update>[0]["properties"],
        }),
      ),
    );

    return Response.json({ success: true, updated: ids.length });
  } catch (err) {
    console.error("[Notifications/read] POST error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
