/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { createEventSchema } from "./schema";

/* ──────────────────────────────────────────
   .mdファイルのコンテンツを取得
   ────────────────────────────────────────── */
const description = fs.readFileSync(
  path.join(process.cwd(), "skills/create-event/SKILL.md"),
  "utf-8",
);
const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), "skills/create-event/SYSTEM_PROMPT.md"),
  "utf-8",
);

/* ──────────────────────────────────────────
   スキルをエクスポート
   ────────────────────────────────────────── */
export const createEventSkill = {
  tool: {
    name: "create-event",
    description,
    input_schema: createEventSchema,
  } satisfies Anthropic.Tool,
  systemPrompt,
};
