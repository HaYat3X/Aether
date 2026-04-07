/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import { google, calendar_v3 } from "googleapis";

/* ──────────────────────────────────────────
   Google Calendar Client (Service Account)
   環境変数から credentials を読み込む方式
   ── Vercel デプロイ対応 ──
   ────────────────────────────────────────── */
export const getCalendarClient = (): calendar_v3.Calendar => {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "環境変数 GOOGLE_SERVICE_ACCOUNT_KEY が設定されていません。" +
        "Vercel の Settings → Environment Variables に google-service-account.json の中身を登録してください。",
    );
  }

  const credentials = JSON.parse(serviceAccountKey);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
};
