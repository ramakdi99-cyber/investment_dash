import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent view header: badge slot, title, description, right-aligned actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-2xs font-semibold uppercase tracking-[0.1em] text-cobalt">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}