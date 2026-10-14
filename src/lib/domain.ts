import type {
  BudgetBandId,
  CampaignChannel,
  FollowUpChannel,
  InvestmentGoal,
  LeadStatus,
  Role,
} from "@/data/types";

/**
 * Presentation metadata for every enum in the domain. Keeping labels and
 * colours in one place is what makes the product feel consistent: the same
 * status reads identically in the table, the board, the sheet and the palette.
 */

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "follow-up",
  "converted",
  "not-interested",
];

export interface StatusMeta {
  id: LeadStatus;
  label: string;
  /** Solid dot colour used on kanban cards and timeline rails. */
  dot: string;
  /** Soft badge treatment for tables. */
  badge: string;
  /** Column accent on the pipeline board. */
  accent: string;
  description: string;
}

export const LEAD_STATUS_META: Record<LeadStatus, StatusMeta> = {
  new: {
    id: "new",
    label: "New",
    dot: "#0047AB",
    badge: "bg-cobalt-soft text-cobalt border-cobalt/20",
    accent: "#0047AB",
    description: "Just arrived, nobody has replied yet.",
  },
  contacted: {
    id: "contacted",
    label: "Contacted",
    dot: "#64748B",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "#64748B",
    description: "First reply sent, awaiting a response.",
  },
  qualified: {
    id: "qualified",
    label: "Qualified",
    dot: "#0F766E",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    accent: "#0F766E",
    description: "Budget and goal confirmed — ready for an advisor.",
  },
  "follow-up": {
    id: "follow-up",
    label: "Follow-up",
    dot: "#B45309",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    accent: "#B45309",
    description: "Warm but waiting; a scheduled task is open.",
  },
  converted: {
    id: "converted",
    label: "Converted",
    dot: "#15803D",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#15803D",
    description: "Invested. Keep for reporting only.",
  },
  "not-interested": {
    id: "not-interested",
    label: "Not Interested",
    dot: "#94A3B8",
    badge: "bg-ink-wash text-ink-muted border-ink-line",
    accent: "#94A3B8",
    description: "Closed out — no response or explicitly declined.",
  },
};

export const GOAL_LABELS: Record<InvestmentGoal, string> = {
  "long-term-savings": "Long-term savings",
  retirement: "Retirement",
  "monthly-sip": "Monthly SIP",
  "child-education": "Child's education",
  "compare-options": "Compare options",
  "learn-basics": "Learn the basics",
};

export const GOAL_ORDER: InvestmentGoal[] = [
  "long-term-savings",
  "retirement",
  "monthly-sip",
  "child-education",
  "compare-options",
  "learn-basics",
];

export interface BudgetBand {
  id: BudgetBandId;
  label: string;
  short: string;
  /** Inclusive lower and upper bounds of the band, in INR per month. */
  min: number;
  max: number;
  midpoint: number;
}

export const BUDGET_BANDS: BudgetBand[] = [
  {
    id: "under-1k",
    label: "Below ₹1,000 / month",
    short: "Below ₹1k",
    min: 0,
    max: 1_000,
    midpoint: 500,
  },
  {
    id: "1k-5k",
    label: "₹1,000 – ₹5,000 / month",
    short: "₹1k – ₹5k",
    min: 1_000,
    max: 5_000,
    midpoint: 3_000,
  },
  {
    id: "5k-10k",
    label: "₹5,000 – ₹10,000 / month",
    short: "₹5k – ₹10k",
    min: 5_000,
    max: 10_000,
    midpoint: 7_500,
  },
  {
    id: "10k-20k",
    label: "₹10,000 – ₹20,000 / month",
    short: "₹10k – ₹20k",
    min: 10_000,
    max: 20_000,
    midpoint: 15_000,
  },
  {
    id: "20k-30k",
    label: "₹20,000 – ₹30,000 / month",
    short: "₹20k – ₹30k",
    min: 20_000,
    max: 30_000,
    midpoint: 25_000,
  },
  {
    id: "not-decided",
    label: "Not decided yet",
    short: "Not decided",
    min: 0,
    max: 0,
    midpoint: 0,
  },
];

export const BUDGET_BAND_BY_ID: Record<BudgetBandId, BudgetBand> = BUDGET_BANDS.reduce(
  (acc, band) => ({ ...acc, [band.id]: band }),
  {} as Record<BudgetBandId, BudgetBand>,
);

export const CHANNEL_LABELS: Record<CampaignChannel, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  "google-ads": "Google Ads",
  website: "Website",
  referral: "Referral",
};

export const FOLLOW_UP_CHANNEL_LABELS: Record<FollowUpChannel, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Email",
  meeting: "Meeting",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  agent: "Sales agent",
};

/**
 * Export is a privileged action. Agents can work every lead but cannot pull
 * the full dataset out of the product.
 */
export const CAN_EXPORT: Record<Role, boolean> = {
  admin: true,
  agent: false,
};

export const ROLE_EXPORT_REASON: Record<Role, string> = {
  admin: "Your role includes data export.",
  agent: "Export requires the Administrator role.",
};
