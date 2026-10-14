import { cn } from "@/lib/utils";

/**
 * The single loading primitive used by every area of the product.
 * Composed shapes (rows, cards, board columns) are built from this.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton rounded-md", className)} {...props} />;
}

/** Standard "n rows of a table" placeholder. */
export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-ink-line", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-6 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="hidden h-3.5 w-56 lg:block" />
          <Skeleton className="ml-auto h-5 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="card-surface p-5">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-3 h-3 w-36" />
    </div>
  );
}

export function SkeletonKanbanColumn({ cards = 3 }: { cards?: number }) {
  return (
    <div className="w-[288px] shrink-0 rounded-xl border border-ink-line bg-ink-wash/60 p-3">
      <Skeleton className="h-4 w-24" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="rounded-lg border border-ink-line bg-white p-3.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
