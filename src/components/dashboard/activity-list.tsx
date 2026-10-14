import { useMemo } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCheck,
  MessageCircle,
  StickyNote,
  UserPlus,
  Zap,
} from "lucide-react";
import type { ActivityKind } from "@/data/types";
import { useStore } from "@/state/store";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import { EmptyState, Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAD_STATUS_META } from "@/lib/domain";
import { navigate } from "@/lib/router";

const KIND_META: Record<ActivityKind, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  "lead-created": { icon: Zap, tone: "bg-cobalt-soft text-cobalt" },
  "status-changed": { icon: ArrowRight, tone: "bg-ink-wash text-ink" },
  assigned: { icon: UserPlus, tone: "bg-ink-wash text-ink" },
  "note-added": { icon: StickyNote, tone: "bg-amber-50 text-amber-700" },
  "follow-up-scheduled": { icon: CalendarCheck, tone: "bg-ink-wash text-ink" },
  "follow-up-completed": { icon: CheckCheck, tone: "bg-emerald-50 text-emerald-700" },
  message: { icon: MessageCircle, tone: "bg-ink-wash text-ink" },
};

export function ActivityList({ limit = 8 }: { limit?: number }) {
  const { state, employeeName, leadById } = useStore();

  const events = useMemo(() => state.activity.slice(0, limit), [state.activity, limit]);

  if (state.leads.length === 0) {
    return <EmptyState title="No activity yet" description="Actions you take on leads will show up here." />;
  }

  return (
    <Table aria-label="Recent activity">
      <TableBody>
        {events.map((event) => {
          const meta = KIND_META[event.kind];
          const lead = event.leadId ? leadById(event.leadId) : undefined;
          const Icon = meta.icon;
          return (
            <TableRow key={event.id} className="hover:bg-transparent">
              <TableCell className="w-10 py-3 pl-2">
                <span className={cn("flex size-7 items-center justify-center rounded-md", meta.tone)}>
                  <Icon className="size-3.5" />
                </span>
              </TableCell>
              <TableCell className="max-w-0 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] leading-5 text-ink">
                    {event.summary}
                    {lead ? (
                      <button
                        type="button"
                        onClick={() => navigate("leads", { lead: lead.id }, { replace: true })}
                        className="ml-1 inline font-medium text-cobalt underline-offset-2 hover:underline"
                      >
                        {lead.investorName ?? lead.contactId}
                      </button>
                    ) : null}
                  </p>
                  <p className="text-2xs leading-4 text-ink-subtle">
                    {event.actorId ? employeeName(event.actorId) : "System"} · {formatRelative(event.at)}
                  </p>
                </div>
              </TableCell>
              {lead ? (
                <TableCell className="hidden py-3 pr-4 text-right sm:table-cell">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium",
                      LEAD_STATUS_META[lead.status].badge,
                    )}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: LEAD_STATUS_META[lead.status].dot }}
                      aria-hidden="true"
                    />
                    {LEAD_STATUS_META[lead.status].label}
                  </span>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function ActivityListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-ink-line px-2 py-1" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-7 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-2.5 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}