// import Anthropic from "@anthropic-ai/sdk";
// import { NextRequest } from "next/server";
// import { SYSTEM_PROMPTS, SKILLS, executeSkill } from "@/skills";

// /* ──────────────────────────────────────────
//    Config
//    ────────────────────────────────────────── */
// const MAX_CONTEXT_MESSAGES = 10;
// // const MODEL = "claude-sonnet-4-20250514";
// const MODEL = "claude-haiku-4-5-20251001";

// /* ──────────────────────────────────────────
//    プロンプト
//    ────────────────────────────────────────── */
// // 定数をやめて関数にする
// function buildSystemPrompt(): string {
//   const today = new Date()
//     .toLocaleDateString("ja-JP", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       timeZone: "Asia/Tokyo",
//     })
//     .replace(/\//g, "-");

//   return `あなたは「Luno」という名前のAI秘書です。
// ユーザーの個人的なスケジュール管理・タスク管理・メモ作成をサポートしつつ、
// 知的な相談相手としてもユーザーを支援します。
// 今日の日付は ${today} です。

// ## 性格・口調
// - 丁寧だけど堅すぎない、頼れる秘書のような口調
// - 簡潔に要点をまとめて回答する
// - 日本語で応答する
// - 質問や相談には、自分の知識と思考力をフルに使って回答する

// ## 回答方針（重要）
// あなたはAIとして豊富な知識と思考力を持っています。ツールに頼るのは「ユーザーの実データが必要なとき」だけです。

// ### ツールを使わず、自分の知識で回答するケース
// - 「○○について調べて」「○○って何？」→ AI自身の知識で回答
// - 「どうしたらいいと思う？」「アドバイスください」→ 自分の考えで提案
// - 「○○のやり方教えて」→ 手順・方法を説明
// - プログラミング、技術、ビジネス、一般知識の質問 → AI知識で回答
// - 壁打ち、ブレスト、アイデア出し → 創造的に一緒に考える
// - 文章の添削、要約、翻訳 → AIの得意分野として対応

// ## スキル定義
// ${SYSTEM_PROMPTS}
// `;
// }

// /* ──────────────────────────────────────────
//    Types
//    ────────────────────────────────────────── */
// type ChatMessage = {
//   role: "user" | "assistant";
//   content: string;
// };

// /* ──────────────────────────────────────────
//    SSE Helper
//    ────────────────────────────────────────── */
// function createSSEStream() {
//   const encoder = new TextEncoder();
//   let controller: ReadableStreamDefaultController | null = null;

//   const readable = new ReadableStream({
//     start(c) {
//       controller = c;
//     },
//   });

//   return {
//     readable,
//     send(data: string) {
//       controller?.enqueue(encoder.encode(`data: ${data}\n\n`));
//     },
//     sendText(text: string) {
//       controller?.enqueue(
//         encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
//       );
//     },
//     sendStatus(status: string) {
//       controller?.enqueue(
//         encoder.encode(`data: ${JSON.stringify({ status })}\n\n`),
//       );
//     },
//     close() {
//       controller?.enqueue(encoder.encode("data: [DONE]\n\n"));
//       controller?.close();
//     },
//     error(msg: string) {
//       controller?.enqueue(
//         encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
//       );
//       controller?.close();
//     },
//   };
// }

// /* ──────────────────────────────────────────
//    Route Handler
//    ────────────────────────────────────────── */
// export async function POST(req: NextRequest) {
//   try {
//     const { messages } = await req.json();

//     if (!messages || !Array.isArray(messages)) {
//       return Response.json({ error: "messages is required" }, { status: 400 });
//     }

//     const trimmed = messages.slice(-MAX_CONTEXT_MESSAGES);
//     const client = new Anthropic();
//     const sse = createSSEStream();

//     // Background processing
//     (async () => {
//       try {
//         // ── Step 1: Initial Claude call with tools ──
//         const apiMessages = trimmed.map((msg: ChatMessage) => ({
//           role: msg.role,
//           content: msg.content,
//         }));

//         // Step1の呼び出し
//         let response = await client.messages.create({
//           model: MODEL,
//           max_tokens: 1024,
//           system: buildSystemPrompt(),
//           tools: SKILLS,
//           messages: apiMessages,
//         });

