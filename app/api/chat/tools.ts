import Anthropic from "@anthropic-ai/sdk";

/* ──────────────────────────────────────────
   Tool Definitions for Claude API
   ────────────────────────────────────────── */

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description: `Notionのタスク管理データベースに新しいタスクを登録する。
ユーザーが「タスクを登録して」「○○をやらないと」などタスク追加の意図を示した場合に使用する。
タスク名は必須。それ以外は省略可能で、省略された場合はデフォルト値が使われる。`,
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "タスクのタイトル（必須）",
        },
        summary: {
          type: "string",
          description: "タスクの概要・詳細説明（任意）",
        },
        priority: {
          type: "string",
          enum: ["Highest", "High", "Medium", "Low", "Lowest"],
          description:
            "優先度。ユーザーが明示しない場合はMediumをデフォルトとする。",
        },
        category: {
          type: "string",
          enum: ["目標関連", "実務・定常", "プロジェクト", "突発・その他"],
          description:
            "タスクの種類。ユーザーが明示しない場合は「突発・その他」をデフォルトとする。",
        },
        estimated_hours: {
          type: "number",
          description: "見積時間（時間単位、任意）",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "query_notion_database",
    description: `Notionのデータベースからレコードを取得する。
「今のタスク一覧」「進行中のタスクは？」「スクラップ見せて」「デイリープランは？」などデータ参照の意図を示した場合に使用する。
利用可能なデータベース: タスク, デイリープラン, スクラップ, スプリント, ナレッジ, レビュー, OKR, KeyResults
ステータスでフィルターしたい場合は status_filter、スプリントステータスでフィルターしたい場合は sprint_status_filter を指定。`,
    input_schema: {
      type: "object" as const,
      properties: {
        database_name: {
          type: "string",
          enum: [
            "タスク",
            "デイリープラン",
            "スクラップ",
            "スプリント",
            "ナレッジ",
            "レビュー",
            "OKR",
            "KeyResults",
          ],
          description: "取得したいデータベース名",
        },
        status_filter: {
          type: "string",
          description:
            "ステータスでフィルター（任意）。例: '未着手', '進行中', '完了', '保留'",
        },
        sprint_status_filter: {
          type: "string",
          description:
            "スプリントステータスでフィルター（任意・タスクDBのみ有効）。例: '進行中'。タスクDBの「取得用：スプリントステータス」formula列でフィルターする。",
        },
        limit: {
          type: "number",
          description: "取得件数の上限（デフォルト20）",
        },
      },
      required: ["database_name"],
    },
  },
  {
    name: "search_notion",
    description: `Notionワークスペース全体をキーワード検索する。
特定のDBではなく横断的に情報を探したい場合に使用する。
「〇〇について書いたメモある？」「△△に関するページ探して」など。`,
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "検索キーワード",
        },
        limit: {
          type: "number",
          description: "取得件数の上限（デフォルト10）",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_daily_plan",
    description: `Notionのデイリープランデータベースに今日の作業予定を一括登録する。
「デイリープランを作って」「今日の予定を立てて」などの意図で使用する。

【重要な手順】このツールを使う前に、必ず以下の2つを先に実行すること：
1. get_events で今日のGoogleカレンダー予定を取得
2. query_notion_database で database_name="タスク", sprint_status_filter="進行中" でタスクを取得

上記2つの結果を元に以下のルールでプランを組む：
- Googleカレンダーの予定（MTG等）はその時間帯にそのまま配置
- タスクは期限が近い順・優先度が高い順に配置
- 見積時間(h)がある場合はその時間分を確保。なければ1時間を想定
- 12:00-13:00 は昼休憩
- 作業の開始は9:00、終了は18:00を目安
- タスクのidをrelated_task_idに設定して、Notionのリレーションを紐づける
各作業は items 配列で渡す。`,
    input_schema: {
      type: "object" as const,
      properties: {
        items: {
          type: "array",
          description: "デイリープランの各作業項目の配列",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "作業名（必須）",
              },
              start_time: {
                type: "string",
                description: "開始時刻 HH:mm（必須）",
              },
              end_time: {
                type: "string",
                description: "終了時刻 HH:mm（必須）",
              },
              memo: {
                type: "string",
                description: "メモ（任意）",
              },
              target_progress: {
                type: "number",
                description: "目標進捗率 0.0〜1.0（任意）",
              },
              related_task_id: {
                type: "string",
                description: "関連タスクのNotion page ID（任意）",
              },
            },
            required: ["title", "start_time", "end_time"],
          },
        },
        date: {
          type: "string",
          description: "日付 YYYY-MM-DD。省略時は今日。",
        },
      },
      required: ["items"],
    },
  },
];
