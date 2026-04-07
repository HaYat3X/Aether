/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { scrapTextSchema } from "./schema";

/* ──────────────────────────────────────────
   .mdファイルのコンテンツを取得
   ────────────────────────────────────────── */
const description = fs.readFileSync(
  path.join(process.cwd(), "skills/scrap-text/SKILL.md"),
  "utf-8",
);
const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), "skills/scrap-text/SYSTEM_PROMPT.md"),
  "utf-8",
);

/* ──────────────────────────────────────────
   スキルをエクスポート
   ────────────────────────────────────────── */
export const scrapTextSkill = {
  tool: {
    name: "scrap-text",
    description,
    input_schema: scrapTextSchema,
  } satisfies Anthropic.Tool,
  systemPrompt,
};
