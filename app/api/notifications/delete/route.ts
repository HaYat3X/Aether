import { Client } from "@notionhq/client";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ── DELETE /api/notifications/delete ─────────────────────
// body: { id: string } | { ids: string[] } | { readAll: true }
// Notionではページの完全削除はできないのでアーカイブ(archived:true)で代用
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 既読をすべて削除
    if (body.readAll === true) {
      const NOTIF_DS_ID = process.env.NOTION_NOTIFICATION_DS_ID!;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (notion.dataSources as any).query({
        data_source_id: NOTIF_DS_ID,
        page_size: 100,
        filter: {
          property: "既読",
          checkbox: { equals: true },
        },
      });

      const ids: string[] = (res.results ?? []).map(
        (p: { id: string }) => p.id,
      );

      await Promise.all(
        ids.map((pageId) =>
          notion.pages.update({
            page_id: pageId,
            archived: true,
          }),
        ),
      );

      return Response.json({ success: true, deleted: ids.length });
    }

    // 複数 or 単体
    const ids: string[] = body.ids ?? (body.id ? [body.id] : []);
    if (ids.length === 0) {
      return Response.json(
        { error: "id / ids / readAll が必要です" },
        { status: 400 },
      );
    }

    await Promise.all(
      ids.map((pageId) =>
        notion.pages.update({
          page_id: pageId,
          archived: true,
        }),
      ),
    );

    return Response.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error("[Notifications/delete] POST error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
