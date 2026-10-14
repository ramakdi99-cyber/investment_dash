import type { SupabaseClient } from "@supabase/supabase-js";
import type { BudgetBandId, InvestmentGoal, Lead, LeadStatus } from "@/data/types";
import type { LeadSortKey, SortDirection } from "@/data/types";
import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabase";
import {
  budgetBandToDb,
  channelToDb,
  goalToDb,
  mapLeadFromDb,
  parseChannel,
  statusToDb,
  UPDATABLE_COLUMNS,
  validateStatusOrThrow,
  type LeadDbRow,
  type UpdatableLeadColumns,
} from "@/services/db-mapper";

/**
 * Lead persistence layer. Every function reads from / writes to Supabase and
 * returns the UI model (camelCase). The UI never talks to the database
 * directly — it goes through the store, which calls this service.
 *
 * Security notes:
 * - Only the publishable (anon) key is used, and only inside `getSupabaseClient()`.
 * - Every query is parameterised by supabase-js / PostgREST; no raw SQL.
 * - Writes only succeed if RLS policies allow the anon role to write.
 */

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class LeadServiceError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "LeadServiceError";
    this.code = code;
  }
}

export class LeadNotFoundError extends LeadServiceError {
  constructor() {
    super("This lead no longer exists in the database.", "PGRST116");
  }
}

export class LeadDuplicateError extends LeadServiceError {
  constructor() {
    super("A lead with this WhatsApp id already exists. No duplicate was created.");
  }
}

export class LeadPermissionError extends LeadServiceError {
  constructor() {
    super(
      "The database rejected this request (row-level security). The publishable key may " +
        "only read — run the RLS migration in supabase/migrations/004 before enabling writes.",
      "42501",
    );
  }
}

/** Maps any thrown value to a safe, displayable message. Logs details to the console. */
export function describeError(error: unknown): string {
  if (error instanceof LeadServiceError) return error.message;
  if (error instanceof SupabaseConfigError) return error.message;
  if (error instanceof TypeError) return error.message;

  const raw = error as { code?: string; message?: string; name?: string } | null;
  const code = raw?.code;
  const message = raw?.message;

  if (code === "23505") return new LeadDuplicateError().message;
  if (code === "42501") return new LeadPermissionError().message;
  if (code === "22P02") {
    return "The database rejected a value (invalid UUID or enum). Check the lead data and try again.";
  }
  if (code === "PGRST106" || code === "PGRST116") return new LeadNotFoundError().message;

  // Unhelpful browser-level failures (network, DNS, TLS).
  if (!code && (error instanceof TypeError || raw?.name === "TypeError")) {
    return "Could not reach the Supabase API. Check VITE_SUPABASE_URL and your network connection.";
  }

  console.error("[leadService]", error);
  return message || "Something went wrong while saving to the database.";
}

function ensureClient(): SupabaseClient {
  return getSupabaseClient();
}

