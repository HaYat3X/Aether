## Googleカレンダーに新しい予定を登録するスキル

## パラメータ

- title（必須）: 予定のタイトル
- date（必須）: 日付（YYYY-MM-DD形式）
- startTime（必須）: 開始時刻（HH:mm形式）
- endTime（任意）: 終了時刻（HH:mm形式）
- description（任意）: 詳細説明
- location（任意）: 場所

## デフォルト動作

- endTime 未指定 → startTime の1時間後を自動設定

## 出力

- 作成されたイベント情報
  - タイトル
  - 日付
  - 開始時刻
  - 終了時刻
  - 説明
  - 場所
  - 作成結果（成功 / 失敗）
- AIの応援メッセージ
