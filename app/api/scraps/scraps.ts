import { Client } from "@notionhq/client";

/* ──────────────────────────────────────────
   Notion Client
   ────────────────────────────────────────── */
const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

// データソース ID （取得用）
const SCRAP_DS_ID = process.env.NOTION_SCRAP_DS_ID!;

// データベース ID （作成用）
const SCRAP_DB_ID = process.env.NOTION_SCRAP_DB_ID!;

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type ScrapItem = {
    id: string;
    title: string;
    overview: string;
    category?: string | null;
    status?: string | null;
    createdAt: string;
    url?: string | null;
};

/* ──────────────────────────────────────────
   Helper: プロパティ値を抽出
   ────────────────────────────────────────── */
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
function extractSelect(prop: any): string | null {
    if (!prop || prop.type !== "select") return null;
    return prop.select?.name ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCreatedTime(prop: any): string {
    if (!prop || prop.type !== "created_time") return new Date().toISOString();
    return prop.created_time ?? new Date().toISOString();
}

/* ──────────────────────────────────────────
   Get All Scraps (using data source ID)
   ────────────────────────────────────────── */
export async function getAllScraps(): Promise<ScrapItem[]> {
    try {
        if (!SCRAP_DS_ID) {
            throw new Error("NOTION_SCRAP_DS_ID is not set in environment variables");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
            data_source_id: SCRAP_DS_ID,
            page_size: 100,
            sorts: [
                {
                    property: "作成日",
                    direction: "descending",
                },
            ],
        };

        console.log("[Scraps] Query params:", params);

        const res = await notion.dataSources.query(params);

        console.log("[Scraps] Query result count:", res.results?.length ?? 0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (res.results ?? []).map((page: any) => {
            const props = page.properties ?? {};

            const title = extractTitle(props["タイトル"]);
            const overview = extractRichText(props["概要"]) || "";
            const category = extractSelect(props["種類"]);
            const status = extractSelect(props["状態"]);
            const createdAt = extractCreatedTime(props["作成日"]);

            return {
                id: page.id,
                title,
                overview,
                category: category || undefined,
                status: status || undefined,
                createdAt,
                url: page.url ?? null,
            };
        });

        return items;
    } catch (err) {
        console.error("[Scraps] getAllScraps error:", err);
        throw err;
    }
}