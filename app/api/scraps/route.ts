import { NextRequest } from "next/server";
import { getAllScraps, createScrap } from "./scraps";

/* ──────────────────────────────────────────
   Next.js — キャッシュ無効化
   ────────────────────────────────────────── */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ──────────────────────────────────────────
   GET /api/scraps
   ────────────────────────────────────────── */
export async function GET() {
    try {
        const items = await getAllScraps();

        return Response.json(
            {
                success: true,
                count: items.length,
                items,
            },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                    Pragma: "no-cache",
                },
            }
        );
    } catch (err) {
        console.error("[Scraps API] GET error:", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        return Response.json(
            {
                error: message,
            },
            { status: 500 }
        );
    }
}

/* ──────────────────────────────────────────
   POST /api/scraps
   ────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    try {
        const { title, content, category } = await req.json();

        if (!title || !content) {
            return Response.json(
                { error: "title and content are required" },
                { status: 400 }
            );
        }

        const result = await createScrap({
            title,
            content,
            category: category ?? null,
        });

        return Response.json(
            {
                ...result,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("[Scraps API] POST error:", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        return Response.json(
            {
                error: message,
            },
            { status: 500 }
        );
    }
}