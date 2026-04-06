// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

// 設定レコードを取得（常に最初の1件）
async function getSettingsPage(): Promise<{
  id: string;
  properties: any;
} | null> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${process.env.NOTION_ST_DB_ID}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({ page_size: 1 }),
    },
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.results?.[0] ?? null;
}

export async function GET(_request: NextRequest) {
  try {
    const page = await getSettingsPage();

    if (!page) {
      return NextResponse.json(
        { error: "設定が見つかりません" },
        { status: 404 },
      );
    }

    const props = page.properties;

    const config = {
      assistantName: props["アシスタント名"]?.title?.[0]?.plain_text ?? "",
      model: props["モデル"]?.rich_text?.[0]?.plain_text ?? "claude-sonnet-4-6",
      systemPrompt: props["プロンプト"]?.rich_text?.[0]?.plain_text ?? "",
    };

    return NextResponse.json(config, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: `エラー: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    if (!config.assistantName || !config.model) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 },
      );
    }

    const properties = {
      アシスタント名: {
        title: [{ text: { content: config.assistantName } }],
      },
      モデル: {
        rich_text: [{ text: { content: config.model } }],
      },
      プロンプト: {
        rich_text: [{ text: { content: config.systemPrompt ?? "" } }],
      },
    };

    const existingPage = await getSettingsPage();

    if (existingPage) {
      // 既存レコードを更新
      await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
        method: "PATCH",
        headers: notionHeaders(),
        body: JSON.stringify({ properties }),
      });
    } else {
      // 新規作成
      await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders(),
        body: JSON.stringify({
          parent: { database_id: process.env.NOTION_ST_DB_ID },
          properties,
        }),
      });
    }

    return NextResponse.json(
      { message: "設定を保存しました", config },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: `エラー: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
