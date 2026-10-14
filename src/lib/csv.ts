import type { Lead } from "@/data/types";
import { BUDGET_BAND_BY_ID, GOAL_LABELS, LEAD_STATUS_META } from "@/lib/domain";

function escapeCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Deterministic CSV row for the reports export. Column order is fixed so the
 * file is easy to audit against the product's screens.
 */
export function buildCsv(
  leads: Lead[],
  resolve: { employeeName: (id: string | null) => string; campaignName: (id: string | null) => string },
): string {
  const header = [
    "Lead ID",
    "Name",
    "Contact (masked)",
    "Source",
    "Campaign",
    "Investment goal",
    "Monthly budget range",
    "Status",
    "Assigned to",
    "Created",
    "Last contact",
    "First message",
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.investorName ?? "",
    lead.whatsapp ?? lead.contactId,
    lead.source,
    lead.campaignRawName || (lead.campaignId ? resolve.campaignName(lead.campaignId) : "") || "",
    GOAL_LABELS[lead.goal],
    lead.budgetBand ? BUDGET_BAND_BY_ID[lead.budgetBand].label : "",
    LEAD_STATUS_META[lead.status].label,
    resolve.employeeName(lead.assignedEmployeeId),
    new Date(lead.createdAt).toISOString(),
    lead.lastContactAt ? new Date(lead.lastContactAt).toISOString() : "",
    lead.firstMessage,
  ]);

  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(","));
  // BOM so Excel opens the UTF-8 file with the right encoding.
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}