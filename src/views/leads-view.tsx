import { useEffect, useMemo, useState } from "react";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";
import type { Lead, LeadStatus } from "@/data/types";
import { useStore } from "@/state/store";
import { useUrlFilters } from "@/lib/url-filters";
import { useQueryParams } from "@/lib/router";
import { applyFilters } from "@/lib/filters";
import { CAN_EXPORT, ROLE_EXPORT_REASON } from "@/lib/domain";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hint, TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import {
  LeadTable,
  LeadsTableSkeleton,
  LeadsEmptyState,
  SelectionBar,
} from "@/components/leads/lead-table";
import { LeadSheet } from "@/components/leads/lead-sheet";
import { navigate } from "@/lib/router";

const PAGE_SIZE = 25;

export function LeadsView() {
  const { state, leadById, setLeadStatus, assignLead } = useStore();
  const { filters, set, clearAll, hasActive } = useUrlFilters();
  const { read, write } = useQueryParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => applyFilters(state.leads, filters),
    [state.leads, filters],
  );

  // Selections are scoped to the current result set; changing filters clears them.
  const filterSignature = useMemo(
    () => JSON.stringify(filters),
    [filters],
  );
  useEffect(() => {
    setSelected(new Set());
    setPage(0);
  }, [filterSignature]);

  const openLeadId = read("lead");
  const openLead = useMemo(
    () => (openLeadId ? leadById(openLeadId) ?? null : null),
    [openLeadId, leadById],
  );

  const openSheet = (lead: Lead) => write({ lead: lead.id });
  const closeSheet = () => write({ lead: null });

  const toggleSelect = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAllVisible = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((lead) => lead.id)) : new Set());
  };

  // Bulk helpers persist each row when in database mode and clear toasts on
  // failures; the selection is cleared once every write has settled.
  const bulkAssign = async (employeeId: string) => {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => assignLead(id, employeeId)));
    setSelected(new Set());
  };

  const bulkStatus = async (status: LeadStatus) => {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => setLeadStatus(id, status)));
    setSelected(new Set());
  };

  // Simple client-side pagination for long result sets (demo dataset has 20
  // rows, so the footer only appears once the database returns more).
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, pageCount - 1);
  const pageLeads = useMemo(
    () => filtered.slice(activePage * PAGE_SIZE, activePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, activePage],
  );
  const showingFrom = filtered.length === 0 ? 0 : activePage * PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, (activePage + 1) * PAGE_SIZE);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Lead inbox"
          title="Leads"
          description={
            hasActive
              ? `${formatNumber(filtered.length)} of ${formatNumber(state.leads.length)} leads match your filters.`
              : `${formatNumber(state.leads.length)} leads across ${formatNumber(state.campaigns.length)} campaigns.`
          }
          actions={
            <Hint label={`Export allows ${CAN_EXPORT[state.role] ? "" : "only admins — "}${ROLE_EXPORT_REASON[state.role]}`}>
              <Button variant="outline" disabled={!CAN_EXPORT[state.role]} onClick={() => navigate("reports", {})}>
                <Download className="text-ink-subtle" />
                Export CSV
              </Button>
            </Hint>
          }
        />

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <Input
              value={filters.q}
              onChange={(event) => set("q", event.target.value)}
              placeholder="Search by name, number or first message…"
              className="h-10 pl-9 pr-8"
              aria-label="Search leads"
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() => set("q", null)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-subtle transition-colors hover:bg-ink-wash hover:text-ink"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <FilterBar />
            <button
              type="button"
              onClick={() => navigate("reports", {})}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-ink-muted transition-colors hover:bg-ink-wash hover:text-ink"
            >
              <SlidersHorizontal className="size-3.5" />
              Advanced reports
            </button>
          </div>
        </div>

        {state.loadState === "loading" ? (
          <Card className="overflow-hidden">
            <LeadsTableSkeleton />
          </Card>
        ) : state.leads.length === 0 ? (
          <Card>
            <LeadsEmptyState hasFilters={false} onClear={clearAll} />
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <LeadsEmptyState hasFilters={hasActive} onClear={clearAll} />
          </Card>
        ) : (
          <div className="space-y-3">
            <SelectionBar
              count={selected.size}
              onClear={() => setSelected(new Set())}
              onAssign={bulkAssign}
              onSetStatus={bulkStatus}
            />
            <Card className="overflow-hidden">
              <LeadTable
                leads={pageLeads}
                selected={selected}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAllVisible}
                onOpen={openSheet}
              />
            </Card>
            {filtered.length > PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[13px] text-ink-muted">
                <p className="tabular">
                  Showing {formatNumber(showingFrom)}–{formatNumber(showingTo)} of{" "}
                  {formatNumber(filtered.length)} leads
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activePage === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="px-1 tabular text-2xs" aria-label={`Page ${activePage + 1} of ${pageCount}`}>
                    {activePage + 1} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activePage >= pageCount - 1}
                    onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <LeadSheet lead={openLead} open={Boolean(openLead)} onClose={closeSheet} />
      </div>
    </TooltipProvider>
  );
}