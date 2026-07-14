"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Menu({
  align = "right",
  buttonClassName = "",
  children,
  label,
}: {
  align?: "left" | "right";
  buttonClassName?: string;
  children: ReactNode;
  label: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={buttonClassName}
          type="button"
          variant="outline"
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align === "right" ? "end" : "start"}
        className="min-w-[220px] rounded-2xl"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MenuItem({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return <DropdownMenuItem onSelect={onClick}>{children}</DropdownMenuItem>;
}

export function MenuDivider() {
  return <DropdownMenuSeparator />;
}

export function MenuHint({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="space-y-1 px-1.5 py-1">
      <p className="text-sm font-medium leading-5 text-(--color-ink-strong)">{label}</p>
      <p className="text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}
