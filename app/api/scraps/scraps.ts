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
// 注意: 新規作成時は database_id ではなく、
// ページの parent として data_source_id を使う方式に変更
const SCRAP_DB_ID = process.env.NOTION_SCRAP_DB_ID!;

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type CreateScrapInput = {
    title: string;
    content?: string;
    category?: string;
};

type ScrapItem = {
    id: string;
    title: string;
    content: string;
    category?: string | null;
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
        const items = (res.results ?? []).map((page: any, index: number) => {
            const props = page.properties ?? {};

            const title = extractTitle(props["タイトル"]);
            const content = extractRichText(props["内容"]) || extractRichText(props["タイトル"]) || "";
            const category = extractSelect(props["種類"]);
            const createdAt = extractCreatedTime(props["作成日"]);

            console.log(`[Scraps] Item[${index}]:`, {
                id: page.id,
                title,
                category,
                properties: Object.keys(props),
            });

            return {
                id: page.id,
                title,
                content,
                category: category || undefined,
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

/* ──────────────────────────────────────────
   Create Scrap (using database ID)
   
   注意: Notion SDK の pages.create では
   parent に database_id を使う必要があります
   ────────────────────────────────────────── */
export async function createScrap(input: CreateScrapInput) {
    try {
        if (!SCRAP_DB_ID) {
            throw new Error(
                "NOTION_SCRAP_DB_ID is not set in environment variables. " +
                "Make sure the integration 'Quicka' has access to the database and the ID is correctly set."
            );
        }

        console.log("[Scraps] Creating scrap with:", {
            title: input.title,
            dbId: SCRAP_DB_ID,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const properties: Record<string, any> = {
            タイトル: {
                title: [{ text: { content: input.title } }],
            },
        };

        // 内容がある場合のみ追加（空の場合はスキップ）
        if (input.content?.trim()) {
            properties["内容"] = {
                rich_text: [{ text: { content: input.content } }],
            };
        }

        // カテゴリがある場合のみ追加
        if (input.category) {
            properties["種類"] = {
                select: { name: input.category },
            };
        }

        console.log("[Scraps] Properties to create:", properties);

        const response = await notion.pages.create({
            parent: { database_id: SCRAP_DB_ID },
            properties: properties as Parameters<
                typeof notion.pages.create
            >[0]["properties"],
        });

        console.log("[Scraps] Scrap created successfully:", response.id);

        return {
            success: true,
            scrapId: response.id,
            url: (response as { url?: string }).url ?? null,
            title: input.title,
            category: input.category || null,
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[Scraps] createScrap error:", errorMsg);

        // より詳しいエラーメッセージ
        if (errorMsg.includes("not_found") || errorMsg.includes("Could not find database")) {
            throw new Error(
                `Notionデータベースが見つかりません。` +
                `NOTION_SCRAP_DB_ID=${SCRAP_DB_ID} が正しいか確認してください。` +
                `また、Notion統合 'Quicka' がこのデータベースへのアクセス権限を持つか確認してください。`
            );
        }

        if (errorMsg.includes("unauthorized")) {
            throw new Error(
                `Notionインテグレーションの権限がありません。` +
                `Notion の設定で 'Quicka' インテグレーションがスクラップデータベースへの` +
                `アクセス権限を持つか確認してください。`
            );
        }

        throw err;
    }
}