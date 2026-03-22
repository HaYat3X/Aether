"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Calendar,
  CheckSquare,
  Clock,
  BookOpen,
  Settings,
  Bot,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/chat", icon: MessageSquare, label: "AIチャット" },
  { href: "/schedule", icon: Calendar, label: "スケジュール" },
  { href: "/tasks", icon: CheckSquare, label: "タスク" },
  { href: "/daily", icon: Clock, label: "デイリープラン" },
  { href: "/scraps", icon: BookOpen, label: "スクラップ" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-dvh w-[68px] flex-col items-center border-r border-white/[0.04] bg-[var(--color-bg-surface)] py-5">
      {/* Logo */}
      <Link
        href="/chat"
        className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent-glow)]"
      >
        <Bot size={20} />
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || pathname?.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={clsx(
                "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                isActive
                  ? "bg-white/[0.08] text-[var(--color-accent-light)]"
                  : "text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {/* Active bar indicator */}
              {isActive && <span className="nav-active-bar" />}

              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Settings (bottom) */}
      <Link
        href="/settings"
        title="設定"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]"
      >
        <Settings size={20} strokeWidth={1.5} />
      </Link>
    </aside>
  );
}
