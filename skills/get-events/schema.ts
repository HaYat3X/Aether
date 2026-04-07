/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   スキーマ
   ────────────────────────────────────────── */
export const getEventsSchema: Anthropic.Tool["input_schema"] = {
  type: "object",
  properties: {
    date: {
      type: "string",
      description: "取得したい日付（YYYY-MM-DD形式）。省略時は今日。",
    },
    days: {
      type: "number",
      description: "何日分取得するか。デフォルト1。「今週」なら7。",
    },
  },
  required: [],
};
