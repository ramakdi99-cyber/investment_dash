import { useMemo, useState } from "react";
import { Download, FileCheck2, FileDown, ShieldCheck, ShieldOff, UserRound } from "lucide-react";
import type { Lead } from "@/data/types";
import { useStore } from "@/state/store";
import { useUrlFilters } from "@/lib/url-filters";
import { applyFilters } from "@/lib/filters";
import { GOAL_LABELS, LEAD_STATUS_META, ROLE_EXPORT_REASON } from "@/lib/domain";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/checkbox";
import { Hint, TooltipProvider } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/table";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { Input } from "@/components/ui/input";

/**
 * Search & reports: the same filter set as the lead list, applied together,
 * mirrored in the URL, plus a single aggregate table and an export action.
 *
 * Export is permission-gated: admins may download the full (filtered) dataset
 * as CSV; agents see the button disabled with a short explanation. The demo
 * role switch in the header flips between the two and re-evaluates the gate.
 */
export function ReportsView() {
  const { state, dispatch, employeeName, campaignName } = useStore();
  const { filters, set, hasActive, clearAll, activeCount } = useUrlFilters();
  const [exported, setExported] = useState(false);
  const isAdmin = state.role === "admin";

  const filtered = useMemo(
    () => applyFilters(state.leads, filters),
    [state.leads, filters],
  );

  const handleExport = () => {
    if (!isAdmin) return;
    const csv = buildCsv(filtered, { employeeName, campaignName });
    downloadCsv(`cobalt-crm-leads-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setExported(true);
    window.setTimeout(() => setExported(false), 2600);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Search & reports"
          title="Search & reports"
          description="Every filter is applied together and shared through the URL — send someone the link and they will see the same result set."
          actions={
            <div className="flex items-center gap-3">
              <RoleToggle
                role={state.role}
                onChange={(role) => dispatch({ type: "set-role", role })}
              />
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Filter the dataset</CardTitle>
            <CardDescription>
              Status, campaign, goal, budget, assignee and date range combine
              with the free-text search below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={filters.q}
              onChange={(event) => set("q", event.target.value)}
              placeholder="Free-text search across name, contact and first message…"
              className="max-w-xl"
              aria-label="Search in reports"
            />
            <FilterBar className="border-t border-ink-line pt-4" />
          </CardContent>
        </Card>

        {/* Result summary + export */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-wash/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="tabular text-[15px] font-semibold text-ink">
              {formatNumber(filtered.length)}
            </span>
            <p className="text-[13px] text-ink-muted">
              of {formatNumber(state.leads.length)} leads
              {hasActive ? ` · ${activeCount} filter${activeCount === 1 ? "" : "s"} active` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActive ? (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            ) : null}
            <Hint label={ROLE_EXPORT_REASON[state.role]}>
              <Button
                variant={isAdmin ? "primary" : "outline"}
                size="sm"
                disabled={!isAdmin}
                onClick={handleExport}
                aria-disabled={!isAdmin}
              >
                <Download className={cn(!isAdmin && "text-ink-subtle")} />
                Export CSV
                {exported ? <FileCheck2 className="text-emerald-400" /> : null}
              </Button>
            </Hint>
          </div>
        </div>

        {!isAdmin ? (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-[13px] leading-5 text-amber-900">
            <ShieldOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Export is locked for {state.role === "agent" ? "Sales agents" : "this role"}. Switch to the
            Administrator role (top right) to preview the permission-gated export.
          </p>
        ) : null}
        <p className="flex items-start gap-2 text-2xs leading-4 text-ink-subtle">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          The role switch above is a UI demo of the export permission — it is not a security
          boundary. Real authorization is enforced by Supabase Row Level Security policies
          (see <code>supabase/migrations/004_rls_demo_readonly.sql</code>), and CSV exports
          never include ids, ad ids or internal columns.
        </p>

        {/* Result columns */}
        {state.loadState === "loading" ? (
          <Card className="overflow-hidden">
            <ReportSkeleton />
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileDown}
              title="No rows to export"
              description={
                hasActive
                  ? "Loosen the filters to bring rows back, or clear them all."
                  : "There are no leads in the system yet."
              }
              action={
                hasActive ? (
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear all filters
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <Card>
            <ReportTable leads={filtered} employeeName={employeeName} campaignName={campaignName} />
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

function RoleToggle({ role, onChange }: { role: "admin" | "agent"; onChange: (role: "admin" | "agent") => void }) {
  const isAdmin = role === "admin";
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-ink-line bg-white px-3 py-2">
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
        {isAdmin ? (
          <ShieldCheck className="size-4 text-cobalt" aria-hidden="true" />
        ) : (
          <UserRound className="size-4 text-ink-subtle" aria-hidden="true" />
        )}
        Demo role
      </span>
      <Switch
        checked={isAdmin}
        onCheckedChange={(next) => onChange(next ? "admin" : "agent")}
        aria-label="Toggle demo role between Administrator and Sales agent"
      />
      <Badge variant={isAdmin ? "cobalt" : "neutral"}>{isAdmin ? "Administrator" : "Agent"}</Badge>
    </div>
  );
}

function ReportTable({
  leads,
  employeeName,
  campaignName,
}: {
  leads: Lead[];
  employeeName: (id: string | null) => string;
  campaignName: (id: string | null) => string;
}) {
  return (
    <CardContent className="px-0">
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-left text-[13px]" aria-label="Filtered lead results">
          <thead className="sticky top-0 bg-white shadow-[0_1px_0_#E7E8EC]">
            <tr>
              <th className="px-5 py-2.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">Lead</th>
              <th className="hidden px-4 py-2.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle md:table-cell">Campaign</th>
              <th className="hidden px-4 py-2.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle lg:table-cell">Goal</th>
              <th className="px-4 py-2.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">Status</th>
              <th className="hidden px-4 py-2.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle sm:table-cell">Assignee</th>
              <th className="px-5 py-2.5 text-right text-2xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-line">
            {leads.map((lead) => {
              return (
                <tr key={lead.id}>
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-ink">{lead.investorName ?? "Unnamed investor"}</p>
                    <p className="tabular text-2xs text-ink-subtle">{lead.whatsapp ?? lead.contactId}</p>
                  </td>
                  <td className="hidden px-4 py-2.5 text-ink-muted md:table-cell">
                    {lead.campaignRawName || (lead.campaignId ? campaignName(lead.campaignId) : "") || "Not provided"}
                  </td>
                  <td className="hidden px-4 py-2.5 text-ink-muted lg:table-cell">{GOAL_LABELS[lead.goal]}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      dotColor={LEAD_STATUS_META[lead.status].dot}
                      className={LEAD_STATUS_META[lead.status].badge}
                      size="sm"
                    >
                      {LEAD_STATUS_META[lead.status].label}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-2.5 text-ink sm:table-cell">
                    {employeeName(lead.assignedEmployeeId) || "Not provided"}
                  </td>
                  <td className="px-5 py-2.5 text-right text-xs text-ink-muted">
                    {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardContent>
  );
}

function ReportSkeleton() {
  return (
    <div className="divide-y divide-ink-line" role="status" aria-label="Loading results">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-6 px-5 py-3.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="hidden h-3.5 w-32 md:block" />
          <Skeleton className="ml-auto h-5 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}