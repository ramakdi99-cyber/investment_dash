import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-2xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        neutral: "border-ink-line bg-ink-wash text-ink-muted",
        outline: "border-ink-line bg-white text-ink-muted",
        cobalt: "border-cobalt/20 bg-cobalt-soft text-cobalt",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
      },
      size: {
        default: "h-[22px] px-2",
        sm: "h-5 px-1.5 text-[10px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Renders a leading status dot in the given colour. */
  dotColor?: string;
}

export function Badge({ className, variant, size, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dotColor ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </span>
  );
}

export { badgeVariants };
