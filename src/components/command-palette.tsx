import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import {
  ArrowRight,
  BarChart3,
  Download,
  FileDown,
  Inbox,
  Kanban,
  LayoutGrid,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { navigate } from "@/lib/router";
import { useStore } from "@/state/store";
import { LEAD_STATUS_META } from "@/lib/domain";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Global ⌘K palette. Three groups:
 *  1. Navigate — jump between the four workspace areas.
 *  2. Actions — the same actions the reports view offers: export (gated) and
 *     the demo role switch (role affects whether export is enabled).
 *  3. Recent leads — the five most recently touched records, opening the
 *     profile sheet directly.
 */
export function CommandPalette() {
  const { state, dispatch, isAdmin } = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const leadOptions = useMemo(() => {
    return [...state.leads]
      .sort((a, b) => (b.lastContactAt ?? b.createdAt).localeCompare(a.lastContactAt ?? a.createdAt))
      .slice(0, 6);
  }, [state.leads]);

  const go = (view: Parameters<typeof navigate>[0]) => {
    setOpen(false);
    navigate(view, {});
  };

  const openLead = (leadId: string) => {
    setOpen(false);
    navigate("leads", { lead: leadId });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command loop>
        <CommandInput placeholder="Search leads, jump to an area, run an action…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigate">
            <CommandItem value="go-overview" onSelect={() => go("dashboard")}>
              <LayoutGrid className="text-ink-subtle" />
              Overview
              <span className="ml-auto text-2xs text-ink-subtle">dashboard</span>
            </CommandItem>
            <CommandItem value="go-leads" onSelect={() => go("leads")}>
              <Inbox className="text-ink-subtle" />
              Leads
              <span className="ml-auto text-2xs text-ink-subtle">{state.leads.length} total</span>
            </CommandItem>
            <CommandItem value="go-pipeline" onSelect={() => go("pipeline")}>
              <Kanban className="text-ink-subtle" />
              Pipeline
            </CommandItem>
            <CommandItem value="go-reports" onSelect={() => go("reports")}>
              <BarChart3 className="text-ink-subtle" />
              Search &amp; reports
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="action-toggle-role"
              onSelect={() => {
                setOpen(false);
                dispatch({
                  type: "set-role",
                  role: state.role === "admin" ? "agent" : "admin",
                });
              }}
            >
              {isAdmin ? <ShieldOff className="text-ink-subtle" /> : <ShieldCheck className="text-ink-subtle" />}
              Switch demo role to {isAdmin ? "agent" : "administrator"}
            </CommandItem>
            <CommandItem
              value="action-export"
              disabled={!isAdmin}
              onSelect={() => {
                setOpen(false);
                dispatch({ type: "set-role", role: "admin" });
                navigate("reports", {});
              }}
            >
              <Download className="text-ink-subtle" />
              Export leads as CSV
              {!isAdmin ? (
                <span className="ml-auto text-2xs text-ink-subtle">requires admin role</span>
              ) : (
                <span className="ml-auto text-2xs text-ink-subtle">.csv</span>
              )}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Recent leads">
            {leadOptions.map((lead) => (
              <CommandItem key={lead.id} value={`lead-${lead.id}`} onSelect={() => openLead(lead.id)}>
                <span className="flex size-4 items-center justify-center" aria-hidden="true">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: LEAD_STATUS_META[lead.status].dot }}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {lead.investorName ?? lead.contactId}
                </span>
                <Badge variant="outline" size="sm" className="ml-auto shrink-0">
                  {LEAD_STATUS_META[lead.status].label}
                </Badge>
                <span className="hidden w-20 shrink-0 text-right text-2xs text-ink-subtle sm:block">
                  {formatRelative(lead.lastContactAt ?? lead.createdAt)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <CommandFooterHint />
      </Command>
    </CommandDialog>
  );
}

function CommandFooterHint() {
  const { isAdmin } = useStore();
  return (
    <div className="flex items-center justify-between border-t border-ink-line px-4 py-2">
      <span className={cn("flex items-center gap-1.5 text-2xs text-ink-muted")}>
        <ArrowRight className="size-3" aria-hidden="true" />
        <span>Role: {isAdmin ? "Administrator — export enabled" : "Agent — export locked"}</span>
      </span>
      <span className="flex items-center gap-1.5 text-2xs text-ink-subtle">
        <FileDown className="size-3" aria-hidden="true" />
        CSV export respects your role
      </span>
    </div>
  );
}