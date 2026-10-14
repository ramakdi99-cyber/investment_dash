import type {
  BudgetBandId,
  Campaign,
  CampaignChannel,
  InvestmentGoal,
  Lead,
  LeadStatus,
} from "@/data/types";
import {
  BUDGET_BANDS,
  BUDGET_BAND_BY_ID,
  CHANNEL_LABELS,
  GOAL_LABELS,
} from "@/lib/domain";

/**
 * Mapping layer between the plain-text snake_case rows in `public.leads` and
 * the camelCase UI model. The database stores *labels-carrying* strings
 * (e.g. investment_goal = 'retirement', monthly_budget_range = '5k-10k',
 * status = 'FOLLOW_UP', source = 'Instagram'), so every conversion below is
 * deliberately tolerant: it accepts the canonical key, the human label, or a
 * loose variant, and degrades to a safe default instead of crashing the row.
 */

/** Exact shape of a row in `public.leads` (the schema shipped by the user). */
export interface LeadDbRow {
  id: string;
  name: string | null;
  phone: string | null;
  whatsapp_id: string | null;
  first_message: string | null;
  source: string | null;
  campaign_name: string | null;
  ad_id: string | null;
  investment_goal: string | null;
  monthly_budget_range: string | null;
  time_horizon: string | null;
  risk_comfort: string | null;
  experience: string | null;
  status: string | null;
  assigned_to: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at?: string | null;
}

/** The subset of columns the frontend is allowed to write. */
export type UpdatableLeadColumns = Partial<
  Pick<
    LeadDbRow,
    | "name"
    | "phone"
    | "whatsapp_id"
    | "first_message"
    | "source"
    | "campaign_name"
    | "ad_id"
    | "investment_goal"
    | "monthly_budget_range"
    | "time_horizon"
    | "risk_comfort"
    | "experience"
    | "status"
    | "assigned_to"
    | "last_contact_at"
  >
>;

export const UPDATABLE_COLUMNS = new Set<keyof UpdatableLeadColumns>([
  "name",
  "phone",
  "whatsapp_id",
  "first_message",
  "source",
  "campaign_name",
  "ad_id",
  "investment_goal",
  "monthly_budget_range",
  "time_horizon",
  "risk_comfort",
  "experience",
  "status",
  "assigned_to",
  "last_contact_at",
]);

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

const STATUS_AS_DB: Record<LeadStatus, string> = {
  new: "NEW",
  contacted: "CONTACTED",
  qualified: "QUALIFIED",
  "follow-up": "FOLLOW_UP",
  converted: "CONVERTED",
  "not-interested": "NOT_INTERESTED",
};

const STATUS_BY_NORMALISED: Record<string, LeadStatus> = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  FOLLOW_UP: "follow-up",
  FOLLOWUP: "follow-up",
  CONVERTED: "converted",
  NOT_INTERESTED: "not-interested",
  NOT_INTERESTED_: "not-interested",
  DECLINED: "not-interested",
  CLOSED: "not-interested",
  LOST: "not-interested",
};

function normalise(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/__+/g, "_");
}

/** Converts the UI status to the value stored in the `status` column. */
export function statusToDb(status: LeadStatus): string {
  return STATUS_AS_DB[status];
}

/** Parses a database status back into the UI enum, or null when unknown. */
export function parseStatus(raw: string | null | undefined): LeadStatus | null {
  if (!raw) return null;
  return STATUS_BY_NORMALISED[normalise(raw)] ?? null;
}

/* ------------------------------------------------------------------ */
/* Investment goal                                                     */
/* ------------------------------------------------------------------ */

const GOAL_KEYS = Object.keys(GOAL_LABELS) as InvestmentGoal[];

export function goalToDb(goal: InvestmentGoal): string {
  return goal;
}

