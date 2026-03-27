// app/api/tasks/update/route.ts
import { Client } from "@notionhq/client";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ── POST /api/tasks/update ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { taskId, newStatus } = await req.json();

    if (!taskId || !newStatus) {
      return Response.json(
        { error: "taskId and newStatus are required" },
        { status: 400 },
      );
    }

    // Valid statuses
    const VALID_STATUSES = ["未着手", "進行中", "完了", "保留"];
    if (!VALID_STATUSES.includes(newStatus)) {
      return Response.json(
        { error: `Invalid status: ${newStatus}` },
        { status: 400 },
      );
    }

    // Update the page property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {
      page_id: taskId,
      properties: {
        ステータス: {
          status: {
            name: newStatus, // status は { name: string } の形式を期待
          },
        },
      },
    };

    await notion.pages.update(updatePayload);

    return Response.json(
      { success: true, taskId, newStatus },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err) {
    console.error("[Tasks Update API] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
