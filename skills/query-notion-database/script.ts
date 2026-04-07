/* ──────────────────────────────────────────
   インポート
   ────────────────────────────────────────── */
import { getNotionClient } from "@/services/NotionClient";
import { getAvailableDBs } from "@/utils/getAvailableDbs";

/* ──────────────────────────────────────────
   Data Source Registry
   各NotionデータソースIDを管理
   ────────────────────────────────────────── */
const DS_REGISTRY: Record<string, string | undefined> = {
  タスク: process.env.NOTION_TASK_DS_ID,
  デイリープラン: process.env.NOTION_DAILY_DS_ID,
  スクラップ: process.env.NOTION_SCRAP_DS_ID,
  ナレッジ: process.env.NOTION_KNOWLEDGE_DS_ID,
};

/* ──────────────────────────────────────────
   型定義
   ────────────────────────────────────────── */
export type QueryInput = {
  database_name: string;
  status_filter?: string;
  limit?: number;
};

/* ──────────────────────────────────────────
   Notionプロパティ値を汎用的に抽出
   各プロパティ型ごとに値を整形して返す
   ────────────────────────────────────────── */
const extractProp = (prop: any): string | number | boolean | null => {
  if (!prop) return null;

  switch (prop.type) {
    case "title":
      // タイトル（配列 → 文字列結合）
      return prop.title?.map((t: any) => t.plain_text).join("") ?? "";

    case "rich_text":
      // リッチテキスト（配列 → 文字列結合）
      return prop.rich_text?.map((t: any) => t.plain_text).join("") ?? "";

    case "number":
      return prop.number ?? null;

    case "select":
      return prop.select?.name ?? null;

    case "multi_select":
      // 複数選択 → カンマ区切り文字列
      return prop.multi_select?.map((s: any) => s.name).join(", ") ?? "";

    case "status":
      return prop.status?.name ?? null;

    case "checkbox":
      return prop.checkbox ?? null;

    case "date":
      // 開始のみ or 期間（start ~ end）
      if (!prop.date) return null;
      return prop.date.end
        ? `${prop.date.start} ~ ${prop.date.end}`
        : prop.date.start;

    case "url":
      return prop.url ?? null;

    case "created_time":
    case "last_edited_time":
      return prop[prop.type];

    case "formula":
      // 数値 or 文字列どちらも対応
      return prop.formula?.string ?? prop.formula?.number ?? null;

    case "rollup":
      return prop.rollup?.number ?? null;

    case "relation":
      // 関連件数のみ返す
      return prop.relation?.length ? `${prop.relation.length}件` : null;

    default:
      return null;
  }
};

/* ──────────────────────────────────────────
   フィルター構築
   入力条件からNotion用filterオブジェクトを生成
   ────────────────────────────────────────── */
const buildFilters = (input: QueryInput): any | undefined => {
  const filters: any[] = [];

  // ステータスフィルター
  if (input.status_filter) {
    filters.push({
      property: "ステータス",
      status: { equals: input.status_filter },
    });
  }

  // フィルターがない場合はundefined
  if (filters.length === 0) return undefined;

  // 1件ならそのまま、複数ならAND条件
  if (filters.length === 1) return filters[0];

  return { and: filters };
};

/* ──────────────────────────────────────────
   Notionデータベース検索
   指定データソースからレコードを取得
   ────────────────────────────────────────── */
export const queryNotionDatabase = async (input: QueryInput) => {
  const dsId = DS_REGISTRY[input.database_name];

  // データベース存在チェック
  if (!dsId) {
    return {
      success: false,
      error: `「${input.database_name}」は存在しません。利用可能: ${getAvailableDBs(DS_REGISTRY).join(", ")}`,
    };
  }

  // クエリパラメータ構築
  const params = {
    data_source_id: dsId,
    page_size: input.limit ?? 20,
    filter: buildFilters(input),
  };

  // Notion API呼び出し
  const res = await getNotionClient.dataSources.query(params);

  // レスポンス整形
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (res.results ?? []).map((page: any) => {
    const props: Record<string, unknown> = {};

    // 全プロパティを走査して整形
    if (page.properties) {
      for (const [key, value] of Object.entries(page.properties)) {
        const extracted = extractProp(value);

        // nullや空文字は除外
        if (extracted !== null && extracted !== "") {
          props[key] = extracted;
        }
      }
    }

    return {
      id: page.id,
      url: page.url ?? null,
      ...props,
    };
  });

  return {
    success: true,
    database: input.database_name,
    count: items.length,
    items,
  };
};
