/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import { createTaskSkill } from "./create-task";
import { createTask } from "./create-task/script";

import { getEventsSkill } from "./get-events";
import { getEvents } from "./get-events/script";

import { createEventSkill } from "./create-event";
import { createEvent } from "./create-event/script";

import { queryNotionDatabaseSkill } from "./query-notion-database";
import { queryNotionDatabase } from "./query-notion-database/script";

import { createDailyPlanSkill } from "./create-daily-plan";
import { createDailyPlan } from "./create-daily-plan/script";

import type Anthropic from "@anthropic-ai/sdk";
import type { CreateTaskInput } from "./create-task/script";
import type { CreateEventInput } from "./create-event/script";
import type { QueryInput } from "./query-notion-database/script";
import type { CreateDailyPlanInput } from "./create-daily-plan/script";
import type { GetEventsInput } from "./get-events/script";

/* ──────────────────────────────────────────
   SKILLSリスト
   ────────────────────────────────────────── */
export const SKILLS: Anthropic.Tool[] = [
  createTaskSkill.tool,
  getEventsSkill.tool,
  createEventSkill.tool,
  queryNotionDatabaseSkill.tool,
  createDailyPlanSkill.tool,
];

/* ──────────────────────────────────────────
   SYSTEM_PROMPTリスト
   ────────────────────────────────────────── */
export const SYSTEM_PROMPTS = [
  createTaskSkill,
  getEventsSkill,
  createEventSkill,
  queryNotionDatabaseSkill,
  createDailyPlanSkill,
]
  .map((s) => s.systemPrompt)
  .filter(Boolean)
  .join("\n\n---\n\n");

/* ──────────────────────────────────────────
   executeToolルーター
   ここで、スキルとスクリプトを連携させる
   null を返したら既存の executeTool にフォールバックする設計
   NOTE: 設計として、スキルを複数組み合わせてワークフローみたいにすることがあるので、ここで紐づけるようにする
   ────────────────────────────────────────── */
export async function executeSkill(
  toolName: string,
  toolInput: Record<string, unknown>,
): Promise<string | null> {
  switch (toolName) {
    case "create-task": {
      const result = await createTask(toolInput as CreateTaskInput);
      return JSON.stringify(result);
    }
    case "get-events": {
      const result = await getEvents(toolInput as GetEventsInput);
      return JSON.stringify(result);
    }
    case "create-event": {
      const result = await createEvent(toolInput as CreateEventInput);
      return JSON.stringify(result);
    }
    case "query-notion-database": {
      const result = await queryNotionDatabase(toolInput as QueryInput);
      return JSON.stringify(result);
    }
    case "create-daily-plan": {
      const result = await createDailyPlan(toolInput as CreateDailyPlanInput);
      return JSON.stringify(result);
    }
    default:
      return null;
  }
}
