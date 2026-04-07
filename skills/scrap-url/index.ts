/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { scrapUrlSchema } from "./schema";

/* ──────────────────────────────────────────
   .mdファイルのコンテンツを取得
   ────────────────────────────────────────── */
const description = fs.readFileSync(
  path.join(process.cwd(), "skills/scrap-url/SKILL.md"),
  "utf-8",
);
const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), "skills/scrap-url/SYSTEM_PROMPT.md"),
  "utf-8",
);

/* ──────────────────────────────────────────
   スキルをエクスポート
   ────────────────────────────────────────── */
export const scrapUrlSkill = {
  tool: {
    name: "scrap-url",
    description,
    input_schema: scrapUrlSchema,
  } satisfies Anthropic.Tool,
  systemPrompt,
};
