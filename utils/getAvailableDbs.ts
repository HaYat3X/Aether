/* ──────────────────────────────────────────
   利用可能なDB一覧を取得
   ────────────────────────────────────────── */
export const getAvailableDBs = (
  ds_registry: Record<string, string | undefined>,
): string[] =>
  Object.entries(ds_registry)
    .filter(([, id]) => Boolean(id)) // IDが設定されているもののみ
    .map(([name]) => name);
