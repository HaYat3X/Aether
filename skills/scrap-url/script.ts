import Anthropic from "@anthropic-ai/sdk";
import { scrapRegister } from "../scrap-register/script";

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
export type ScrapUrlInput = {
  url: string;
  kind?: "アイデア" | "気づき" | "調べたいこと" | "モヤモヤ" | "ひとこと";
  memo?: string;
};

type AnalyzedContent = {
  title: string;
  summary: string;
  kind: "アイデア" | "気づき" | "調べたいこと" | "モヤモヤ" | "ひとこと";
};

/* ──────────────────────────────────────────
   URLのHTMLを取得してテキストを抽出
   ────────────────────────────────────────── */
async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LumoBot/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 8000);
}

/* ──────────────────────────────────────────
   AIによるページ内容の要約・分類
   ────────────────────────────────────────── */
async function analyzePageContent(
  pageText: string,
  url: string,
  userKind?: ScrapUrlInput["kind"],
  memo?: string,
): Promise<AnalyzedContent> {
  const client = new Anthropic();

  const kindInstruction = userKind
    ? `種類は必ず「${userKind}」を使用すること。`
    : `種類は以下から最も適切なものを1つ選ぶこと：アイデア / 気づき / 調べたいこと / モヤモヤ / ひとこと`;

  const memoSection = memo ? `\nユーザーのコメント：${memo}` : "";

  const prompt = `以下はWebページのテキスト内容です。このページを分析して、JSONで回答してください。

URL: ${url}${memoSection}

ページ内容:
${pageText}

以下のJSON形式のみで回答してください（説明・マークダウン不要）:
{
  "title": "ページの内容を表す簡潔なタイトル（30文字以内）",
  "summary": "ページの要点をまとめた概要（100〜200文字）",
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
export const scrapUrl = async (input: ScrapUrlInput) => {
  // 1. ページ取得
  const pageText = await fetchPageText(input.url);

  // 2. AI分析
  const analyzed = await analyzePageContent(
    pageText,
    input.url,
    input.kind,
    input.memo,
  );

  // 3. 登録処理をscrap-registerに委譲
  return await scrapRegister({
    title: analyzed.title,
    summary: analyzed.summary,
    kind: analyzed.kind,
    source_url: input.url,
  });
};
