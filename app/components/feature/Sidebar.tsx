"use client";

// ===========================================================
// imports
//============================================================
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  CheckSquare,
  Clock,
  BookOpen,
  Settings,
  Bot,
  Sun,
  Gamepad2,
  Target,
  Flag,
  CalendarCheck,
  LogOut,
  TrendingUp,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { NavSection } from "../ui/NavSection/NavSection";
import type { NavItem, SidebarUser } from "@/app/types/Sidebar";
import "./Sidebar.css";

// ===========================================================
// lifecycles
//============================================================
const MAIN_NAV: NavItem[] = [
  {
    href: "/chat",
    icon: Bot,
    label: "AI Assistant",
  },
  {
    href: "/tasks",
    icon: CheckSquare,
    label: "Tasks",
  },
  { href: "/daily", icon: Clock, label: "Daily Plan" },
  { href: "/scraps", icon: BookOpen, label: "Scraps" },
  { href: "/trends", icon: TrendingUp, label: "Trend" },
];

const SERVICE_NAV: NavItem[] = [
  {
    href: "https://claude.ai/",
    icon: Sun,
    label: "claude.ai",
  },
  {
    href: "https://calendar.google.com/calendar/u/0/r",
    icon: CalendarCheck,
    label: "Google カレンダー",
  },
  {
    href: "https://www.notion.so/2cffab19d29580259d19c77e884147e5?source=copy_link",
    icon: Gamepad2,
    label: "とげのポータル",
  },
  {
    href: "https://www.notion.so/31cfab19d29580f6a60be2f48fe220b1?source=copy_link",
    icon: Flag,
    label: "目標管理ポータル",
  },
  {
    href: "https://www.notion.so/325fab19d29580dfaf52fad46b92629f?source=copy_link",
    icon: Target,
    label: "プロジェクトポータル",
  },
];

const SYSTEM_NAV: NavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
];

// ===========================================================
// Components
//============================================================
export default function Sidebar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const toggleExpand = (href: string) =>
    setExpanded((prev) => (prev === href ? null : href));

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    <>
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* ── Brand ── */}
        <div className="sidebar-brand">
          <Link href="/chat" className="brand-icon">
            <Image
              src="/login.png"
              alt="Lumo"
              width={36}
              height={36}
              className="rounded-[10px]"
            />
          </Link>
          <Link href="/chat" className="brand-name">
            Lumo
          </Link>
        </div>

        <div className="sidebar-scroll">
          {/* ── Main Nav ── */}
          <NavSection
            label="Menu"
            items={MAIN_NAV}
            isActive={isActive}
            expanded={expanded}
            onToggle={toggleExpand}
          />

          {/* ── Service Nav ── */}
          <NavSection
            label="Other Service"
            items={SERVICE_NAV}
            isActive={isActive}
            expanded={expanded}
            onToggle={toggleExpand}
          />

          {/* ── System Nav ── */}
          <NavSection
            label="System"
            items={SYSTEM_NAV}
            isActive={isActive}
            expanded={expanded}
            onToggle={toggleExpand}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Divider ── */}
        <div className="sidebar-divider" />

        <div className="sidebar-user">
          <button
            className="user-avatar-btn"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="ログアウト"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? ""}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div className="user-avatar">{user?.name?.[0] ?? "?"}</div>
            )}
          </button>
          <div className="user-info">
            <div className="user-name">{user?.name ?? "Unknown"}</div>
            <div className="user-email">{user?.email?.split("@")[0] ?? ""}</div>
          </div>
          <button
            className="user-logout-btn"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="ログアウト"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
