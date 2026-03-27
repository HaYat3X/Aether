/**
 * ナビゲーションアイテムの型定義
 */
export type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  children?: NavChild[];
};
type NavChild = { href: string; label: string };

/**
 * ユーザー情報の型定義
 */
export type SidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};
