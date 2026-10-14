import type { Lead, LeadStatus } from "@/data/types";
import { BUDGET_BAND_BY_ID, GOAL_LABELS, LEAD_STATUS_META, LEAD_STATUS_ORDER } from "@/lib/domain";

/**
 * Filtering + sorting. Pure functions so every view (table, board, reports,
 * palette) shows exactly the same definition of "in scope".
 */

export class SortSignals {
  static status(lead: Lead) {
    return LEAD_STATUS_ORDER.indexOf(lead.status);
  }

  static goal(lead: Lead) {
    return GOAL_LABELS[lead.goal];
  }

  static budget(lead: Lead) {
    return lead.budgetBand ? BUDGET_BAND_BY_ID[lead.budgetBand].min : Number.NEGATIVE_INFINITY;
  }
}

export function applyFilters(leads: Lead[], filters: { status: string[]; campaignId: string[]; goal: string[]; budgetBand: string[]; employeeId: string[]; from: string | null; to: string | null; q: string }) {
  const query = filters.q.trim().toLowerCase();

  const statuses = new Set(filters.status);
  const campaigns = new Set(filters.campaignId);
  const goals = new Set(filters.goal);
  const bands = new Set(filters.budgetBand);
  const employees = new Set(filters.employeeId);

  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

  return leads.filter((lead) => {
    if (statuses.size > 0 && !statuses.has(lead.status)) return false;
    if (campaigns.size > 0 && !(lead.campaignId && campaigns.has(lead.campaignId))) return false;
    if (goals.size > 0 && !goals.has(lead.goal)) return false;
    if (bands.size > 0 && !(lead.budgetBand && bands.has(lead.budgetBand))) return false;
    if (employees.size > 0 && !(lead.assignedEmployeeId && employees.has(lead.assignedEmployeeId))) return false;

    const created = new Date(lead.createdAt);
    if (from && created < from) return false;
    if (to && created > to) return false;

    if (query) {
      const haystack = [
        lead.investorName ?? "",
        lead.whatsapp ?? "",
        lead.contactId,
        lead.firstMessage,
        lead.id,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export type LeadSort =
  | "investor"
  | "goal"
  | "budget"
  | "status"
  | "assignee"
  | "lastContact"
  | "firstMessage";

function compareStrings(a: string | null, b: string | null) {
  const na = a === null;
  const nb = b === null;
  if (na && nb) return 0;
  if (na) return 1; // missing sorts last, always
  if (nb) return -1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sortLeads(
  leads: Lead[],
  sort: { key: LeadSort; direction: "asc" | "desc" },
  employeeNameById: (id: string | null) => string | null,
) {
  const dir = sort.direction === "asc" ? 1 : -1;
  const sorted = [...leads];

  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sort.key) {
      case "investor":
        cmp = compareStrings(a.investorName, b.investorName);
        break;
      case "goal":
        cmp = compareStrings(GOAL_LABELS[a.goal], GOAL_LABELS[b.goal]);
        break;
      case "budget":
        cmp = SortSignals.budget(a) - SortSignals.budget(b);
        break;
      case "status":
        cmp = SortSignals.status(a) - SortSignals.status(b);
        break;
      case "assignee":
        cmp = compareStrings(
          employeeNameById(a.assignedEmployeeId),
          employeeNameById(b.assignedEmployeeId),
        );
        break;
      case "lastContact":
        cmp = compareStrings(a.lastContactAt, b.lastContactAt);
        break;
      case "firstMessage":
        cmp = compareStrings(a.firstMessage, b.firstMessage);
        break;
    }
    return cmp === 0 ? compareStrings(a.createdAt, b.createdAt) * dir : cmp * dir;
  });

  return sorted;
}

export function filterCounts(leads: Lead[]) {
  const counts: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    "follow-up": 0,
    converted: 0,
    "not-interested": 0,
  };
  for (const lead of leads) {
    if (counts[lead.status] !== undefined) counts[lead.status] += 1;
  }
  return counts;
}

export function statusLabel(status: LeadStatus) {
  return LEAD_STATUS_META[status].label;
}

export const statusOrder = LEAD_STATUS_ORDER;