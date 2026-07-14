"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function getInitials(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) {
    return "TJ";
  }

  const parts = text
    .split(/\s+/)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  if (!parts.length) {
    return text.slice(0, 2).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function InitialsAvatar({
  className,
  label,
  size = "md",
}: {
  className?: string;
  label: string | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
        ? "h-11 w-11 text-sm"
        : "h-9 w-9 text-xs";

  return (
    <Avatar className={cn(sizeClass, "border border-border", className)}>
      <AvatarFallback className="bg-(--color-surface) font-semibold text-(--color-ink-strong)">
        {getInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