//         // ── Step 2: Tool use loop ──
//         // Claude may request tool use multiple rounds.
//         // Each round, we accumulate messages so context is preserved.
//         const conversationMessages: Anthropic.MessageParam[] = [...apiMessages];

//         while (response.stop_reason === "tool_use") {
//           const assistantContent = response.content;

//           // Stream any text blocks that come before tool use
//           for (const block of assistantContent) {
//             if (block.type === "text" && block.text) {
//               sse.sendText(block.text);
//             }
//           }

//           // Add assistant response to conversation
//           conversationMessages.push({
//             role: "assistant",
//             content: assistantContent,
//           });

//           // Find tool_use blocks
//           const toolUseBlocks = assistantContent.filter(
//             (
//               b,
//             ): b is Anthropic.ToolUseBlock & {
//               type: "tool_use";
//               id: string;
//               name: string;
//               input: Record<string, unknown>;
//             } => b.type === "tool_use",
//           );

//           // Execute each tool
//           const toolResults: Anthropic.ToolResultBlockParam[] = [];
//           for (const toolUse of toolUseBlocks) {
//             sse.sendStatus(`${toolUse.name} を実行中...`);

//             // マージしたツールを使う
//             const result = await executeSkill(
//               toolUse.name,
//               toolUse.input as Record<string, unknown>,
//             );

//             toolResults.push({
//               type: "tool_result",
//               tool_use_id: toolUse.id,
//               content: [
//                 {
//                   type: "text",
//                   text:
//                     typeof result === "string"
//                       ? result
//                       : JSON.stringify(result),
//                 },
//               ],
//             });
//           }

//           // Add tool results to conversation
//           conversationMessages.push({
//             role: "user",
//             content: toolResults,
//           });

//           // ── Next round: send full conversation back to Claude ──
//           response = await client.messages.create({
//             model: MODEL,
//             max_tokens: 2048,
//             system: buildSystemPrompt(),
//             tools: SKILLS,
//             messages: conversationMessages,
//           });
//         }

//         // ── Step 4: Stream final text response ──
//         for (const block of response.content) {
//           if (block.type === "text" && block.text) {
//             // Send in small chunks for streaming feel
//             const text = block.text;
//             const chunkSize = 8;
//             for (let i = 0; i < text.length; i += chunkSize) {
//               sse.sendText(text.slice(i, i + chunkSize));
//               // Small delay for natural streaming feel
//               await new Promise((r) => setTimeout(r, 15));
//             }
//           }
//         }

//         sse.close();
//       } catch (err) {
//         const msg = err instanceof Error ? err.message : "Internal error";
//         console.error("Chat stream error:", err);
//         sse.error(msg);
//       }
//     })();

//     return new Response(sse.readable, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//     });
//   } catch (err) {
//     console.error("Chat API error:", err);
//     const message =
//       err instanceof Error ? err.message : "Internal server error";
//     return Response.json({ error: message }, { status: 500 });
//   }
// }

// app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { SYSTEM_PROMPTS, SKILLS, executeSkill } from "@/skills";

/* ──────────────────────────────────────────
   Config
   ────────────────────────────────────────── */
const MAX_CONTEXT_MESSAGES = 10;
const DATABASE_ID = "32ffab19d2958096a550e84061bd7e08";
const NOTION_VERSION = "2022-06-28";
const SETTINGS_CACHE_TTL_MS = 30 * 1000; // 30秒キャッシュ

/* ──────────────────────────────────────────
   Settings Cache
   ────────────────────────────────────────── */
type LunoSettings = {
  assistantName: string;
  model: string;
  systemPrompt: string;
};

const DEFAULT_SETTINGS: LunoSettings = {
  assistantName: "Luno",
  model: "claude-haiku-4-5-20251001",
  systemPrompt: "",
};

let settingsCache: { data: LunoSettings; expiresAt: number } | null = null;