export function parseGoal(raw: string | null | undefined): InvestmentGoal | null {
  if (!raw) return null;
  const key = normalise(raw);
  const direct = (GOAL_KEYS as string[]).find((item) => normalise(item) === key);
  if (direct) return direct as InvestmentGoal;

  const lowered = raw.trim().toLowerCase();
  const byLabel = GOAL_KEYS.find((goal) => GOAL_LABELS[goal].toLowerCase() === lowered);
  if (byLabel) return byLabel;
  const byPartial = GOAL_KEYS.find((goal) =>
    GOAL_LABELS[goal].toLowerCase().includes(lowered),
  );
  return byPartial ?? null;
}

/* ------------------------------------------------------------------ */
/* Monthly budget band                                                 */
/* ------------------------------------------------------------------ */

export function budgetBandToDb(band: BudgetBandId): string {
  return band;
}

function parseInrNumbers(raw: string): number[] {
  const matches = raw.match(/[\d,]+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map((value) => Number(value.replace(/,/g, ""))).filter((n) => !Number.isNaN(n));
}

export function parseBudgetBand(raw: string | null | undefined): BudgetBandId | null {
  if (!raw) return null;
  const key = normalise(raw);
  const direct = (BUDGET_BANDS.map((band) => band.id) as string[]).find(
    (item) => normalise(item) === key,
  );
  if (direct) return direct as BudgetBandId;

  const lowered = raw.trim().toLowerCase();
  if (lowered.includes("not decided") || lowered.includes("not-decid")) return "not-decided";

  const byLabel = BUDGET_BANDS.find(
    (band) => band.label.toLowerCase() === lowered || band.short.toLowerCase() === lowered,
  );
  if (byLabel) return byLabel.id;

  // "₹5,000 – ₹10,000" style strings -> use the lower bound to identify the band.
  const [lower] = parseInrNumbers(raw);
  if (!Number.isFinite(lower)) return null;
  const byRange = BUDGET_BANDS.find((band) => band.min === lower);
  return byRange?.id ?? null;
}

export function budgetBandMidpoint(band: BudgetBandId): number {
  return BUDGET_BAND_BY_ID[band].midpoint;
}

/* ------------------------------------------------------------------ */
/* Channel                                                             */
/* ------------------------------------------------------------------ */

const CHANNEL_KEYS = Object.keys(CHANNEL_LABELS) as CampaignChannel[];

export function channelToDb(channel: CampaignChannel): string {
  return CHANNEL_LABELS[channel];
}

export function parseChannel(raw: string | null | undefined): CampaignChannel {
  if (!raw) return "whatsapp";
  const key = normalise(raw);
  const direct = (CHANNEL_KEYS as string[]).find((item) => normalise(item) === key);
  if (direct) return direct as CampaignChannel;

  const lowered = raw.trim().toLowerCase();
  const byLabel = CHANNEL_KEYS.find((channel) => CHANNEL_LABELS[channel].toLowerCase() === lowered);
  if (byLabel) return byLabel;
  const byPartial = CHANNEL_KEYS.find((channel) =>
    lowered.includes(CHANNEL_LABELS[channel].toLowerCase()) ||
    lowered.includes(channel.replace("-", "")),
  );
  return byPartial ?? "whatsapp";
}

/* ------------------------------------------------------------------ */
/* Campaign name -> campaign id (when the row is matched locally)      */
/* ------------------------------------------------------------------ */

export function resolveCampaignId(
  campaignRawName: string | null | undefined,
  campaigns: Pick<Campaign, "id" | "name">[],
): string | null {
  if (!campaignRawName) return null;
  const target = campaignRawName.trim().toLowerCase();
  const match = campaigns.find((campaign) => campaign.name.toLowerCase() === target);
  return match?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* Row -> UI lead                                                      */
/* ------------------------------------------------------------------ */

export function mapLeadFromDb(row: LeadDbRow): Lead {
  const status = parseStatus(row.status);
  const goal = parseGoal(row.investment_goal);
  const budgetBand = parseBudgetBand(row.monthly_budget_range);

  return {
    id: row.id,
    investorName: row.name?.trim() ? row.name.trim() : null,
    whatsapp: row.phone?.trim() ? row.phone.trim() : null,
    contactId: row.whatsapp_id?.trim() || row.id,
    firstMessage: row.first_message?.trim() || "No first message captured.",
    goal: goal ?? "learn-basics",
    budgetBand,
    statedMonthlyInterest: budgetBand ? budgetBandMidpoint(budgetBand) : null,
    status: status ?? "new",
    assignedEmployeeId: row.assigned_to?.trim() ? row.assigned_to.trim() : null,
    campaignId: null,
    campaignRawName: row.campaign_name?.trim() || null,
    source: parseChannel(row.source),
    timeHorizon: row.time_horizon?.trim() || null,
    riskComfort: row.risk_comfort?.trim() || null,
    experience: row.experience?.trim() || null,
    createdAt: row.created_at || new Date().toISOString(),
    lastContactAt: row.last_contact_at || null,
    qualification: buildQualification({
      goal: goal ?? "learn-basics",
      budgetBand,
      timeHorizon: row.time_horizon?.trim() || null,
      riskComfort: row.risk_comfort?.trim() || null,
      experience: row.experience?.trim() || null,
    }),
  };
}

function buildQualification(input: {
  goal: InvestmentGoal;
  budgetBand: BudgetBandId | null;
  timeHorizon: string | null;
  riskComfort: string | null;
  experience: string | null;
}): Lead["qualification"] {
  const answered = (question: string, answer: string | null) => ({ question, answer });
  return [
    answered("What is your primary goal?", GOAL_LABELS[input.goal]),
    answered(
      "Monthly budget range",
      input.budgetBand ? BUDGET_BAND_BY_ID[input.budgetBand].label : null,
    ),
    answered("Investment horizon", input.timeHorizon),
    answered("Risk comfort", input.riskComfort),
    answered("Experience level", input.experience),
  ];
}

/** Validates the UI status and converts to the value used in the database. */
export function validateStatusOrThrow(
  status: LeadStatus | string | null | undefined,
): string | null {
  if (status == null) return null;
  const parsed = parseStatus(status);
  if (!parsed) {
    throw new TypeError(
      `Invalid lead status "${String(status)}". Expected one of: ` +
        Object.values(STATUS_AS_DB).join(", "),
    );
  }
  return STATUS_AS_DB[parsed];
}

/** Compose a lead model back into a row-shaped insert payload. */
export function leadToDbInsert(
  lead: Pick<
    Lead,
    | "investorName"
    | "whatsapp"
    | "contactId"
    | "firstMessage"
    | "goal"
    | "budgetBand"
    | "status"
    | "assignedEmployeeId"
    | "campaignRawName"
    | "source"
    | "timeHorizon"
    | "riskComfort"
    | "experience"
    | "lastContactAt"
  >,
): {
  name: string | null;
  phone: string | null;
  whatsapp_id: string | null;
  first_message: string | null;
  investment_goal: string | null;
  monthly_budget_range: string | null;
  status: string | null;
  assigned_to: string | null;
  campaign_name: string | null;
  source: string | null;
  time_horizon: string | null;
  risk_comfort: string | null;
  experience: string | null;
  last_contact_at: string | null;
} {
  return {
    name: lead.investorName,
    phone: lead.whatsapp,
    whatsapp_id: lead.contactId || null,
    first_message: lead.firstMessage || null,
    investment_goal: lead.goal ? goalToDb(lead.goal) : null,
    monthly_budget_range: lead.budgetBand ? budgetBandToDb(lead.budgetBand) : null,
    status: lead.status ? statusToDb(lead.status) : null,
    assigned_to: lead.assignedEmployeeId,
    campaign_name: lead.campaignRawName || null,
    source: lead.source ? channelToDb(lead.source) : null,
    time_horizon: lead.timeHorizon || null,
    risk_comfort: lead.riskComfort || null,
    experience: lead.experience || null,
    last_contact_at: lead.lastContactAt || null,
  };
}