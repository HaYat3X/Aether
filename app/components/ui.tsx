import clsx from "clsx";
import type { ReactNode } from "react";

/* ============================================
   Glass Card
   ============================================ */
type GlassCardProps = {
  children: ReactNode;
  className?: string;
  glow?: boolean;
};

export function GlassCard({ children, className, glow }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "glass-card p-5",
        glow && "glow-accent",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ============================================
   Badge
   ============================================ */
type BadgeVariant = "accent" | "green" | "amber" | "pink" | "purple" | "red" | "muted";

const BADGE_COLORS: Record<BadgeVariant, string> = {
  accent: "bg-[var(--color-accent)]/15 text-[var(--color-accent-light)]",
  green: "bg-[var(--color-green)]/15 text-[var(--color-green)]",
  amber: "bg-[var(--color-amber)]/15 text-[var(--color-amber)]",
  pink: "bg-[var(--color-pink)]/15 text-[var(--color-pink)]",
  purple: "bg-[var(--color-purple)]/15 text-[var(--color-purple)]",
  red: "bg-[var(--color-red)]/15 text-[var(--color-red)]",
  muted: "bg-white/5 text-[var(--color-text-muted)]",
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "accent", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        BADGE_COLORS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ============================================
   Section Header
   ============================================ */
type SectionHeaderProps = {
  title: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={clsx("flex items-center justify-between", className)}>
      <h2 className="text-sm font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
        {title}
      </h2>
      {action}
    </div>
  );
}
