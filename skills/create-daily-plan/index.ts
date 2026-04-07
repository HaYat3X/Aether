/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { createDailyPlanSchema } from "./schema";

/* ──────────────────────────────────────────
   .mdファイルのコンテンツを取得
   ────────────────────────────────────────── */
const description = fs.readFileSync(
  path.join(process.cwd(), "skills/create-daily-plan/SKILL.md"),
  "utf-8",
);
const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), "skills/create-daily-plan/SYSTEM_PROMPT.md"),
  "utf-8",
);

/* ──────────────────────────────────────────
   スキルをエクスポート
   ────────────────────────────────────────── */
export const createDailyPlanSkill = {
  tool: {
    name: "create-daily-plan",
    description,
    input_schema: createDailyPlanSchema,
  } satisfies Anthropic.Tool,
  systemPrompt,
};
