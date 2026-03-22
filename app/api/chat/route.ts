import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { TOOLS } from "./tools";
import { executeTool } from "./notion";

/* ──────────────────────────────────────────
   Config
   ────────────────────────────────────────── */
const MAX_CONTEXT_MESSAGES = 10;
// const MODEL = "claude-sonnet-4-20250514";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `あなたは「Aether」という名前のAI秘書です。
ユーザーの個人的なスケジュール管理・タスク管理・メモ作成をサポートしつつ、
知的な相談相手としてもユーザーを支援します。
今日の日付は ${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo" }).replace(/\//g, "-")} です。

## 性格・口調
- 丁寧だけど堅すぎない、頼れる秘書のような口調
- 簡潔に要点をまとめて回答する
- 日本語で応答する
- 質問や相談には、自分の知識と思考力をフルに使って回答する

## 回答方針（重要）
あなたはAIとして豊富な知識と思考力を持っています。ツールに頼るのは「ユーザーの実データが必要なとき」だけです。

### ツールを使わず、自分の知識で回答するケース
- 「○○について調べて」「○○って何？」→ AI自身の知識で回答
- 「どうしたらいいと思う？」「アドバイスください」→ 自分の考えで提案
- 「○○のやり方教えて」→ 手順・方法を説明
- プログラミング、技術、ビジネス、一般知識の質問 → AI知識で回答
- 壁打ち、ブレスト、アイデア出し → 創造的に一緒に考える
- 文章の添削、要約、翻訳 → AIの得意分野として対応

### ツールを使うケース
- 「今日の予定は？」→ get_events（ユーザーの実データが必要）
- 「タスク登録して」→ create_task（書き込み操作）
- 「今のタスク見せて」→ query_notion_database（ユーザーの実データ参照）
- 「デイリープラン作って」→ 複数ツール連携（後述）
- 「○○について書いたメモある？」→ search_notion（Notion内検索）

### 両方を組み合わせるケース
- 「このタスクの進め方を考えて」→ まずNotion情報を取得 → AI知識で分析・提案
- 「来週の戦略を練りたい」→ スケジュール＋タスクを取得 → AI思考で戦略提案

## 利用可能なツール
- create_task: Notionにタスク登録
- query_notion_database: Notionの各種DB(タスク, デイリープラン, スクラップ, スプリント, ナレッジ, レビュー, OKR, KeyResults)からデータ取得
- search_notion: Notionワークスペース横断検索
- get_events: Googleカレンダー予定取得
- create_event: Googleカレンダー予定登録
- create_daily_plan: デイリープラン一括登録

## タスク登録のルール
- ユーザーがタスク追加の意図を示したら create_task ツールを使う
- 優先度や種類をユーザーが指定しない場合はデフォルト値を使う（確認しなくてよい）
- 登録完了後は「登録しました」と結果を簡潔に伝える

## スケジュール関連のルール
- 「今日の予定」→ get_events（date省略）
- 「明日の予定」→ get_events（date=明日の日付）
- 「今週の予定」→ get_events（date=今日, days=7）
- 予定取得後は見やすく箇条書きで時刻・タイトルを伝える
- 「予定を入れて」→ create_event を使う
- 「明日」「来週月曜」などの相対日付は、今日の日付から計算してYYYY-MM-DD形式にする
- ユーザーが終了時刻を言わなかった場合は開始の1時間後をデフォルトにする

## デイリープラン作成のルール
- 「デイリープランを作って」「今日の予定を立てて」→ 以下の手順を必ず踏む：
  1. get_events で今日のGoogleカレンダー予定を取得
  2. query_notion_database で database_name="タスク", sprint_status_filter="進行中" でタスクを取得
  3. 上記2つの結果をもとに、以下のルールでデイリープランを組み立てる：
     - Googleカレンダーの予定（MTG等）はその時間帯にそのまま配置
     - 期限が近いタスク・優先度が高いタスクを優先的に配置
     - 見積時間(h)がある場合はその時間分を確保。なければ1時間を想定
     - 12:00-13:00 は昼休憩を入れる
     - 作業の開始は9:00、終了は18:00を目安にする
     - タスクのidをrelated_task_idに設定してリレーション紐づけ
  4. create_daily_plan で一括登録
- 登録後は作成したプランの一覧を時系列で伝える`;

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/* ──────────────────────────────────────────
   SSE Helper
   ────────────────────────────────────────── */
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;

  const readable = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  return {
    readable,
    send(data: string) {
      controller?.enqueue(encoder.encode(`data: ${data}\n\n`));
    },
    sendText(text: string) {
      controller?.enqueue(
        encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
      );
    },
    sendStatus(status: string) {
      controller?.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status })}\n\n`)
      );
    },
    close() {
      controller?.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller?.close();
    },
    error(msg: string) {
      controller?.enqueue(
        encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
      );
      controller?.close();
    },
  };
}

/* ──────────────────────────────────────────
   Route Handler
   ────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "messages is required" },
        { status: 400 }
      );
    }

    const trimmed = messages.slice(-MAX_CONTEXT_MESSAGES);
    const client = new Anthropic();
    const sse = createSSEStream();

    // Background processing
    (async () => {
      try {
        // ── Step 1: Initial Claude call with tools ──
        const apiMessages = trimmed.map((msg: ChatMessage) => ({
          role: msg.role,
          content: msg.content,
        }));

        let response = await client.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: apiMessages,
        });

        // ── Step 2: Tool use loop ──
        // Claude may request tool use multiple rounds.
        // Each round, we accumulate messages so context is preserved.
        const conversationMessages: Anthropic.MessageParam[] = [
          ...apiMessages,
        ];

        while (response.stop_reason === "tool_use") {
          const assistantContent = response.content;

          // Stream any text blocks that come before tool use
          for (const block of assistantContent) {
            if (block.type === "text" && block.text) {
              sse.sendText(block.text);
            }
          }

          // Add assistant response to conversation
          conversationMessages.push({
            role: "assistant",
            content: assistantContent,
          });

          // Find tool_use blocks
          const toolUseBlocks = assistantContent.filter(
            (b): b is Anthropic.ToolUseBlock & {
              type: "tool_use";
              id: string;
              name: string;
              input: Record<string, unknown>;
            } => b.type === "tool_use"
          );

          // Execute each tool
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUseBlocks) {
            sse.sendStatus(`${toolUse.name} を実行中...`);

            const result = await executeTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>
            );

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result,
            });
          }

          // Add tool results to conversation
          conversationMessages.push({
            role: "user",
            content: toolResults,
          });

          // ── Next round: send full conversation back to Claude ──
          response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: conversationMessages,
          });
        }

        // ── Step 4: Stream final text response ──
        for (const block of response.content) {
          if (block.type === "text" && block.text) {
            // Send in small chunks for streaming feel
            const text = block.text;
            const chunkSize = 8;
            for (let i = 0; i < text.length; i += chunkSize) {
              sse.sendText(text.slice(i, i + chunkSize));
              // Small delay for natural streaming feel
              await new Promise((r) => setTimeout(r, 15));
            }
          }
        }

        sse.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Internal error";
        console.error("Chat stream error:", err);
        sse.error(msg);
      }
    })();

    return new Response(sse.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}