/** Keeps user input from breaking the PostgREST `or()` filter grammar. */
function sanitiseTerm(value: string): string {
  return value
    .trim()
    .replace(/[,()%_*"'\\;]/g, "")
    .slice(0, 60);
}

const SORT_COLUMN: Record<LeadSortKey, keyof LeadDbRow> = {
  investor: "name",
  goal: "investment_goal",
  budget: "monthly_budget_range",
  status: "status",
  assignee: "assigned_to",
  lastContact: "last_contact_at",
  firstMessage: "first_message",
};

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export interface LeadQueryFilters {
  /** Free-text search across name and phone (also whatsapp_id + first_message). */
  q?: string;
  statuses?: LeadStatus[];
  /** Campaign names exactly as stored in `campaign_name`. */
  campaigns?: string[];
  goals?: InvestmentGoal[];
  budgetBands?: BudgetBandId[];
  /** Assigned-to values exactly as stored (employee id or name). */
  employees?: string[];
  /** Inclusive ISO date (`YYYY-MM-DD`) applied to `created_at`. */
  from?: string | null;
  to?: string | null;
  sort?: { key: LeadSortKey; direction: SortDirection } | null;
  limit?: number;
  offset?: number;
}

export interface LeadSearchResult {
  leads: Lead[];
  /** Total rows matching the filters before pagination. */
  total: number;
}

/** Server-side search + filter + sort + pagination over `public.leads`. */
export async function searchLeads(filters: LeadQueryFilters = {}): Promise<LeadSearchResult> {
  const client = ensureClient();
  const query = client.from("leads").select("*", { count: "exact" });

  if (filters.q) {
    const term = sanitiseTerm(filters.q);
    if (term) {
      query.or(
        `name.ilike.%${term}%,phone.ilike.%${term}%,whatsapp_id.ilike.%${term}%,first_message.ilike.%${term}%`,
      );
    }
  }
  if (filters.statuses?.length) {
    query.in("status", filters.statuses.map(statusToDb));
  }
  if (filters.campaigns?.length) {
    query.in("campaign_name", filters.campaigns);
  }
  if (filters.goals?.length) {
    query.in("investment_goal", filters.goals.map(goalToDb));
  }
  if (filters.budgetBands?.length) {
    query.in("monthly_budget_range", filters.budgetBands.map(budgetBandToDb));
  }
  if (filters.employees?.length) {
    query.in("assigned_to", filters.employees);
  }
  if (filters.from) {
    query.gte("created_at", `${filters.from}T00:00:00.000Z`);
  }
  if (filters.to) {
    query.lte("created_at", `${filters.to}T23:59:59.999Z`);
  }

  query.order("created_at", { ascending: false });

  if (filters.sort) {
    const column = SORT_COLUMN[filters.sort.key];
    query.order(column, { ascending: filters.sort.direction === "asc" });
  }

  const limit = filters.limit ?? 500;
  const offset = filters.offset ?? 0;
  query.range(offset, Math.max(offset, offset + limit - 1));

  const { data, count, error } = await query;

  if (error) {
    throw new LeadServiceError(describeError(error), error.code);
  }
  return {
    leads: (data ?? []).map((row) => mapLeadFromDb(row as LeadDbRow)),
    total: count ?? (data ?? []).length,
  };
}

/** Fetch leads with a sensible result limit (default 500 rows, newest first). */
export async function getLeads(limit = 500): Promise<Lead[]> {
  const { leads } = await searchLeads({ limit });
  return leads;
}

/** Fetch a single lead by its UUID. */
export async function getLeadById(id: string): Promise<Lead> {
  const client = ensureClient();
  const { data, error } = await client
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new LeadServiceError(describeError(error), error.code);
  if (!data) throw new LeadNotFoundError();
  return mapLeadFromDb(data as LeadDbRow);
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export interface CreateLeadInput {
  name?: string | null;
  phone?: string | null;
  whatsappId?: string | null;
  firstMessage?: string | null;
  source?: string | null;
  campaignName?: string | null;
  adId?: string | null;
  investmentGoal?: string | null;
  monthlyBudgetRange?: string | null;
  timeHorizon?: string | null;
  riskComfort?: string | null;
  experience?: string | null;
  status?: LeadStatus | string | null;
  assignedTo?: string | null;
  lastContactAt?: string | null;
}

/**
 * Create a lead. The id and timestamps are generated by PostgreSQL — never
 * sent from the client. Duplicate submission is prevented by checking the
 * unique `whatsapp_id` first and by translating the unique-constraint error
 * into a friendly `LeadDuplicateError`.
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const client = ensureClient();

  if (input.whatsappId?.trim()) {
    const existing = await client
      .from("leads")
      .select("id")
      .eq("whatsapp_id", input.whatsappId.trim())
      .maybeSingle();
    if (existing.error) throw new LeadServiceError(describeError(existing.error), existing.error.code);
    if (existing.data) throw new LeadDuplicateError();
  }

  const row: Record<string, unknown> = {
    name: input.name ?? null,
    phone: input.phone ?? null,
    whatsapp_id: input.whatsappId?.trim() || null,
    first_message: input.firstMessage ?? null,
    source: input.source ? channelToDb(parseChannel(input.source)) : null,
    campaign_name: input.campaignName ?? null,
    ad_id: input.adId ?? null,
    investment_goal: input.investmentGoal ?? null,
    monthly_budget_range: input.monthlyBudgetRange ?? null,
    time_horizon: input.timeHorizon ?? null,
    risk_comfort: input.riskComfort ?? null,
    experience: input.experience ?? null,
    status: validateStatusOrThrow(input.status) ?? "NEW",
    assigned_to: input.assignedTo ?? null,
    last_contact_at: input.lastContactAt ?? null,
  };

  const { data, error } = await client.from("leads").insert(row).select().single();
  if (error) throw new LeadServiceError(describeError(error), error.code);
  return mapLeadFromDb(data as LeadDbRow);
}

/** Update whitelisted columns of a single lead. */
export async function updateLead(
  id: string,
  updates: UpdatableLeadColumns,
): Promise<Lead> {
  const client = ensureClient();

  const payload: Partial<LeadDbRow> = { updated_at: new Date().toISOString() };
  for (const key of Object.keys(updates) as (keyof UpdatableLeadColumns)[]) {
    if (!UPDATABLE_COLUMNS.has(key)) {
      throw new LeadServiceError(`Column "${key}" is not updatable from the UI.`);
    }
    const value = updates[key];
    if (value !== undefined) payload[key] = value;
  }

  const { data, error } = await client
    .from("leads")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new LeadServiceError(describeError(error), error.code);
  if (!data) throw new LeadNotFoundError();
  return mapLeadFromDb(data as LeadDbRow);
}

/** Persist a pipeline stage change for a lead. */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  const dbStatus = validateStatusOrThrow(status);
  if (!dbStatus) throw new TypeError(`Invalid lead status "${String(status)}".`);
  return updateLead(id, { status: dbStatus });
}