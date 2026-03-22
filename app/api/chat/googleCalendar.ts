import { google, calendar_v3 } from "googleapis";

/* ──────────────────────────────────────────
   Google Calendar Client (Service Account)
   環境変数から credentials を読み込む方式
   ── Vercel デプロイ対応 ──
   ────────────────────────────────────────── */
function getCalendarClient(): calendar_v3.Calendar {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "環境変数 GOOGLE_SERVICE_ACCOUNT_KEY が設定されていません。" +
        "Vercel の Settings → Environment Variables に google-service-account.json の中身を登録してください。"
    );
  }

  const credentials = JSON.parse(serviceAccountKey);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";
const TIMEZONE = "Asia/Tokyo";

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */
type GetEventsInput = {
  date?: string;
  days?: number;
};

type CreateEventInput = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
};

/* ──────────────────────────────────────────
   Get Events
   ────────────────────────────────────────── */
export async function getEvents(input: GetEventsInput) {
  const calendar = getCalendarClient();

  // デバッグ: サービスアカウントから見えるカレンダー一覧
  try {
    const calList = await calendar.calendarList.list();
    console.log(
      "[GCal Debug] Accessible calendars:",
      calList.data.items?.map((c) => ({
        id: c.id,
        summary: c.summary,
        accessRole: c.accessRole,
      }))
    );
  } catch (e) {
    console.log("[GCal Debug] calendarList error:", (e as Error).message);
  }

  console.log("[GCal Debug] Requesting calendarId:", CALENDAR_ID);

  // JSTで今日の日付を取得
  function getTodayJST(): string {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return jst.toISOString().split("T")[0];
  }

  // YYYY-MM-DD にN日加算する（純粋な日付計算）
  function addDays(dateStr: string, n: number): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + n));
    return date.toISOString().split("T")[0];
  }

  const dateStr = input.date ?? getTodayJST();
  const days = input.days ?? 1;

  const timeMin = `${dateStr}T00:00:00+09:00`;
  const timeMax = `${addDays(dateStr, days)}T00:00:00+09:00`;

  console.log("[GCal Debug] timeMin:", timeMin, "timeMax:", timeMax);

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

  return {
    success: true,
    date: dateStr,
    days,
    count: events.length,
    events,
  };
}

/* ──────────────────────────────────────────
   Create Event
   ────────────────────────────────────────── */
export async function createEvent(input: CreateEventInput) {
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
}