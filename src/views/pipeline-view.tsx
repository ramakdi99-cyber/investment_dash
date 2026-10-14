import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, GripVertical, UserRoundX } from "lucide-react";
import type { Lead, LeadStatus } from "@/data/types";
import { useStore } from "@/state/store";
import { LEAD_STATUS_META, LEAD_STATUS_ORDER, BUDGET_BAND_BY_ID } from "@/lib/domain";
import { formatRelative } from "@/lib/format";
import { cn, initialsOf } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SkeletonKanbanColumn } from "@/components/ui/skeleton";
import { navigate } from "@/lib/router";

/**
 * Pipeline board. Six fixed columns in workflow order.
 *
 * - Drag & drop via the native HTML5 DnD API (no dependency): grab a card and
 *   drop it on a column.
 * - Keyboard: focus a card with Tab, then move it with ←/→ (also announces
 *   the move to screen readers).
 * - Every card opens the profile sheet with one click.
 */
export function PipelineView() {
  const { state, setLeadStatus, employeeName } = useStore();
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStatus | null>(null);
  const dragCounter = useRef<Map<string, number>>(new Map());

  const columns = useMemo(() => {
    return LEAD_STATUS_ORDER.map((status) => ({
      status,
      leads: state.leads.filter((lead) => lead.status === status),
    }));
  }, [state.leads]);

  const moveLead = (leadId: string, to: LeadStatus) => {
    const lead = state.leads.find((item) => item.id === leadId);
    if (!lead || lead.status === to) return;
    // In database mode this persists to Supabase first and only updates the
    // board after the write succeeds (failures become error toasts).
    void setLeadStatus(leadId, to);
    if (dragLeadId) setDragLeadId(null);
    setDropTarget(null);
  };

  const openLead = (leadId: string) => {
    // The profile sheet lives on the leads view, so crossing over keeps the
    // same filters and opens the record.
    navigate("leads", { lead: leadId });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sales workflow"
        title="Pipeline"
        description="Drag a lead to change its stage — counts update instantly."
      />

      {state.loadState === "loading" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUS_ORDER.map((status) => (
            <SkeletonKanbanColumn key={status} cards={status === "new" ? 3 : 2} />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Pipeline stages">
          {columns.map((column) => {
            const meta = LEAD_STATUS_META[column.status];
            const isOver = dropTarget === column.status;
            const isDragging = dragLeadId !== null;

            return (
              <section
                key={column.status}
                aria-label={`${meta.label} — ${column.leads.length}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (isDragging) setDropTarget(column.status);
                }}
                onDragLeave={() => {
                  const map = dragCounter.current;
                  map.set(column.status, (map.get(column.status) ?? 0) + 1);
                  // dragleave fires as the pointer crosses child elements; only
                  // clear the highlight once every leave has been "paid back".
                  window.setTimeout(() => {
                    map.set(column.status, Math.max(0, (map.get(column.status) ?? 1) - 1));
                    if ((map.get(column.status) ?? 0) === 0) {
                      setDropTarget((current) => (current === column.status ? null : current));
                    }
                  }, 80);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const leadId = event.dataTransfer.getData("text/lead-id");
                  if (leadId) moveLead(leadId, column.status);
                  dragCounter.current.clear();
                }}
                className={cn(
                  "flex w-[288px] shrink-0 flex-col rounded-xl border bg-ink-wash/50 transition-colors",
                  isOver ? "border-cobalt/50 bg-cobalt-soft/30" : "border-ink-line",
                )}
              >
                <header className="flex items-center justify-between px-3.5 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full ring-4 ring-white"
                      style={{ backgroundColor: meta.dot }}
                      aria-hidden="true"
                    />
                    <h2 className="text-[13px] font-semibold text-ink">{meta.label}</h2>
                  </div>
                  <span
                    className="tabular rounded-full px-2 py-0.5 text-2xs font-semibold"
                    style={{
                      backgroundColor: `${meta.dot}14`,
                      color: meta.dot,
                    }}
                  >
                    {column.leads.length}
                  </span>
                </header>
                <p className="px-3.5 pb-2 text-2xs leading-4 text-ink-subtle">{meta.description}</p>

                <div className="min-h-[260px] flex-1 overflow-y-auto px-2.5 pb-2.5">
                  {column.leads.length === 0 ? (
                    <div
                      className={cn(
                        "mt-1 flex h-full min-h-[8rem] items-center justify-center rounded-lg border border-dashed text-center",
                        isOver ? "border-cobalt/40" : "border-ink-line",
                      )}
                    >
                      <p className="px-4 text-2xs leading-4 text-ink-subtle">
                        {isOver ? "Drop to move here" : "Nothing here yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {column.leads.map((lead) => (
                        <KanbanCard
                          key={lead.id}
                          lead={lead}
                          isDragging={dragLeadId === lead.id}
                          onDragStart={(event) => {
                            setDragLeadId(lead.id);
                            event.dataTransfer.setData("text/lead-id", lead.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDragLeadId(null);
                            setDropTarget(null);
                            dragCounter.current.clear();
                          }}
                          onOpen={() => openLead(lead.id)}
                          onMove={(direction) => {
                            const current = LEAD_STATUS_ORDER.indexOf(lead.status);
                            const next = direction === "next" ? current + 1 : current - 1;
                            if (next >= 0 && next < LEAD_STATUS_ORDER.length) {
                              moveLead(lead.id, LEAD_STATUS_ORDER[next]);
                            }
                          }}
                          assigneeName={employeeName(lead.assignedEmployeeId)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-2 text-2xs text-ink-subtle">
        <ArrowLeft className="size-3" aria-hidden="true" />
        Keyboard: focus a card, then press ← → to move it between stages.
        <ArrowRight className="size-3" aria-hidden="true" />
      </p>
    </div>
  );
}

function KanbanCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onMove,
  assigneeName,
}: {
  lead: Lead;
  isDragging: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (direction: "prev" | "next") => void;
  assigneeName: string;
}) {
  const meta = LEAD_STATUS_META[lead.status];
  const budget = lead.budgetBand ? BUDGET_BAND_BY_ID[lead.budgetBand].short : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn("group", isDragging && "opacity-40")}
    >
      <button
        type="button"
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onMove("next");
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            onMove("prev");
          }
        }}
        aria-describedby={`hint-${lead.id}`}
        className={cn(
          "block w-full rounded-lg border border-ink-line bg-white p-3.5 text-left shadow-card transition-all",
          "hover:border-ink-line hover:shadow-raised focus-visible:shadow-focus",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 text-ink">
              {lead.investorName ?? "Unnamed investor"}
            </p>
            <p className="tabular truncate text-2xs leading-4 text-ink-subtle">
              {budget ? `${budget} / mo` : "Budget not stated"}
            </p>
          </div>
          <GripVertical
            className="size-3.5 shrink-0 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-70"
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {assigneeName ? (
              <Avatar className="size-5 shrink-0">
                <AvatarFallback className="bg-ink text-[8px]">{initialsOf(assigneeName)}</AvatarFallback>
              </Avatar>
            ) : (
              <UserRoundX className="size-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
            )}
            <span className="truncate text-2xs leading-4 text-ink-muted">
              {assigneeName || "Unassigned"}
            </span>
          </span>
          <span className="tabular shrink-0 text-2xs leading-4 text-ink-subtle">
            {lead.lastContactAt ? formatRelative(lead.lastContactAt) : "New"}
          </span>
        </div>
      </button>
      <span id={`hint-${lead.id}`} className="sr-only">
        {meta.label}. Press left or right arrow to move between stages.
      </span>
    </div>
  );
}