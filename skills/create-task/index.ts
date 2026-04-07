/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { createTaskSchema } from "./schema";

/* ──────────────────────────────────────────
   .mdファイルのコンテンツを取得
   ────────────────────────────────────────── */
const description = fs.readFileSync(
  path.join(process.cwd(), "skills/create-task/SKILL.md"),
  "utf-8",
);
const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), "skills/create-task/SYSTEM_PROMPT.md"),
  "utf-8",
);

/* ──────────────────────────────────────────
   スキルをエクスポート
   ────────────────────────────────────────── */
export const createTaskSkill = {
  tool: {
    name: "create-task",
    description,
    input_schema: createTaskSchema,
  } satisfies Anthropic.Tool,
  systemPrompt,
};
