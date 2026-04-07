// import { Client } from "@notionhq/client";
// import { NextRequest } from "next/server";

// /* ──────────────────────────────────────────
//    Next.js — キャッシュ無効化
//    ────────────────────────────────────────── */
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// /* ──────────────────────────────────────────
//    Notion Client
//    ────────────────────────────────────────── */
// const notion = new Client({
//     auth: process.env.NOTION_API_KEY,
// });

// const DAILY_DS_ID = process.env.NOTION_DAILY_DS_ID!;

// /* ──────────────────────────────────────────
//    Helper: JSTで今日の日付を取得
//    ────────────────────────────────────────── */
// function getTodayJST(): string {
//     const now = new Date();
//     const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
//     return jst.toISOString().split("T")[0];
// }

// /* ──────────────────────────────────────────
//    Helper: プロパティ値を抽出
//    ────────────────────────────────────────── */
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractTitle(prop: any): string {
//     if (!prop || prop.type !== "title") return "";
//     return prop.title?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractRichText(prop: any): string {
//     if (!prop || prop.type !== "rich_text") return "";
//     return prop.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractStatus(prop: any): string | null {
//     if (!prop || prop.type !== "status") return null;
//     return prop.status?.name ?? null;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractSelect(prop: any): string | null {
//     if (!prop || prop.type !== "select") return null;
//     return prop.select?.name ?? null;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractNumber(prop: any): number | null {
//     if (!prop || prop.type !== "number") return null;
//     return prop.number;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractDate(prop: any): { start: string | null; end: string | null } {
//     if (!prop || prop.type !== "date" || !prop.date) return { start: null, end: null };
//     return { start: prop.date.start ?? null, end: prop.date.end ?? null };
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractRelation(prop: any): string[] {
//     if (!prop || prop.type !== "relation") return [];
//     return prop.relation?.map((r: { id: string }) => r.id) ?? [];
// }

// /* ──────────────────────────────────────────
//    Helper: ISO datetime → HH:mm

//    Notion API の挙動:
//    - "+09:00" 付きで保存 → APIは "2026-03-22T12:00:00.000+09:00" を返す場合あり
//    - "Z" (UTC) で返す場合 → そのままの時刻値がJSTを表す
//      （Notion内部でtimezoneを考慮済み）

//    安全な方法: ISO文字列から直接 "T" の後ろのHH:mm を抽出する
//    ただし "+09:00" 付きの場合はDateでパースしてJST変換
//    ────────────────────────────────────────── */
// function toTimeStr(isoStr: string | null): string {
//     if (!isoStr) return "";

//     // +09:00 や +00:00 など明示的なオフセットがあるか確認
//     const hasOffset = /[+-]\d{2}:\d{2}$/.test(isoStr);

//     if (hasOffset) {
//         // オフセット付き → Dateでパースし、JSTに変換
//         const d = new Date(isoStr);
//         const jstMs = d.getTime() + 9 * 60 * 60 * 1000;
//         const jst = new Date(jstMs);
//         const h = jst.getUTCHours();
//         const m = jst.getUTCMinutes();
//         return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
//     }

//     // "Z" 末尾 or オフセットなし → Tの後ろからHH:mmを直接抽出
//     // Notion は JST で入力された値を "YYYY-MM-DDTHH:MM:SS.000Z" で返すことがある
//     // この場合、時刻部分はJSTそのもの
//     const tMatch = isoStr.match(/T(\d{2}):(\d{2})/);
//     if (tMatch) {
//         return `${tMatch[1]}:${tMatch[2]}`;
//     }

//     return "";
// }

// /* ──────────────────────────────────────────
//    Helper: タイトルからアイコンキーを推定
//    ────────────────────────────────────────── */
// function inferIcon(title: string): string {
//     const t = title.toLowerCase();
//     if (t.includes("メール") || t.includes("slack") || t.includes("チェック")) return "mail";
//     if (t.includes("mtg") || t.includes("ミーティング") || t.includes("1on1") || t.includes("朝会") || t.includes("会議")) return "users";
//     if (t.includes("昼") || t.includes("ランチ") || t.includes("休憩")) return "lunch";
//     if (t.includes("レビュー")) return "review";
//     if (t.includes("ドキュメント") || t.includes("資料") || t.includes("日報") || t.includes("仕様書")) return "doc";
//     if (t.includes("振り返り") || t.includes("リフレクション")) return "reflect";
//     if (t.includes("設計") || t.includes("実装") || t.includes("開発") || t.includes("コード") || t.includes("api") || t.includes("フロント") || t.includes("バック")) return "code";
//     return "default";
// }

// /* ──────────────────────────────────────────
//    GET /api/daily-plan?date=YYYY-MM-DD
//    ────────────────────────────────────────── */
// export async function GET(req: NextRequest) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const dateStr = searchParams.get("date") ?? getTodayJST();

//         console.log("[DailyPlan] ===== Request =====");
//         console.log("[DailyPlan] Requested date:", dateStr);
//         console.log("[DailyPlan] DS_ID:", DAILY_DS_ID);
//         console.log("[DailyPlan] Server time (UTC):", new Date().toISOString());
//         console.log("[DailyPlan] Today JST:", getTodayJST());

//         // ────────────────────────────────────────
//         // フィルタ: 日付でフィルタリング
//         // Notion の date filter は ISO 8601 を受け付ける
//         // "equals" で日付部分だけ指定すると、
//         // その日に始まるレコードだけ返す
//         // ────────────────────────────────────────

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const params: any = {
//             data_source_id: DAILY_DS_ID,
//             page_size: 50,
//             sorts: [
//                 {
//                     property: "作業時間",
//                     direction: "ascending",
//                 },
//             ],
//         };

//         // まずフィルタなしで全件取得してデバッグ（一時的）
//         // → 件数が多すぎる場合はフィルタ追加に切り替え
//         console.log("[DailyPlan] Query params:", JSON.stringify(params, null, 2));

//         const res = await notion.dataSources.query(params);

//         console.log("[DailyPlan] Raw results count:", res.results?.length ?? 0);

//         // 生データの最初の3件をデバッグ出力
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (res.results ?? []).slice(0, 5).forEach((page: any, i: number) => {
//             const props = page.properties ?? {};
//             const dateRaw = props["作業時間"];
//             console.log(`[DailyPlan] Raw item[${i}]:`, {
//                 id: page.id,
//                 title: extractTitle(props["作業"]),
//                 date_type: dateRaw?.type,
//                 date_raw: dateRaw?.date,
//                 status: props["ステータス"]?.status?.name,
//                 category: props["種類"]?.select?.name,
//             });
//         });

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const allItems = (res.results ?? []).map((page: any) => {
//             const props = page.properties ?? {};

//             const title = extractTitle(props["作業"]);
//             const status = extractStatus(props["ステータス"]) ?? "未着手";
//             const category = extractSelect(props["種類"]);
//             const memo = extractRichText(props["メモ"]);
//             const targetProgress = extractNumber(props["目標進捗率"]);
//             const actualProgress = extractNumber(props["実績進捗率"]);
//             const date = extractDate(props["作業時間"]);
//             const relatedTaskIds = extractRelation(props["TGP - タスク"]);

//             const startTime = toTimeStr(date.start);
//             const endTime = toTimeStr(date.end);

//             // 日付部分を抽出 (YYYY-MM-DD)
//             // date.start が "2026-03-22T12:00:00.000Z" の場合 → "2026-03-22"
//             const startDate = date.start ? date.start.split("T")[0] : null;

//             return {
//                 id: page.id,
//                 title,
//                 startTime,
//                 endTime,
//                 startDate,
//                 status,
//                 category,
//                 memo: memo || null,
//                 targetProgress,
//                 actualProgress,
//                 relatedTaskIds,
//                 icon: inferIcon(title),
//                 url: page.url ?? null,
//                 _debug: {
//                     rawStart: date.start,
//                     rawEnd: date.end,
//                     parsedStartTime: startTime,
//                     parsedEndTime: endTime,
//                     parsedStartDate: startDate,
//                 },
//             };
//         });

//         // 日付でフィルタ（クライアントサイド）
//         // Notion APIの日付フィルタが想定通りに動かない可能性があるため、
//         // まず全件取得してからフィルタする方式
//         const items = allItems.filter((item: { startDate: string | null }) => item.startDate === dateStr);

//         console.log("[DailyPlan] After date filter:", {
//             filterDate: dateStr,
//             totalBeforeFilter: allItems.length,
//             totalAfterFilter: items.length,
//             allDates: allItems.map((i: { title: string; startDate: string | null }) => ({
//                 title: i.title,
//                 startDate: i.startDate,
//             })),
//         });

//         // ソート
//         items.sort((a: { startTime: string }, b: { startTime: string }) =>
//             a.startTime.localeCompare(b.startTime)
//         );

//         return Response.json(
//             {
//                 success: true,
//                 date: dateStr,
//                 count: items.length,
//                 items,
//                 _debug: {
//                     requestedDate: dateStr,
//                     todayJST: getTodayJST(),
//                     serverTimeUTC: new Date().toISOString(),
//                     totalRawResults: allItems.length,
//                     allDatesInDB: [...new Set(allItems.map((i: { startDate: string | null }) => i.startDate))],
//                 },
//             },
//             {
//                 headers: {
//                     "Cache-Control": "no-store, no-cache, must-revalidate",
//                     Pragma: "no-cache",
//                 },
//             }
//         );
//     } catch (err) {
//         console.error("[DailyPlan API] Error:", err);
//         const message = err instanceof Error ? err.message : "Internal server error";
//         return Response.json(
//             {
//                 error: message,
//                 _debug: {
//                     dsId: DAILY_DS_ID,
//                     todayJST: getTodayJST(),
//                 },
//             },
//             { status: 500 }
//         );
//     }
// }

import { Client } from "@notionhq/client";
import { NextRequest } from "next/server";

/* ──────────────────────────────────────────
   Next.js — キャッシュ無効化
   ────────────────────────────────────────── */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ──────────────────────────────────────────
   Notion Client
   ────────────────────────────────────────── */
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DAILY_DS_ID = process.env.NOTION_DAILY_DS_ID!;

/* ──────────────────────────────────────────
   Helper: JSTで今日の日付を取得
   ────────────────────────────────────────── */
function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
}

/* ──────────────────────────────────────────
   Helper: プロパティ値を抽出
   ────────────────────────────────────────── */
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
function extractDate(prop: any): { start: string | null; end: string | null } {
  if (!prop || prop.type !== "date" || !prop.date)
    return { start: null, end: null };
  return { start: prop.date.start ?? null, end: prop.date.end ?? null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRelation(prop: any): string[] {
  if (!prop || prop.type !== "relation") return [];
  return prop.relation?.map((r: { id: string }) => r.id) ?? [];
}

/* ──────────────────────────────────────────
   Helper: ISO datetime → HH:mm
   ────────────────────────────────────────── */
function toTimeStr(isoStr: string | null): string {
  if (!isoStr) return "";
  const hasOffset = /[+-]\d{2}:\d{2}$/.test(isoStr);
  if (hasOffset) {
    const d = new Date(isoStr);
    const jstMs = d.getTime() + 9 * 60 * 60 * 1000;
    const jst = new Date(jstMs);
    const h = jst.getUTCHours();
    const m = jst.getUTCMinutes();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const tMatch = isoStr.match(/T(\d{2}):(\d{2})/);
  if (tMatch) return `${tMatch[1]}:${tMatch[2]}`;
  return "";
}

/* ──────────────────────────────────────────
   Helper: タイトルからアイコンキーを推定
   ────────────────────────────────────────── */
function inferIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("メール") || t.includes("slack") || t.includes("チェック"))
    return "mail";
  if (
    t.includes("mtg") ||
    t.includes("ミーティング") ||
    t.includes("1on1") ||
    t.includes("朝会") ||
    t.includes("会議")
  )
    return "users";
  if (t.includes("昼") || t.includes("ランチ") || t.includes("休憩"))
    return "lunch";
  if (t.includes("レビュー")) return "review";
  if (
    t.includes("ドキュメント") ||
    t.includes("資料") ||
    t.includes("日報") ||
    t.includes("仕様書")
  )
    return "doc";
  if (t.includes("振り返り") || t.includes("リフレクション")) return "reflect";
  if (
    t.includes("設計") ||
    t.includes("実装") ||
    t.includes("開発") ||
    t.includes("コード") ||
    t.includes("api") ||
    t.includes("フロント") ||
    t.includes("バック")
  )
    return "code";
  return "default";
}

/* ──────────────────────────────────────────
   GET /api/daily-plan?date=YYYY-MM-DD
   ────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") ?? getTodayJST();

    console.log("[DailyPlan] ===== Request =====");
    console.log("[DailyPlan] Requested date:", dateStr);
    console.log("[DailyPlan] DS_ID:", DAILY_DS_ID);
    console.log("[DailyPlan] Server time (UTC):", new Date().toISOString());
    console.log("[DailyPlan] Today JST:", getTodayJST());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      data_source_id: DAILY_DS_ID,
      page_size: 50,
      sorts: [
        {
          property: "作業時間",
          direction: "ascending",
        },
      ],
    };

    const res = await notion.dataSources.query(params);

    console.log("[DailyPlan] Raw results count:", res.results?.length ?? 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res.results ?? []).slice(0, 5).forEach((page: any, i: number) => {
      const props = page.properties ?? {};
      const dateRaw = props["作業時間"];
      console.log(`[DailyPlan] Raw item[${i}]:`, {
        id: page.id,
        title: extractTitle(props["作業"]),
        date_type: dateRaw?.type,
        date_raw: dateRaw?.date,
        status: props["ステータス"]?.status?.name,
        category: props["種類"]?.select?.name,
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allItems = (res.results ?? []).map((page: any) => {
      const props = page.properties ?? {};

      const title = extractTitle(props["作業"]);
      const status = extractStatus(props["ステータス"]) ?? "未着手";
      const category = extractSelect(props["種類"]);
      const memo = extractRichText(props["メモ"]);
      const date = extractDate(props["作業時間"]);
      const relatedTaskIds = extractRelation(props["TGP - タスク"]);

      const startTime = toTimeStr(date.start);
      const endTime = toTimeStr(date.end);
      const startDate = date.start ? date.start.split("T")[0] : null;

      return {
        id: page.id,
        title,
        startTime,
        endTime,
        startDate,
        status,
        category,
        memo: memo || null,
        relatedTaskIds,
        icon: inferIcon(title),
        url: page.url ?? null,
      };
    });

    const items = allItems.filter(
      (item: { startDate: string | null }) => item.startDate === dateStr,
    );

    console.log("[DailyPlan] After date filter:", {
      filterDate: dateStr,
      totalBeforeFilter: allItems.length,
      totalAfterFilter: items.length,
      allDates: allItems.map(
        (i: { title: string; startDate: string | null }) => ({
          title: i.title,
          startDate: i.startDate,
        }),
      ),
    });

    items.sort((a: { startTime: string }, b: { startTime: string }) =>
      a.startTime.localeCompare(b.startTime),
    );

    return Response.json(
      {
        success: true,
        date: dateStr,
        count: items.length,
        items,
        _debug: {
          requestedDate: dateStr,
          todayJST: getTodayJST(),
          serverTimeUTC: new Date().toISOString(),
          totalRawResults: allItems.length,
          allDatesInDB: [
            ...new Set(
              allItems.map((i: { startDate: string | null }) => i.startDate),
            ),
          ],
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err) {
    console.error("[DailyPlan API] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json(
      {
        error: message,
        _debug: { dsId: DAILY_DS_ID, todayJST: getTodayJST() },
      },
      { status: 500 },
    );
  }
}

/* ──────────────────────────────────────────
   PATCH /api/daily-plan
   body: { id: string; status: string }
   ────────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return Response.json(
        { error: "id と status は必須です" },
        { status: 400 },
      );
    }

    const VALID_STATUSES = ["未着手", "進行中", "完了", "予定変更", "保留"];
    if (!VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `無効なステータス: ${status}` },
        { status: 400 },
      );
    }

    await notion.pages.update({
      page_id: id,
      properties: {
        ステータス: {
          status: { name: status },
        },
      } as Parameters<typeof notion.pages.update>[0]["properties"],
    });

    return Response.json(
      { success: true, id, status },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err) {
    console.error("[DailyPlan PATCH] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