async function getSettings(): Promise<LunoSettings> {
  // キャッシュが有効なら返す
  if (settingsCache && Date.now() < settingsCache.expiresAt) {
    return settingsCache.data;
  }

  try {
    const token = process.env.NOTION_TOKEN ?? process.env.NOTION_API_KEY;
    if (!token) return DEFAULT_SETTINGS;

    const res = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({ page_size: 1 }),
      },
    );

    if (!res.ok) return DEFAULT_SETTINGS;

    const data = await res.json();
    const page = data.results?.[0];
    if (!page) return DEFAULT_SETTINGS;

    const props = page.properties;
    const settings: LunoSettings = {
      assistantName:
        props["アシスタント名"]?.title?.[0]?.plain_text ??
        DEFAULT_SETTINGS.assistantName,
      model:
        props["モデル"]?.rich_text?.[0]?.plain_text ?? DEFAULT_SETTINGS.model,
      systemPrompt:
        props["プロンプト"]?.rich_text?.[0]?.plain_text ??
        DEFAULT_SETTINGS.systemPrompt,
    };

    // キャッシュ更新
    settingsCache = {
      data: settings,
      expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
    };
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/* ──────────────────────────────────────────
   モデル名の正規化
   ────────────────────────────────────────── */
// Notionに保存されてる短縮名 → Anthropic API用の正式名に変換
const MODEL_MAP: Record<string, string> = {
  "claude-opus-4-6": "claude-opus-4-20250514",
  "claude-sonnet-4-6": "claude-sonnet-4-20250514",
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
  "claude-opus-4-20250514": "claude-opus-4-20250514",
  "claude-sonnet-4-20250514": "claude-sonnet-4-20250514",
  "claude-haiku-4-5-20251001": "claude-haiku-4-5-20251001",
};

function resolveModel(model: string): string {
  return MODEL_MAP[model] ?? "claude-haiku-4-5-20251001";
}

/* ──────────────────────────────────────────
   プロンプト
   ────────────────────────────────────────── */
function buildSystemPrompt(settings: LunoSettings): string {
  const today = new Date()
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo",
    })
    .replace(/\//g, "-");

  // ユーザが指定したカスタム指示
  const basePrompt = settings.systemPrompt.trim();

  return `${basePrompt}
    ## システム情報
    今日の日付は ${today} です。
    
    ## 性格・口調
    - 丁寧だけど堅すぎない、頼れる秘書のような口調
    - 質問や相談には、自分の知識と思考力をフルに使って回答する

    ## 回答方針（重要）
    あなたはAIとして豊富な知識と思考力を持っています。
    ツールに頼るのは「ユーザーの実データが必要なとき」だけです。

    ## スキル定義
    ${SYSTEM_PROMPTS}

    ## スキルを使わず、自分の知識で回答するケース
    - 「○○について調べて」「○○って何？」→ AI自身の知識で回答
    - 「どうしたらいいと思う？」「アドバイスください」→ 自分の考えで提案
    - 「○○のやり方教えて」→ 手順・方法を説明
    - プログラミング、技術、ビジネス、一般知識の質問 → AI知識で回答
    - 壁打ち、ブレスト、アイデア出し → 創造的に一緒に考える
    - 文章の添削、要約、翻訳 → AIの得意分野として対応
    `;
}

/* ──────────────────────────────────────────
   Types / SSE Helper（変更なし）
   ────────────────────────────────────────── */
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

    (async () => {
      try {
        // ── Notionから設定を取得 ──
        const settings = await getSettings();
        const model = resolveModel(settings.model);
        const systemPrompt = buildSystemPrompt(settings);

        const apiMessages = trimmed.map((msg: ChatMessage) => ({
          role: msg.role,
          content: msg.content,
        }));

        let response = await client.messages.create({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          tools: SKILLS,
          messages: apiMessages,
        });

        const conversationMessages: Anthropic.MessageParam[] = [...apiMessages];

        while (response.stop_reason === "tool_use") {
          const assistantContent = response.content;

          for (const block of assistantContent) {
            if (block.type === "text" && block.text) {
              sse.sendText(block.text);
            }
          }

          conversationMessages.push({
            role: "assistant",
            content: assistantContent,
          });

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

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUseBlocks) {
            sse.sendStatus(`${toolUse.name} を実行中...`);
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

          conversationMessages.push({ role: "user", content: toolResults });

          response = await client.messages.create({
            model,
            max_tokens: 2048,
            system: systemPrompt,
            tools: SKILLS,
            messages: conversationMessages,
          });
        }

        for (const block of response.content) {
          if (block.type === "text" && block.text) {
            const text = block.text;
            const chunkSize = 8;
            for (let i = 0; i < text.length; i += chunkSize) {
              sse.sendText(text.slice(i, i + chunkSize));
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
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
