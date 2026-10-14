/**
 * Domain model for the CRM.
 *
 * Everything is intentionally serialisable: the entire dataset lives in
 * client memory (see `src/data/seed.ts`) and is mutated through the reducer in
 * `src/state/store.tsx`. In a real deployment these types map 1:1 to API DTOs.
 */

/** The six pipeline stages, in board order. */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "follow-up"
  | "converted"
  | "not-interested";

/** What the investor says they want the money to do. */
export type InvestmentGoal =
  | "long-term-savings"
  | "retirement"
  | "monthly-sip"
  | "child-education"
  | "compare-options"
  | "learn-basics";

/**
 * Stated monthly investment capacity, bucketed so it can be filtered and
 * sorted without exposing the exact (often rounded) number the lead typed.
 * Mirrors the budget ranges in the source dataset; "not-decided" is a real
 * value (the lead hasn't told us), distinct from "not captured at all".
 */
export type BudgetBandId =
  | "under-1k"
  | "1k-5k"
  | "5k-10k"
  | "10k-20k"
  | "20k-30k"
  | "not-decided";

/** Acquisition channel of the campaign that produced the lead. */
export type CampaignChannel =
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "google-ads"
  | "website"
  | "referral";

export type Role = "admin" | "agent";

export type FollowUpChannel = "call" | "whatsapp" | "email" | "meeting";

export type MessageDirection = "inbound" | "outbound";

export type ActivityKind =
  | "lead-created"
  | "status-changed"
  | "assigned"
  | "note-added"
  | "follow-up-scheduled"
  | "follow-up-completed"
  | "message";

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  email: string;
  /** Capacity hint used by the pipeline summary. */
  capacity: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  startedAt: string;
  /** Spend to date, in INR. */
  spend: number;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  direction: MessageDirection;
  body: string;
  at: string;
  /** Present on outbound messages sent by a teammate. */
  authorId?: string;
}

export interface Note {
  id: string;
  leadId: string;
  authorId: string;
  body: string;
  at: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  summary: string;
  channel: FollowUpChannel;
  ownerId: string;
  dueAt: string;
  completedAt?: string;
}

export interface QualificationAnswer {
  question: string;
  /** `null` models a question the lead skipped. */
  answer: string | null;
}

export interface Lead {
  id: string;
  /** Name, when provided by the investor. */
  investorName: string | null;
  /** Masked E.164-style WhatsApp number (click-to-chat source). */
  whatsapp: string | null;
  /** Platform contact id, the fallback identity when a number is missing. */
  contactId: string;
  firstMessage: string;
  goal: InvestmentGoal;
  /**
   * `null` means no budget band was captured; "not-decided" means the lead
   * told us they have not decided yet.
   */
  budgetBand: BudgetBandId | null;
  /** Midpoint of the stated band, only present when a budget was captured. */
  statedMonthlyInterest: number | null;
  status: LeadStatus;
  assignedEmployeeId: string | null;
  campaignId: string | null;
  /**
   * The campaign label as stored in the database row (`campaign_name`). The
   * Supabase schema stores a plain-text campaign name, not an id — this field
   * preserves it verbatim so unmatched names still display instead of becoming
   * "Not provided".
   */
  campaignRawName: string | null;
  source: CampaignChannel;
  /** Initial qualification answers, captured alongside the first message. */
  timeHorizon: string | null;
  riskComfort: string | null;
  experience: string | null;
  createdAt: string;
  lastContactAt: string | null;
  qualification: QualificationAnswer[];
}

/** A denormalised feed entry for the dashboard's activity list. */
export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  leadId: string | null;
  actorId: string | null;
  summary: string;
  at: string;
}

/** Everything the app needs, held in a single normalised-ish store. */
export interface CrmDataset {
  employees: Employee[];
  campaigns: Campaign[];
  leads: Lead[];
  messages: ChatMessage[];
  notes: Note[];
  followUps: FollowUp[];
  activity: ActivityEvent[];
  /** Demo user id per role, used by the role switcher. */
  users: Record<Role, { id: string; name: string; role: Role; email: string }>;
}

/** Filters that are applied together and mirrored into the URL. */
export interface LeadFilters {
  status: LeadStatus[];
  campaignId: string[];
  goal: InvestmentGoal[];
  budgetBand: BudgetBandId[];
  employeeId: string[];
  /** Inclusive ISO date (`YYYY-MM-DD`) applied to `createdAt`. */
  from: string | null;
  to: string | null;
  /** Free-text search across name, number, message and note bodies. */
  q: string;
}

export const EMPTY_FILTERS: LeadFilters = {
  status: [],
  campaignId: [],
  goal: [],
  budgetBand: [],
  employeeId: [],
  from: null,
  to: null,
  q: "",
};

export type LeadSortKey =
  | "investor"
  | "goal"
  | "budget"
  | "status"
  | "assignee"
  | "lastContact"
  | "firstMessage";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: LeadSortKey;
  direction: SortDirection;
}
