// import Anthropic from "@anthropic-ai/sdk";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// // ── Types ──────────────────────────────────────────────────
// type TrendCategory = "AI" | "Tech" | "Business" | "Science" | "World" | "Other";

// type TrendItem = {
//     id: string;
//     title: string;
//     summary: string;
//     category: TrendCategory;
//     impactScore: number;
//     keywords: string[];
//     isFeatured?: boolean;
// };

// type TrendResponse = {
//     items: TrendItem[];
//     digest: string;
//     fetchedAt: string;
// };

// // ── Step 1: Web search with sonnet (minimal calls) ──────────
// // 検索はsonnetに任せ、要約はhaiku に渡す2段階構成
// // ただしsonnetのweb_searchは必要最低限（2〜3回）に絞る

// const SEARCH_SYSTEM = `You are a news researcher. Search the web and collect raw headlines and brief facts about recent trends in: AI, tech, business, science, world news.
// Search exactly 3 times with different queries. Return ONLY the raw findings as plain bullet points in Japanese. No analysis, no citations, no XML tags, no markdown formatting other than bullet points.`;

// const SEARCH_USER = `Search for today's top trends. Use 3 searches:
// 1. "AI technology news 2026"
// 2. "tech business world news today"  
// 3. "科学技術ニュース 最新"

// Then list the top 10-12 findings as plain bullet points like:
// • [category] タイトル: 簡単な説明

// Only bullet points. No citations. No XML.`;

// // ── Step 2: Haiku structures the data ──────────────────────
// const STRUCTURE_SYSTEM = `You convert news bullet points into a JSON object. Output ONLY valid JSON, nothing else. No markdown, no code fences, no explanations, no citations.`;

// function buildStructurePrompt(rawFindings: string): string {
//     return `Convert these news items into JSON. Output ONLY the JSON object, nothing else:

// NEWS:
// ${rawFindings}

// OUTPUT THIS EXACT JSON STRUCTURE (fill in real data from the news above):
// {"items":[{"id":"t1","title":"タイトル","summary":"2文の説明","category":"AI","impactScore":9,"keywords":["kw1","kw2"],"isFeatured":true},{"id":"t2","title":"タイトル2","summary":"説明2","category":"Tech","impactScore":7,"keywords":["kw1"],"isFeatured":false}],"digest":"全体の概観2文","fetchedAt":"${new Date().toISOString()}"}

// Rules:
// - category: AI | Tech | Business | Science | World | Other
// - impactScore: integer 1-10
// - isFeatured true on highest score item only (exactly 1)
// - 10-12 items total
// - All text in Japanese
// - Output ONLY the JSON, no other text`;
// }

// // ── JSON extraction ─────────────────────────────────────────
// function extractJson(text: string): string {
//     // cite タグ、HTMLタグ、コードフェンスを除去
//     const cleaned = text
//         .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, "$1")
//         .replace(/<[^>]+>/g, "")
//         .replace(/```[\w]*\n?/g, "")
//         .trim();

//     const start = cleaned.indexOf("{");
//     if (start === -1) throw new Error("No JSON object found in response");

//     // 文字列内・エスケープを正確にトラッキングしてJSONの終端を探す
//     let depth = 0;
//     let inString = false;
//     let escape = false;

//     for (let i = start; i < cleaned.length; i++) {
//         const ch = cleaned[i];
//         if (escape) { escape = false; continue; }
//         if (ch === "\\") { escape = true; continue; }
//         if (ch === '"') { inString = !inString; continue; }
//         if (inString) continue;
//         if (ch === "{") depth++;
//         else if (ch === "}") {
//             depth--;
//             if (depth === 0) return cleaned.slice(start, i + 1);
//         }
//     }
//     throw new Error("Incomplete JSON object");
// }

