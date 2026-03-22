import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { TOOLS } from "./tools";
import { executeTool } from "./notion";

/* ──────────────────────────────────────────
   Config
   ────────────────────────────────────────── */
const MAX_CONTEXT_MESSAGES = 10;
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `あなたは「Aether」という名前のAI秘書です。
ユーザーの個人的なスケジュール管理・タスク管理・メモ作成をサポートします。

## 性格・口調
- 丁寧だけど堅すぎない、頼れる秘書のような口調
- 簡潔に要点をまとめて回答する
- 日本語で応答する

## できること
- Notionのタスクデータベースにタスクを登録できます（create_task ツール）
- Googleカレンダーの予定確認・登録（今後実装予定）
- デイリープランの確認・更新（今後実装予定）
- スクラップ（メモ）の作成（今後実装予定）

## タスク登録のルール
- ユーザーがタスク追加の意図を示したら create_task ツールを使う
- 優先度や種類をユーザーが指定しない場合はデフォルト値を使う（確認しなくてよい）
- 登録完了後は「登録しました」と結果を簡潔に伝える

## 未実装機能について
- まだ実装されていない機能についてユーザーが聞いた場合は、今後対応予定であることを伝える`;

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
        // Claude may request tool use. Execute and feed back results.
        while (response.stop_reason === "tool_use") {
          const assistantContent = response.content;

          // Stream any text blocks that come before tool use
          for (const block of assistantContent) {
            if (block.type === "text" && block.text) {
              sse.sendText(block.text);
            }
          }

          // Find tool_use blocks
          const toolUseBlocks = assistantContent.filter(
            (b): b is Anthropic.ContentBlockParam & {
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

          // ── Step 3: Send tool results back to Claude ──
          response = await client.messages.create({
            model: MODEL,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: [
              ...apiMessages,
              { role: "assistant", content: assistantContent },
              { role: "user", content: toolResults },
            ],
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