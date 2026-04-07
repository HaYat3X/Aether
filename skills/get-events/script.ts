/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import { calendar_v3 } from "googleapis";
import { getCalendarClient } from "@/services/GoogleCalendarClient";
import { getTodayJST } from "@/utils/getTodayJST";
import { addDays } from "@/utils/addDays";

/* ──────────────────────────────────────────
   環境変数
   ────────────────────────────────────────── */
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";
const TIMEZONE = "Asia/Tokyo";

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
export type GetEventsInput = {
  date?: string;
  days?: number;
};

/* ──────────────────────────────────────────
   デバッグログ
   ────────────────────────────────────────── */
// TODO: いずれ、共通化する
const debugLog = (label: string, data?: unknown) => {
  console.log(`🟡 [GCal DEBUG] ${label}`, data ?? "");
};

const debugError = (label: string, error: unknown) => {
  console.error(`🔴 [GCal ERROR] ${label}`, error);
};

/* ──────────────────────────────────────────
   カレンダーイベント取得
   ────────────────────────────────────────── */
export const getEvents = async (input: GetEventsInput) => {
  const calendar: calendar_v3.Calendar = getCalendarClient();

  // カレンダー一覧（権限確認用）
  try {
    const calList = await calendar.calendarList.list();

    debugLog(
      "アクセス可能カレンダー一覧",
      calList.data.items?.map((c) => ({
        id: c.id,
        summary: c.summary,
        accessRole: c.accessRole,
      })),
    );
  } catch (e) {
    debugError("calendarList 取得失敗", (e as Error).message);
  }

  debugLog("使用カレンダーID", CALENDAR_ID);

  // 日付パラメータ決定
  const dateStr = input.date ?? getTodayJST();
  const days = input.days ?? 1;

  const timeMin = `${dateStr}T00:00:00+09:00`;
  const timeMax = `${addDays(dateStr, days)}T00:00:00+09:00`;

  debugLog("取得期間", { timeMin, timeMax, timezone: TIMEZONE });

  // イベント取得
  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    timeZone: TIMEZONE,
    maxResults: 50,
  });

  const events = (res.data.items ?? []).map((ev) => ({
    id: ev.id,
    title: ev.summary ?? "(無題)",
    start: ev.start?.dateTime ?? ev.start?.date ?? "",
    end: ev.end?.dateTime ?? ev.end?.date ?? "",
    allDay: !ev.start?.dateTime,
    description: ev.description ?? "",
    location: ev.location ?? "",
  }));

  debugLog("取得結果", { count: events.length });

  return {
    success: true,
    date: dateStr,
    days,
    count: events.length,
    events,
  };
};
