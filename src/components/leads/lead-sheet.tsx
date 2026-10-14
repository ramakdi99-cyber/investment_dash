import { useMemo } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  MessageCircle,
  MessagesSquare,
  Paperclip,
  UserRound,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/data/types";
import { useStore } from "@/state/store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { CHANNEL_LABELS, GOAL_LABELS, LEAD_STATUS_META, LEAD_STATUS_ORDER } from "@/lib/domain";
import { formatCurrency, formatDate, formatRelative } from "@/lib/format";
import { initialsOf } from "@/lib/utils";
import { LeadChat } from "@/components/leads/lead-chat";
import { LeadQualification } from "@/components/leads/lead-qualification";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadTimeline } from "@/components/leads/lead-timeline";

/**
 * The full record view. A wide right-hand sheet with four tabs:
 * conversation, qualification, internal notes and the follow-up timeline.
 * Status and assignee are editable from the header so the pipeline move is
 * one click away.
 */
export function LeadSheet({ lead, open, onClose }: { lead: Lead | null; open: boolean; onClose: () => void }) {
  const { state, employeeName, campaignNameOfLead, followUpsFor, setLeadStatus, assignLead } = useStore();

  const openFollowUps = useMemo(
    () => (lead ? followUpsFor(lead.id).filter((item) => !item.completedAt).length : 0),
    [lead, followUpsFor],
  );
  const notesForLead = useMemo(
    () => (lead ? state.notes.filter((note) => note.leadId === lead.id).length : 0),
    [lead, state.notes],
  );
  const messagesForLead = useMemo(
    () => (lead ? state.messages.filter((message) => message.leadId === lead.id).length : 0),
    [lead, state.messages],
  );

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="right" className="w-full max-w-[640px] p-0 sm:max-w-[720px]">
        {lead ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              <SheetHeader className="border-b border-ink-line px-6 pb-4 pt-5">
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-11 border border-ink-line">
                      <AvatarFallback className="bg-ink text-sm">
                        {initialsOf(lead.investorName ?? lead.contactId)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <SheetTitle className="truncate">
                        {lead.investorName ?? "Unnamed investor"}
                      </SheetTitle>
                      <SheetDescription className="tabular mt-0.5">
                        {lead.whatsapp ?? `ID ${lead.contactId}`} ·{" "}
                        {CHANNEL_LABELS[lead.source]} click-to-chat
                      </SheetDescription>
                    </div>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>

                {/* Quick actions: status + assignee without leaving the sheet */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <fieldset>
                    <legend className="label-caps mb-1">Status</legend>
                    <StatusSelect
                      value={lead.status}
                      onChange={(status) => void setLeadStatus(lead.id, status)}
                    />
                  </fieldset>
                  <fieldset>
                    <legend className="label-caps mb-1">Assigned to</legend>
                    <AssigneeSelect
                      value={lead.assignedEmployeeId}
                      onAssign={(employeeId) =>
                        void assignLead(lead.id, employeeId === "unassigned" ? null : employeeId)
                      }
                    />
                  </fieldset>
                </div>
              </SheetHeader>

              {/* Record facts */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-ink-line bg-ink-wash/40 px-6 py-4 sm:grid-cols-4">
                <Fact icon={Paperclip} label="Source campaign" value={campaignNameOfLead(lead) || "Not provided"} />
                <Fact icon={BadgeCheck} label="Investment goal" value={GOAL_LABELS[lead.goal]} />
                <Fact
                  icon={Paperclip}
                  label="Monthly budget"
                  value={lead.budgetBand ? formatCurrency(lead.statedMonthlyInterest) ?? "—" : "Not provided"}
                />
                <Fact icon={CalendarDays} label="Created" value={formatDate(lead.createdAt)} />
                <Fact icon={MessageCircle} label="Last contact" value={lead.lastContactAt ? formatRelative(lead.lastContactAt) : "Not contacted"} />
                <Fact icon={Clock3} label="Status since" value={formatDate(lead.lastContactAt ?? lead.createdAt)} />
                <Fact icon={UserRound} label="Assignee" value={employeeName(lead.assignedEmployeeId) || "Not provided"} />
                <Fact icon={MessagesSquare} label="Contact ID" value={lead.contactId} />
              </div>

              {/* Tabs */}
              <Tabs defaultValue="conversation" className="flex min-h-0 flex-1 flex-col px-6 pt-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="conversation">
                    Conversation{" "}
                    <span className="rounded-full bg-ink-wash px-1.5 text-2xs font-semibold text-ink-muted">
                      {messagesForLead}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="qualification">Qualification</TabsTrigger>
                  <TabsTrigger value="notes">
                    Notes
                    <span className="rounded-full bg-ink-wash px-1.5 text-2xs font-semibold text-ink-muted">
                      {notesForLead}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    Follow-ups
                    <span
                      className={
                        openFollowUps > 0
                          ? "rounded-full bg-cobalt px-1.5 text-2xs font-semibold text-white"
                          : "rounded-full bg-ink-wash px-1.5 text-2xs font-semibold text-ink-muted"
                      }
                    >
                      {openFollowUps}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <div className="min-h-0 flex-1 overflow-y-auto pb-6 pt-4">
                  <TabsContent value="conversation" className="mt-0 h-full">
                    <LeadChat lead={lead} />
                  </TabsContent>
                  <TabsContent value="qualification" className="mt-0">
                    <LeadQualification answers={lead.qualification} />
                  </TabsContent>
                  <TabsContent value="notes" className="mt-0">
                    <LeadNotes lead={lead} />
                  </TabsContent>
                  <TabsContent value="timeline" className="mt-0">
                    <LeadTimeline lead={lead} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        ) : (
          <SheetHeader className="px-6 py-5" />
        )}
      </SheetContent>
    </Sheet>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.06em] text-ink-subtle">
        <Icon className="size-3" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-medium text-ink">{value}</p>
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: LeadStatus; onChange: (status: LeadStatus) => void }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as LeadStatus)}>
      <SelectTrigger className="h-8 min-w-[150px]" aria-label="Change status">
        <span className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: LEAD_STATUS_META[value].dot }}
            aria-hidden="true"
          />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUS_ORDER.map((status) => (
          <SelectItem key={status} value={status}>
            <span className="flex items-center gap-2">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: LEAD_STATUS_META[status].dot }}
                aria-hidden="true"
              />
              {LEAD_STATUS_META[status].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AssigneeSelect({ value, onAssign }: { value: string | null; onAssign: (employeeId: string) => void }) {
  const { state } = useStore();
  return (
    <Select value={value ?? "unassigned"} onValueChange={(next) => onAssign(next)}>
      <SelectTrigger className="h-8 min-w-[180px]" aria-label="Reassign lead">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <span className="text-ink-subtle">Unassigned</span>
        </SelectItem>
        {state.employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            <span className="flex items-center gap-2">
              <Avatar className="size-4">
                <AvatarFallback className="bg-ink text-[7px]">{initialsOf(employee.name)}</AvatarFallback>
              </Avatar>
              {employee.name}
              <Badge variant="outline" size="sm" className="ml-1">
                {employee.jobTitle.replace("Sales ", "")}
              </Badge>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}