import { CloudOff, Database, RefreshCw, ServerOff } from "lucide-react";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/button";

/**
 * A slim status strip between the top bar and the page content that is honest
 * about where the data is coming from:
 *
 * - connecting  -> transient notice while the first fetch is in flight
 * - connected   -> a compact "Live database" chip so demo data is never
 *                  mistaken for real records
 * - unconfigured / failed -> a full-width banner explaining the fallback and
 *                  offering a retry when a connection was attempted
 */
export function ConnectionBanner() {
  const { connection, dataSource, retryConnection } = useStore();

  if (connection.status === "connecting") {
    return (
      <div className="flex items-center gap-2 border-b border-ink-line bg-cobalt-soft/40 px-4 py-1.5 text-2xs text-cobalt sm:px-6">
        <RefreshCw className="size-3 animate-spin" aria-hidden="true" />
        Connecting to Supabase…
      </div>
    );
  }

  if (connection.status === "connected" && dataSource === "database") {
    return (
      <div className="flex items-center gap-2 border-b border-emerald-200/70 bg-emerald-50/60 px-4 py-1.5 text-2xs font-medium text-emerald-800 sm:px-6">
        <Database className="size-3" aria-hidden="true" />
        Live — leads are loading from Supabase. Notes, chat and follow-ups stay
        session-only until the lead_notes / follow_ups tables exist (migrations 002–003).
        {import.meta.env.DEV ? (
          <span className="ml-auto hidden shrink-0 tabular sm:inline text-2xs font-normal text-emerald-700">
            dev · configured: yes · rows: {connection.rowCount ?? 0}
          </span>
        ) : null}
      </div>
    );
  }

  if (connection.status === "failed" && connection.configured) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50/70 px-4 py-2 text-[12px] leading-4 text-amber-900 sm:px-6">
        <div className="flex min-w-0 items-start gap-2">
          <ServerOff className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="font-semibold">Could not reach Supabase.</span> Fallback: the local
            demo dataset is showing. {connection.error}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => void retryConnection()}>
          <RefreshCw className="text-ink-muted" />
          Retry
        </Button>
      </div>
    );
  }

  if (!connection.configured) {
    return (
      <div className="flex items-start gap-2 border-b border-ink-line bg-ink-wash/50 px-4 py-1.5 text-2xs leading-4 text-ink-muted sm:px-6">
        <CloudOff className="mt-0.5 size-3 shrink-0 text-ink-subtle" aria-hidden="true" />
        <span>
          <span className="font-semibold text-ink">Demo mode</span> — running on the local
          20-lead mock dataset. Set <code className="rounded bg-ink-wash px-1">VITE_SUPABASE_URL</code>{" "}
          and <code className="rounded bg-ink-wash px-1">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
          <code className="rounded bg-ink-wash px-1">.env.local</code> to load real leads.
        </span>
      </div>
    );
  }

  return null;
}