/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { scrapRegisterSchema } from "./schema";

/* ──────────────────────────────────────────
   .mdファイルのコンテンツを取得
   ────────────────────────────────────────── */
const description = fs.readFileSync(
  path.join(process.cwd(), "skills/scrap-register/SKILL.md"),
  "utf-8",
);

/* ──────────────────────────────────────────
   スキルをエクスポート
   ────────────────────────────────────────── */
export const scrapRegisterSkill = {
  tool: {
    name: "scrap-register",
    description,
    input_schema: scrapRegisterSchema,
  } satisfies Anthropic.Tool,
  systemPrompt: null, // 内部スキルのためsystemPrompt不要
};
