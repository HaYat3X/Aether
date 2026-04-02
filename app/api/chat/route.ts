import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { SYSTEM_PROMPTS, SKILLS, executeSkill } from "@/skills";

/* ──────────────────────────────────────────
   Config
   ────────────────────────────────────────── */
const MAX_CONTEXT_MESSAGES = 10;
// const MODEL = "claude-sonnet-4-20250514";
const MODEL = "claude-haiku-4-5-20251001";

// 性格などの設定はユーザが設定できるようにする
const SYSTEM_PROMPT = `あなたは「Luno」という名前のAI秘書です。
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

## スキル定義
${SYSTEM_PROMPTS}
`;

/* ──────────────────────────────────────────
   プロンプト
   ────────────────────────────────────────── */
// 定数をやめて関数にする
function buildSystemPrompt(): string {
  const today = new Date()
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo",
    })
    .replace(/\//g, "-");

  return `あなたは「Luno」という名前のAI秘書です。
ユーザーの個人的なスケジュール管理・タスク管理・メモ作成をサポートしつつ、
知的な相談相手としてもユーザーを支援します。
今日の日付は ${today} です。

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

## スキル定義
${SYSTEM_PROMPTS}
`;
}

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
        encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
      );
    },
    sendStatus(status: string) {
      controller?.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status })}\n\n`),
      );
    },
    close() {
      controller?.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller?.close();
    },
    error(msg: string) {
      controller?.enqueue(
        encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
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
      return Response.json({ error: "messages is required" }, { status: 400 });
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

        // Step1の呼び出し
        let response = await client.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: buildSystemPrompt(),
          tools: SKILLS,
          messages: apiMessages,
        });

        // ── Step 2: Tool use loop ──
        // Claude may request tool use multiple rounds.
        // Each round, we accumulate messages so context is preserved.
        const conversationMessages: Anthropic.MessageParam[] = [...apiMessages];

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
            (
              b,
            ): b is Anthropic.ToolUseBlock & {
              type: "tool_use";
              id: string;
              name: string;
              input: Record<string, unknown>;
            } => b.type === "tool_use",
          );

          // Execute each tool
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUseBlocks) {
            sse.sendStatus(`${toolUse.name} を実行中...`);

            // マージしたツールを使う
            const result = await executeSkill(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
            );

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: [
                {
                  type: "text",
                  text:
                    typeof result === "string"
                      ? result
                      : JSON.stringify(result),
                },
              ],
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
            system: buildSystemPrompt(),
            tools: SKILLS,
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
