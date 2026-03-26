// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";

// 本来はデータベースに保存するが、メモリやファイルで一時管理も可
let configStore: Record<string, any> = {};

export async function GET(request: NextRequest) {
  try {
    // ユーザーID などで識別できると良い
    const userId = "default_user"; // 実装時は session から取得

    if (configStore[userId]) {
      return NextResponse.json(configStore[userId], { status: 200 });
    }

    return NextResponse.json(
      { error: "設定が見つかりません" },
      { status: 404 },
    );
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

    // Validate required fields
    if (!config.assistantName || !config.model) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 },
      );
    }

    const userId = "default_user";
    configStore[userId] = config;

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