// // ── Normalize response ──────────────────────────────────────
// const VALID_CATEGORIES: TrendCategory[] = ["AI", "Tech", "Business", "Science", "World", "Other"];

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function normalize(raw: any): TrendResponse {
//     if (!Array.isArray(raw?.items)) throw new Error("items array missing");

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const items: TrendItem[] = raw.items.map((item: any, idx: number) => ({
//         id: String(item.id ?? `t${idx + 1}`),
//         title: String(item.title ?? ""),
//         summary: String(item.summary ?? ""),
//         category: VALID_CATEGORIES.includes(item.category) ? item.category : "Other",
//         impactScore: Math.min(10, Math.max(1, Math.round(Number(item.impactScore) || 5))),
//         keywords: Array.isArray(item.keywords) ? item.keywords.slice(0, 4).map(String) : [],
//         isFeatured: false,
//     }));

//     // featured は最高スコアの1件のみ
//     const max = Math.max(...items.map((i) => i.impactScore));
//     let marked = false;
//     items.forEach((item) => {
//         if (!marked && item.impactScore === max) { item.isFeatured = true; marked = true; }
//     });

//     return {
//         items,
//         digest: String(raw.digest ?? ""),
//         fetchedAt: new Date().toISOString(), // サーバー時刻を使用（AIの時刻は信用しない）
//     };
// }

// // ── GET /api/trends ─────────────────────────────────────────
// export async function GET() {
//     try {
//         const client = new Anthropic();

//         // ── Step 1: sonnet + web_search で生データ収集（検索3回のみ）──
//         console.log("[Trends] Step1: web search...");
//         const searchRes = await client.messages.create({
//             model: "claude-sonnet-4-20250514", // web_search は sonnet が必要
//             max_tokens: 1500, // 生データだけなので少なく
//             system: SEARCH_SYSTEM,
//             tools: [{ type: "web_search_20250305", name: "web_search" } as unknown as Anthropic.Tool],
//             messages: [{ role: "user", content: SEARCH_USER }],
//         });

//         const rawFindings = searchRes.content
//             .filter((b): b is Anthropic.TextBlock => b.type === "text")
//             .map((b) => b.text)
//             .join("\n")
//             .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, "$1") // cite除去
//             .replace(/<[^>]+>/g, "")
//             .trim();

//         console.log("[Trends] Step1 findings (first 200):", rawFindings.slice(0, 200));

//         // ── Step 2: haiku でJSON構造化（安い・速い）──
//         console.log("[Trends] Step2: structuring with haiku...");
//         const structureRes = await client.messages.create({
//             model: "claude-haiku-4-5-20251001", // 安いモデルで構造化
//             max_tokens: 2000,
//             system: STRUCTURE_SYSTEM,
//             messages: [{ role: "user", content: buildStructurePrompt(rawFindings) }],
//         });

//         const structureText = structureRes.content
//             .filter((b): b is Anthropic.TextBlock => b.type === "text")
//             .map((b) => b.text)
//             .join("\n");

//         console.log("[Trends] Step2 raw (first 200):", structureText.slice(0, 200));

//         // JSON 抽出・正規化
//         const jsonStr = extractJson(structureText);
//         const parsed = normalize(JSON.parse(jsonStr));

//         console.log(`[Trends] Done: ${parsed.items.length} items`);

//         return Response.json(parsed, {
//             headers: {
//                 "Cache-Control": "no-store, no-cache, must-revalidate",
//                 Pragma: "no-cache",
//             },
//         });
//     } catch (err) {
//         console.error("[Trends API] Error:", err);
//         return Response.json(
//             { error: err instanceof Error ? err.message : "Internal server error" },
//             { status: 500 }
//         );
//     }
// }

import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Types ──────────────────────────────────────────────────
type TrendCategory = "AI" | "Tech" | "Business" | "Science" | "World" | "Other";

type TrendItem = {
    id: string;
    title: string;
    summary: string;
    category: TrendCategory;
    impactScore: number;
    keywords: string[];
    sourceUrl?: string;   // ← 追加: 検索エビデンスURL
    isFeatured?: boolean;
};

type TrendResponse = {
    items: TrendItem[];
    digest: string;
    fetchedAt: string;
};

// ── Step 1: Web search with sonnet ─────────────────────────
// web_search の cite タグからURLを抽出するため、
// システムプロンプトでURLを明示的に出力させる

const SEARCH_SYSTEM = `You are a news researcher. Search the web and collect headlines and brief facts about recent trends in: AI, tech, business, science, world news.
Search exactly 3 times with different queries.

For each news item found, output a bullet point in this exact format:
• [category] タイトル: 簡単な説明 | URL: https://example.com/article

The URL must be the actual article URL from your search results. If you cannot find a specific URL, write URL: none.
Output ONLY bullet points. No analysis, no XML tags, no extra markdown.`;

const SEARCH_USER = `Search for today's top trends. Use 3 searches:
1. "AI technology news 2026"
2. "tech business world news today"
3. "科学技術ニュース 最新"

List the top 10-12 findings as bullet points with URLs:
• [category] タイトル: 説明 | URL: https://...`;

// ── Step 2: Haiku structures the data ──────────────────────
const STRUCTURE_SYSTEM = `You convert news bullet points into a JSON object. Output ONLY valid JSON, nothing else. No markdown, no code fences, no explanations.`;

function buildStructurePrompt(rawFindings: string): string {
    return `Convert these news items into JSON. Output ONLY the JSON object, nothing else:

NEWS:
${rawFindings}

OUTPUT THIS EXACT JSON STRUCTURE:
{"items":[{"id":"t1","title":"タイトル","summary":"2文の説明","category":"AI","impactScore":9,"keywords":["kw1","kw2"],"sourceUrl":"https://example.com","isFeatured":true},{"id":"t2","title":"タイトル2","summary":"説明2","category":"Tech","impactScore":7,"keywords":["kw1"],"sourceUrl":"https://example2.com","isFeatured":false}],"digest":"全体の概観2文","fetchedAt":"${new Date().toISOString()}"}

Rules:
- category: AI | Tech | Business | Science | World | Other
- impactScore: integer 1-10
- isFeatured true on highest score item only (exactly 1)
- sourceUrl: extract the URL after "| URL:" in the bullet point. If "URL: none" or missing, use null
- 10-12 items total
- All title/summary/keywords text in Japanese
- Output ONLY the JSON, no other text`;
}

// ── JSON extraction ─────────────────────────────────────────
function extractJson(text: string): string {
    const cleaned = text
        .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/```[\w]*\n?/g, "")
        .trim();

    const start = cleaned.indexOf("{");
    if (start === -1) throw new Error("No JSON object found in response");

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") depth++;
        else if (ch === "}") {
            depth--;
            if (depth === 0) return cleaned.slice(start, i + 1);
        }
    }
    throw new Error("Incomplete JSON object");
}

// ── URL extraction from cite tags ──────────────────────────
// sonnet の web_search が生成する <cite> タグからURLを回収して
// raw findings に付与する補助処理
function enrichWithCiteUrls(rawText: string, fullText: string): string {
    // <source>xxx</source> 形式からURLを収集
    const urlMatches = [...fullText.matchAll(/<source>([^<]+)<\/antml:source>/g)];
    const urls = urlMatches
        .map(m => m[1].trim())
        .filter(u => u.startsWith("http"));

    if (urls.length === 0) return rawText;

    // bullet点にURLがまだ "URL: none" のものへ、収集したURLを順番に割り当て
    let urlIdx = 0;
    return rawText.replace(/\| URL: none/g, () => {
        const url = urls[urlIdx] ?? "none";
        urlIdx++;
        return `| URL: ${url}`;
    });
}

// ── Normalize response ──────────────────────────────────────
const VALID_CATEGORIES: TrendCategory[] = ["AI", "Tech", "Business", "Science", "World", "Other"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any): TrendResponse {
    if (!Array.isArray(raw?.items)) throw new Error("items array missing");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: TrendItem[] = raw.items.map((item: any, idx: number) => {
        // sourceUrl の検証: http(s) で始まる文字列のみ採用
        const rawUrl = item.sourceUrl;
        const sourceUrl =
            typeof rawUrl === "string" && rawUrl.startsWith("http")
                ? rawUrl
                : undefined;

        return {
            id: String(item.id ?? `t${idx + 1}`),
            title: String(item.title ?? ""),
            summary: String(item.summary ?? ""),
            category: VALID_CATEGORIES.includes(item.category) ? item.category : "Other",
            impactScore: Math.min(10, Math.max(1, Math.round(Number(item.impactScore) || 5))),
            keywords: Array.isArray(item.keywords) ? item.keywords.slice(0, 4).map(String) : [],
            sourceUrl,
            isFeatured: false,
        };
    });

    // featured は最高スコアの1件のみ
    const max = Math.max(...items.map((i) => i.impactScore));
    let marked = false;
    items.forEach((item) => {
        if (!marked && item.impactScore === max) { item.isFeatured = true; marked = true; }
    });

    return {
        items,
        digest: String(raw.digest ?? ""),
        fetchedAt: new Date().toISOString(),
    };
}

// ── GET /api/trends ─────────────────────────────────────────
export async function GET() {
    try {
        const client = new Anthropic();

        // ── Step 1: sonnet + web_search で生データ収集 ──
        console.log("[Trends] Step1: web search...");
        const searchRes = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            system: SEARCH_SYSTEM,
            tools: [{ type: "web_search_20250305", name: "web_search" } as unknown as Anthropic.Tool],
            messages: [{ role: "user", content: SEARCH_USER }],
        });

        // cite タグを含む生テキスト（URL抽出に使う）
        const fullResponseText = searchRes.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("\n");

        // cite タグを除去したクリーンなbullet points
        const cleanFindings = fullResponseText
            .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, "$1")
            .replace(/<[^>]+>/g, "")
            .trim();

        // cite ソースURLを "URL: none" の箇所に補完
        const enrichedFindings = enrichWithCiteUrls(cleanFindings, fullResponseText);

        console.log("[Trends] Step1 findings (first 300):", enrichedFindings.slice(0, 300));

        // ── Step 2: haiku でJSON構造化 ──
        console.log("[Trends] Step2: structuring with haiku...");
        const structureRes = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            system: STRUCTURE_SYSTEM,
            messages: [{ role: "user", content: buildStructurePrompt(enrichedFindings) }],
        });

        const structureText = structureRes.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("\n");

        console.log("[Trends] Step2 raw (first 200):", structureText.slice(0, 200));

        const jsonStr = extractJson(structureText);
        const parsed = normalize(JSON.parse(jsonStr));

        // URLが取得できたアイテム数をログ
        const withUrl = parsed.items.filter(i => i.sourceUrl).length;
        console.log(`[Trends] Done: ${parsed.items.length} items, ${withUrl} with URL`);

        return Response.json(parsed, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                Pragma: "no-cache",
            },
        });
    } catch (err) {
        console.error("[Trends API] Error:", err);
        return Response.json(
            { error: err instanceof Error ? err.message : "Internal server error" },
            { status: 500 }
        );
    }
}