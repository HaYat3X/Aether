// 日付にN日加算（YYYY-MM-DD）
export const addDays = (dateStr: string, n: number): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().split("T")[0];
};