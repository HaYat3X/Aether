"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/chat": { title: "AI Chat", subtitle: "AIアシスタントとチャット" },
  "/schedule": { title: "Schedule", subtitle: "週間スケジュール" },
  "/tasks": { title: "Tasks", subtitle: "タスク管理" },
  "/daily": { title: "Daily Plan", subtitle: "今日のプラン" },
  "/scraps": { title: "Scraps", subtitle: "アイデアメモ" },
  "/settings": { title: "Settings", subtitle: "設定" },
};

export default function PageHeader() {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname ?? ""] ?? {
    title: "AI秘書",
    subtitle: "",
  };

  return (
    <header className="flex items-end gap-3 pb-6">
      <h1 className="font-[var(--font-heading)] text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {page.title}
      </h1>
      {page.subtitle && (
        <span className="mb-0.5 text-sm text-[var(--color-text-muted)]">
          {page.subtitle}
        </span>
      )}
    </header>
  );
}
