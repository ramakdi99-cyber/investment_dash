import { useMemo, useState, type FormEvent } from "react";
import { CalendarClock, Check, Phone } from "lucide-react";
import type { FollowUpChannel, Lead } from "@/data/types";
import { useStore } from "@/state/store";
import { formatRelative } from "@/lib/format";
import { FOLLOW_UP_CHANNEL_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/table";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHANNEL_ICON: Record<FollowUpChannel, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  whatsapp: Phone,
  email: Phone,
  meeting: CalendarClock,
};

/** The follow-up timeline + scheduling form for a single lead. */
export function LeadTimeline({ lead }: { lead: Lead }) {
  const { dispatch, followUpsFor, employeeName, dataSource } = useStore();
  const [summary, setSummary] = useState("");
  const [channel, setChannel] = useState<FollowUpChannel>("whatsapp");
  const [due, setDue] = useState(() =>
    new Date(Date.now() + 24 * 3_600_000).toISOString().slice(0, 16),
  );

  const followUps = useMemo(
    () =>
      followUpsFor(lead.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [followUpsFor, lead.id],
  );

  const open = followUps.filter((item) => !item.completedAt);
  const done = followUps.filter((item) => item.completedAt).reverse();
  const overdueCount = open.filter((item) => new Date(item.dueAt).getTime() < Date.now()).length;

  const schedule = (event: FormEvent) => {
    event.preventDefault();
    const text = summary.trim();
    if (!text || !due) return;
    dispatch({
      type: "schedule-follow-up",
      leadId: lead.id,
      summary: text,
      channel,
      dueAt: new Date(due).toISOString(),
    });
    setSummary("");
  };

  // datetime-local needs local time; new Date(due) parses it as local already.
  return (
    <div className="space-y-5">
      <form onSubmit={schedule} className="space-y-2.5 rounded-lg border border-ink-line p-3.5" aria-label="Schedule follow-up">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-medium text-ink">Schedule a follow-up</Label>
          <span className="text-2xs text-ink-subtle">Task owned by you</span>
        </div>
        <Textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="What needs to happen next?"
          rows={2}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={channel} onValueChange={(value) => setChannel(value as FollowUpChannel)}>
            <SelectTrigger className="w-32" aria-label="Channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FOLLOW_UP_CHANNEL_LABELS) as FollowUpChannel[]).map((item) => (
                <SelectItem key={item} value={item}>
                  {FOLLOW_UP_CHANNEL_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="datetime-local"
            value={due}
            onChange={(event) => setDue(event.target.value)}
            className="w-52"
            aria-label="Due date and time"
          />
          <Button type="submit" size="sm" disabled={!summary.trim()}>
            Schedule
          </Button>
        </div>
      </form>

      {dataSource === "database" ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-2xs leading-4 text-amber-800">
          Session-only: follow-ups are not stored in Supabase until the{" "}
          <code>follow_ups</code> table is created (see{" "}
          <code>supabase/migrations/003_lead_follow_ups.sql</code>).
        </p>
      ) : null}

      {followUps.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarClock}
          title="No follow-ups scheduled"
          description="Schedule your first follow-up above — it will appear here and in the pipeline."
        />
      ) : (
        <div className="space-y-2.5">
          {overdueCount > 0 ? (
            <p className="text-2xs font-medium text-red-700">
              {overdueCount} overdue — address these first.
            </p>
          ) : null}
          {open.map((item) => {
            const isOverdue = new Date(item.dueAt).getTime() < Date.now();
            const Icon = CHANNEL_ICON[item.channel];
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-lg border px-3.5 py-3",
                  isOverdue ? "border-red-200 bg-red-50/60" : "border-ink-line bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
                        isOverdue ? "bg-red-100 text-red-700" : "bg-ink-wash text-ink-muted",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[13px] font-medium leading-5 text-ink">{item.summary}</p>
                      <p className="mt-0.5 text-2xs leading-4 text-ink-subtle">
                        {FOLLOW_UP_CHANNEL_LABELS[item.channel]} · {employeeName(item.ownerId)} ·{" "}
                        <span className={cn(isOverdue && "font-medium text-red-700")}>
                          {isOverdue ? `overdue · ${formatRelative(item.dueAt)}` : `due ${formatRelative(item.dueAt)}`}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: "complete-follow-up", followUpId: item.id })}
                  >
                    <Check className="text-emerald-600" />
                    Done
                  </Button>
                </div>
              </div>
            );
          })}

          {done.length > 0 ? (
            <div className="pt-2">
              <p className="label-caps pb-2">Completed</p>
              <div className="space-y-2">
                {done.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 px-1 opacity-60">
                    <Check className="size-3.5 shrink-0 text-emerald-600" />
                    <p className="line-through decoration-ink-line text-[13px] text-ink-muted">
                      {item.summary}
                    </p>
                    <span className="ml-auto shrink-0 text-2xs text-ink-subtle">
                      {item.completedAt ? formatRelative(item.completedAt) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}