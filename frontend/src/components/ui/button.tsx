import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium leading-5 transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-[var(--color-brand-ring)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border border-[var(--color-brand)] bg-[var(--color-brand)] text-white hover:border-[var(--color-brand-strong)] hover:bg-[var(--color-brand-strong)]",
        default:
          "border border-[var(--color-brand)] bg-[var(--color-brand)] text-white hover:border-[var(--color-brand-strong)] hover:bg-[var(--color-brand-strong)]",
        secondary:
          "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)] hover:bg-[var(--color-surface)]",
        ghost:
          "border border-transparent bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface)]",
        danger:
          "border border-rose-200 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700",
        destructive:
          "border border-rose-200 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700",
        outline:
          "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-brand)] hover:bg-white",
        link: "text-[var(--color-brand)] underline-offset-4 hover:underline",
      },
      size: {
        xs: "min-h-9 rounded-lg px-2.5 py-1.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-10 rounded-lg px-3 py-2 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        md: "min-h-11 rounded-lg px-4 py-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        default:
          "min-h-11 rounded-lg px-4 py-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "min-h-11 rounded-lg px-5 py-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        icon: "h-11 w-11 rounded-lg p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "h-9 w-9 rounded-lg p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "h-12 w-12 rounded-lg p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
