/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import { getCalendarClient } from "@/services/GoogleCalendarClient";

/* ──────────────────────────────────────────
   環境変数
   ────────────────────────────────────────── */
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";
const TIMEZONE = "Asia/Tokyo";

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
export type CreateEventInput = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
};

/* ──────────────────────────────────────────
   カレンダーイベント作成
   ────────────────────────────────────────── */
export const createEvent = async (input: CreateEventInput) => {
  console.log("イベント作成");
  const calendar = getCalendarClient();

  const startDateTime = `${input.date}T${input.start_time}:00`;
  const endDateTime = `${input.date}T${input.end_time}:00`;

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: input.title,
      description: input.description ?? "",
      start: {
        dateTime: startDateTime,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: TIMEZONE,
      },
    },
  });

  return {
    success: true,
    eventId: res.data.id,
    title: input.title,
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    htmlLink: res.data.htmlLink ?? null,
  };
};
