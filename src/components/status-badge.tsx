import type { LeadStatus, Role } from "@/data/types";
import { CAN_EXPORT, LEAD_STATUS_META, ROLE_EXPORT_REASON, ROLE_LABELS } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/ui/tooltip";

/** Status badge used unchanged by the table, the board and the profile sheet. */
export function StatusBadge({ status, size = "default" }: { status: LeadStatus; size?: "default" | "sm" }) {
  const meta = LEAD_STATUS_META[status];
  return (
    <Badge dotColor={meta.dot} className={meta.badge} size={size} role="status">
      {meta.label}
    </Badge>
  );
}

/** Role badge for the demo role switcher. */
export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={role === "admin" ? "cobalt" : "neutral"}>{ROLE_LABELS[role]}</Badge>;
}

/**
 * The export gating control: enabled only for admins. For agents it renders
 * disabled with a short explanation (visible on hover and in the reports view).
 */
export function ExportGate({ role }: { role: Role }) {
  const allowed = CAN_EXPORT[role];
  const reason = ROLE_EXPORT_REASON[role];

  if (allowed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Export enabled
      </span>
    );
  }

  return (
    <Hint label={reason}>
      <span className="inline-flex cursor-help items-center gap-1.5 text-[13px] text-ink-subtle">
        <span className="size-1.5 rounded-full bg-ink-subtle" aria-hidden="true" />
        Export disabled for your role
      </span>
    </Hint>
  );
}