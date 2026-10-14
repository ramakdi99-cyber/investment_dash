import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useStore, type Toast } from "@/state/store";
import { cn } from "@/lib/utils";

const TONE_META: Record<
  Toast["tone"],
  { icon: React.ComponentType<{ className?: string }>; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: "border-emerald-200", iconColor: "text-emerald-500" },
  error: { icon: AlertCircle, ring: "border-red-200", iconColor: "text-red-500" },
  info: { icon: Info, ring: "border-ink-line", iconColor: "text-cobalt" },
};

/**
 * Non-blocking notification stack, bottom-right on desktop and centred at the
 * bottom on mobile. Announcements are polite (they never steal focus).
 */
export function Toaster() {
  const { toasts, dismissToast } = useStore();

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 px-4 pb-4 sm:items-end sm:px-6 sm:pb-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const meta = TONE_META[toast.tone];
  const Icon = meta.icon;

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm animate-fade-in-up items-start gap-2.5 rounded-lg border bg-white p-3.5 shadow-raised",
        meta.ring,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-5 text-ink">{toast.title}</p>
        {toast.detail ? (
          <p className="mt-0.5 text-[12px] leading-4 text-ink-muted">{toast.detail}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-1 text-ink-subtle transition-colors hover:bg-ink-wash hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}