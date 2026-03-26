// ===========================================================
// imports
//============================================================
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { NavItem } from "@/app/types/Sidebar";
import "./NavSection.css";

export function NavSection({
  label,
  items,
  isActive,
  expanded,
  onToggle,
}: {
  label: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
  expanded: string | null;
  onToggle: (href: string) => void;
}) {
  const isExternal = (href: string) => href.startsWith("http");

  return (
    <div className="nav-section">
      <div className="nav-section-label">{label}</div>

      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const hasChildren = !!item.children;
        const isExpanded = expanded === item.href;

        return (
          <div key={item.href}>
            {/* Parent item */}
            {hasChildren ? (
              <button
                onClick={() => onToggle(item.href)}
                className={clsx(
                  "nav-item nav-parent",
                  active && "active",
                  isExpanded && "expanded",
                )}
              >
                <Icon size={18} />
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
                <span className="nav-chevron">
                  <ChevronRight size={14} />
                </span>
              </button>
            ) : isExternal(item.href) ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-item"
              >
                <Icon size={18} />
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </a>
            ) : (
              <Link
                href={item.href}
                className={clsx("nav-item", active && "active")}
              >
                <Icon size={18} />
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            )}

            {/* Sub-menu */}
            {hasChildren && (
              <div className={clsx("nav-sub", isExpanded && "open")}>
                {item.children!.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={clsx(
                      "nav-item",
                      isActive(child.href) && "active",
                    )}
                  >
                    <span className="sub-dot" />
                    <span className="nav-label">{child.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
