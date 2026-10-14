import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SkeletonMetricCard } from "@/components/ui/skeleton";

/**
 * A quiet, typography-led metric card. Cobalt is reserved for the "primary"
 * metric of the row so the eye lands on Total Leads first and the accent
 * keeps its meaning.
 */
export function MetricCard({
  label,
  value,
  sub,
  accent = false,
  icon,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "card-surface animate-fade-in-up px-4 py-4",
        accent && "border-cobalt/25 bg-cobalt-soft/25",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className={cn("truncate text-2xs font-semibold uppercase tracking-[0.07em]", accent ? "text-cobalt" : "text-ink-subtle")}>
          {label}
        </p>
        {icon ? (
          <span className={cn("flex size-6 items-center justify-center rounded-md", accent ? "bg-cobalt text-white" : "bg-ink-wash text-ink-subtle")}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className={cn("tabular mt-2.5 truncate text-[26px] font-semibold leading-8 tracking-[-0.02em]", accent ? "text-cobalt" : "text-ink")}>
        {value}
      </p>
      {sub ? <p className="mt-1 truncate text-2xs leading-4 text-ink-subtle">{sub}</p> : null}
    </div>
  );
}

export function MetricCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-6">
      {children}
    </div>
  );
}

export function MetricCardSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonMetricCard key={index} />
      ))}
    </div>
  );
}

/** Small inline delta, e.g. "+3 vs yesterday". */
export function Delta({
  value,
  positive = true,
  label,
}: {
  value: number;
  positive?: boolean;
  label: string;
}) {
  const dir = positive ? "↑" : "↓";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        positive ? "text-emerald-700" : "text-ink-subtle",
      )}
    >
      <span aria-hidden="true">{dir}</span>
      {value}
      <span className="font-normal text-ink-subtle">{label}</span>
    </span>
  );
}