import { getNotionClient } from "@/services/NotionClient";

/* ──────────────────────────────────────────
   環境変数
   ────────────────────────────────────────── */
const SCRAP_DB_ID = process.env.NOTION_SCRAP_DB_ID!;

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
export type ScrapRegisterInput = {
  title: string;
  summary: string;
  kind: "アイデア" | "気づき" | "調べたいこと" | "モヤモヤ" | "ひとこと";
  source_url?: string;
};

/* ──────────────────────────────────────────
   Notionスクラップに登録
   ────────────────────────────────────────── */
export const scrapRegister = async (input: ScrapRegisterInput) => {
  const properties: Record<string, unknown> = {
    タイトル: {
      title: [{ text: { content: input.title } }],
    },
    概要: {
      rich_text: [{ text: { content: input.summary } }],
    },
    状態: {
      select: { name: "Inbox" },
    },
    種類: {
      select: { name: input.kind },
    },
  };

  // URLスクラップの場合のみURLプロパティをセット
  if (input.source_url) {
    properties["URL"] = { url: input.source_url };
  }

  const response = await getNotionClient.pages.create({
    parent: { database_id: SCRAP_DB_ID },
    properties: properties as Parameters<
      typeof getNotionClient.pages.create
    >[0]["properties"],
  });

  return {
    success: true,
    scrapId: response.id,
    notionUrl: (response as { url?: string }).url ?? null,
    title: input.title,
    summary: input.summary,
    kind: input.kind,
    status: "Inbox",
    sourceUrl: input.source_url ?? null,
  };
};
