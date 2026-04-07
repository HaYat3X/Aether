import Anthropic from "@anthropic-ai/sdk";
import { scrapRegister } from "../scrap-register/script";

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
export type ScrapTextInput = {
  content: string;
  kind?: "アイデア" | "気づき" | "調べたいこと" | "モヤモヤ" | "ひとこと";
  context?: string;
};

type AnalyzedContent = {
  title: string;
  summary: string;
  kind: "アイデア" | "気づき" | "調べたいこと" | "モヤモヤ" | "ひとこと";
};

/* ──────────────────────────────────────────
   AIによるテキスト整理・分類
   ────────────────────────────────────────── */
async function analyzeTextContent(
  content: string,
  userKind?: ScrapTextInput["kind"],
  context?: string,
): Promise<AnalyzedContent> {
  const client = new Anthropic();

  const kindInstruction = userKind
    ? `種類は必ず「${userKind}」を使用すること。`
    : `種類は以下から最も適切なものを1つ選ぶこと：アイデア / 気づき / 調べたいこと / モヤモヤ / ひとこと`;

  const contextSection = context ? `\n補足コンテキスト：${context}` : "";

  const prompt = `以下のテキスト・メモを分析して整理し、JSONで回答してください。${contextSection}

テキスト内容:
${content.slice(0, 8000)}

以下のJSON形式のみで回答してください（説明・マークダウン不要）:
{
  "title": "内容を端的に表すタイトル（30文字以内）",
  "summary": "内容を整理・要約した概要（100〜200文字）。元の意図・ニュアンスを損なわずに読みやすく整形する。",
  "kind": "種類"
}

${kindInstruction}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI response did not contain valid JSON");

  return JSON.parse(jsonMatch[0]) as AnalyzedContent;
}

/* ──────────────────────────────────────────
   メイン処理
   ────────────────────────────────────────── */
export const scrapText = async (input: ScrapTextInput) => {
  // 1. AI分析・整理
  const analyzed = await analyzeTextContent(
    input.content,
    input.kind,
    input.context,
  );

  // 2. 登録処理をscrap-registerに委譲（URLなし）
  return await scrapRegister({
    title: analyzed.title,
    summary: analyzed.summary,
    kind: analyzed.kind,
  });
};
