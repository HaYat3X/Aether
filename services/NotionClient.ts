/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import { Client } from "@notionhq/client";

/* ──────────────────────────────────────────
   Notion Client
   ────────────────────────────────────────── */
export const getNotionClient = new Client({
  auth: process.env.NOTION_API_KEY,
});
