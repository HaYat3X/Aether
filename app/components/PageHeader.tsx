"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import "./PageHedar.css";
import {
  MessageSquare,
  Calendar,
  CheckSquare,
  Clock,
  BookOpen,
  Settings,
  Blocks,
  Bot,
  TowelRack,
  TrendingUp,
  ListChecks
} from "lucide-react";

type PageMeta = {
  title: string;
  subtitle: string;
  icon: React.ElementType;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: "info" | "success" | "warning" | "error";
};

const PAGE_META: Record<string, PageMeta> = {
  "/chat": {
    title: "AIアシスタント",
    subtitle: "AIアシスタント「Luno」とチャット",
    icon: Bot,
  },
  "/tasks": { title: "タスク", subtitle: "今週のタスク一覧", icon: ListChecks },
  "/daily": { title: "行動プラン", subtitle: "今日の行動プラン", icon: Clock },
  "/scraps": { title: "スクラップ", subtitle: "アイデアや気になることなどの一時メモ", icon: TowelRack },
  "/trends": { title: "トレンド", subtitle: "今週の最新トレンド", icon: TrendingUp },
  "/integrations": {
    title: "Integrations",
    subtitle: "外部サービス連携",
    icon: Blocks,
  },
};

function getToday() {
  const d = new Date();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = weekdays[d.getDay()];

  return `${year}年${month}月${date}日（${day}）`;
}

export default function PageHeader() {
  const pathname = usePathname();
  const page = PAGE_META[pathname ?? ""] ?? {
    title: "Aether",
    subtitle: "",
    icon: MessageSquare,
  };
  const Icon = page.icon;

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // パネル外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  return (
    <>
      <header className="page-header">
        {/* Left — icon + titles */}
        <div className="page-header-left">
          <div className="page-header-icon">
            <Icon size={18} />
          </div>
          <div>
            <h1 className="page-header-title">{page.title}</h1>
            {page.subtitle && (
              <p className="page-header-subtitle">{page.subtitle}</p>
            )}
          </div>
        </div>

        {/* Right — date + notification bell */}
        <div className="page-header-right">
          <span className="page-header-date">{getToday()}</span>
        </div>
      </header>
    </>
  );
}