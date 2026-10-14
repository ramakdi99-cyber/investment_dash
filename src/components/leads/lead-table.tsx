import { useMemo } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronsUpDown,
  FilterX,
  Inbox,
  Search,
  UserRoundX,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/data/types";
import { useStore } from "@/state/store";
import { useQueryParams } from "@/lib/router";
import { sortLeads, type LeadSort } from "@/lib/filters";
import { BUDGET_BAND_BY_ID, GOAL_LABELS, LEAD_STATUS_META } from "@/lib/domain";
import { formatRelative, NOT_PROVIDED, truncate } from "@/lib/format";
import { cn, initialsOf } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Hint } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
} from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

const SORTABLE_COLUMNS: { key: LeadSort; label: string; className?: string }[] = [
  { key: "investor", label: "Investor" },
  { key: "firstMessage", label: "First message", className: "hidden md:table-cell" },
  { key: "goal", label: "Goal", className: "hidden lg:table-cell" },
  { key: "budget", label: "Monthly budget", className: "hidden lg:table-cell" },
  { key: "status", label: "Status" },
  { key: "assignee", label: "Assigned", className: "hidden sm:table-cell" },
  { key: "lastContact", label: "Last contact", className: "hidden sm:table-cell" },
];

export function LeadTable({
  leads,
  selected,
  onToggleSelect,
  onSelectAll,
  onOpen,
}: {
  leads: Lead[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onOpen: (lead: Lead) => void;
}) {
  const { employeeName } = useStore();
  const { read, write } = useQueryParams();

  const sortKey = (read("sort") as LeadSort | null) ?? "lastContact";
  const sortDir = read("dir") === "asc" ? "asc" : "desc";

  const sorted = useMemo(
    () => sortLeads(leads, { key: sortKey, direction: sortDir }, employeeName),
    [leads, sortKey, sortDir, employeeName],
  );

  const allVisibleSelected =
    sorted.length > 0 && sorted.every((lead) => selected.has(lead.id));
  const someVisibleSelected =
    sorted.some((lead) => selected.has(lead.id)) && !allVisibleSelected;

  const toggleSort = (key: LeadSort) => {
    const nextDir =
      key === sortKey ? (sortDir === "desc" ? "asc" : "desc") : "desc";
    write({ sort: key !== "lastContact" || nextDir === "desc" ? key : null, dir: nextDir === "desc" && key === "lastContact" ? null : nextDir, lead: null });
  };

  if (leads.length === 0) {
    return null;
  }

  return (
    <Table aria-label="Leads">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-12 px-4">
            <Checkbox
              checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
              onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
              aria-label={allVisibleSelected ? "Deselect all leads" : "Select all leads"}
            />
          </TableHead>
          {SORTABLE_COLUMNS.map((column) => {
            const active = sortKey === column.key;
            return (
              <TableHead key={column.key} className={column.className}>
                <SortButton
                  label={column.label}
                  active={active}
                  direction={active ? sortDir : null}
                  onClick={() => toggleSort(column.key)}
                />
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((lead) => {
          const isSelected = selected.has(lead.id);
          return (
            <TableRow
              key={lead.id}
              data-state={isSelected ? "selected" : undefined}
              className="group cursor-pointer"
              onClick={() => onOpen(lead)}
            >
              <TableCell className="w-12" onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(lead.id)}
                  aria-label={`Select ${lead.investorName ?? lead.contactId}`}
                />
              </TableCell>

              <TableCell>
                <InvestorCell lead={lead} />
              </TableCell>

              <TableCell className="hidden max-w-[260px] md:table-cell">
                <Hint label={<span className="block max-w-sm whitespace-normal">{lead.firstMessage}</span>}>
                  <p className="cursor-help truncate text-ink-muted" tabIndex={0}>
                    {truncate(lead.firstMessage, 64)}
                  </p>
                </Hint>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <span className={cn(!lead.goal && "text-ink-subtle")}>
                  {GOAL_LABELS[lead.goal]}
                </span>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                {lead.budgetBand ? (
                  <span className="tabular whitespace-nowrap font-medium text-ink">
                    {BUDGET_BAND_BY_ID[lead.budgetBand].short}
                    <span className="ml-1 font-normal text-ink-subtle">/mo</span>
                  </span>
                ) : (
                  <span className="text-ink-subtle">Not provided</span>
                )}
              </TableCell>

              <TableCell>
                <StatusBadge status={lead.status} />
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <AssigneeCell employeeId={lead.assignedEmployeeId} />
              </TableCell>

              <TableCell className="hidden whitespace-nowrap sm:table-cell">
                <span className="tabular text-ink-muted">
                  {lead.lastContactAt ? formatRelative(lead.lastContactAt) : NOT_PROVIDED}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc" | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.08em] transition-colors",
        active ? "text-cobalt" : "text-ink-subtle hover:text-ink",
      )}
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  );
}

function InvestorCell({ lead }: { lead: Lead }) {
  const name = lead.investorName;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="size-8 border border-ink-line">
        <AvatarFallback className={cn("bg-ink-wash text-xs", !name && "bg-transparent")}>
          {name ? initialsOf(name) : <UserRoundX className="size-3.5 text-ink-subtle" />}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className={cn("truncate text-[13px] font-medium", name ? "text-ink" : "text-ink-subtle")}>
          {name ?? NOT_PROVIDED}
        </p>
        <p className="tabular truncate text-2xs text-ink-subtle">
          {lead.whatsapp ?? lead.contactId}
        </p>
      </div>
    </div>
  );
}

function AssigneeCell({ employeeId }: { employeeId: string | null }) {
  const { employeeName } = useStore();
  const name = employeeName(employeeId);
  if (!name || name === "Unknown") {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-subtle">
        <ChevronsUpDown className="size-3.5" aria-hidden="true" />
        Not provided
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar className="size-6">
        <AvatarFallback className="bg-ink text-[9px]">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <span className="tabular whitespace-nowrap text-[13px] text-ink">{name}</span>
    </span>
  );
}

/** Bulk-actions bar that appears once rows are selected. */
export function SelectionBar({
  count,
  onClear,
  onAssign,
  onSetStatus,
  loading = false,
}: {
  count: number;
  onClear: () => void;
  onAssign: (employeeId: string) => void;
  onSetStatus: (status: LeadStatus) => void;
  loading?: boolean;
}) {
  const { state } = useStore();
  if (count === 0) return null;

  return (
    <div
      className="sticky top-[64px] z-10 mx-1 -my-1 flex animate-fade-in-up flex-wrap items-center justify-between gap-3 rounded-lg border border-cobalt/20 bg-cobalt-soft/70 px-3 py-2 backdrop-blur"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <p className="text-[13px] font-medium text-cobalt">
        {count} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" disabled={loading}>
              Assign to…
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Assign to employee</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {state.employees.map((employee) => (
              <DropdownMenuItem key={employee.id} onSelect={() => onAssign(employee.id)}>
                <Avatar className="size-5">
                  <AvatarFallback className="bg-ink text-[8px]">{initialsOf(employee.name)}</AvatarFallback>
                </Avatar>
                {employee.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              Set status…
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value=""
              onValueChange={(status) => onSetStatus(status as LeadStatus)}
            >
              {(Object.keys(LEAD_STATUS_META) as LeadStatus[]).map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  <span
                    className="mr-1.5 size-1.5 rounded-full"
                    style={{ backgroundColor: LEAD_STATUS_META[status].dot }}
                    aria-hidden="true"
                  />
                  {LEAD_STATUS_META[status].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={onClear} disabled={loading}>
          <FilterX className="text-ink-subtle" />
          Clear
        </Button>
      </div>
    </div>
  );
}

export function LeadsTableSkeleton() {
  return <SkeletonRows rows={8} />;
}

export function LeadsEmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <EmptyState
      icon={hasFilters ? Search : Inbox}
      title={hasFilters ? "No leads match these filters" : "No leads yet"}
      description={
        hasFilters
          ? "Try widening the date range or removing a filter or two."
          : "Leads from WhatsApp and the campaigns will appear here."
      }
      action={
        hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear all filters
          </Button>
        ) : undefined
      }
    />
  );
}