import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  ActivityEvent,
  CrmDataset,
  FollowUp,
  FollowUpChannel,
  Lead,
  LeadStatus,
  Role,
} from "@/data/types";
import { CAMPAIGNS, DEMO_DATASET, EMPLOYEES } from "@/data/seed";
import { LEAD_STATUS_META } from "@/lib/domain";
import { uid as nextId } from "@/lib/utils";
import { getSupabaseClient, getSupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase";
import { resolveCampaignId } from "@/services/db-mapper";
import {
  describeError,
  getLeads,
  updateLead,
  updateLeadStatus,
} from "@/services/leadService";

type LoadState = "loading" | "ready";

/**
 * Where the lead dataset currently comes from.
 * - `demo`: the local 20-lead dataset (no Supabase credentials, or the last
 *   connection attempt failed). Everything edits state in memory only.
 * - `database`: leads were loaded from Supabase. Status / assignee / last
 *   contact writes are persisted before state is updated.
 */
export type DataSource = "demo" | "database";

export interface ConnectionState {
  /** True when both VITE_* variables exist. */
  configured: boolean;
  status: "idle" | "connecting" | "connected" | "failed";
  error: string | null;
  /**
   * Rows returned by the most recent successful query. Diagnostics only (shown
   * in the dev banner); a 0 here while the Table Editor shows rows usually
   * means row-level security hides the rows from the anon (publishable) key.
   */
  rowCount: number | null;
}

export interface Toast {
  id: string;
  tone: "success" | "error" | "info";
  title: string;
  detail?: string;
}

interface CrmState extends CrmDataset {
  loadState: LoadState;
  role: Role;
  /** Lead id currently open in the profile sheet (also mirrored to the URL). */
  openLeadId: string | null;
  dataSource: DataSource;
  connection: ConnectionState;
  toasts: Toast[];
}

type Action =
  | { type: "loaded" }
  | { type: "set-role"; role: Role }
  | { type: "set-lead-open"; leadId: string | null }
  | { type: "set-status"; leadId: string; status: LeadStatus }
  | { type: "assign"; leadId: string; employeeId: string | null }
  | { type: "add-note"; leadId: string; body: string }
  | { type: "send-message"; leadId: string; body: string }
  | { type: "schedule-follow-up"; leadId: string; summary: string; channel: FollowUpChannel; dueAt: string }
  | { type: "complete-follow-up"; followUpId: string }
  | { type: "delete-follow-up"; followUpId: string }
  | { type: "connection-start" }
  | { type: "connection-ok"; leads: Lead[] }
  | { type: "connection-fail"; error: string }
  | { type: "connection-skip"; error: string }
  | { type: "toast-push"; toast: Toast }
  | { type: "toast-dismiss"; id: string };

function pushEvent(activity: ActivityEvent[], event: ActivityEvent) {
  return [event, ...activity];
}

function reducer(state: CrmState, action: Action): CrmState {
  switch (action.type) {
    case "loaded":
      return { ...state, loadState: "ready" };

    case "set-role":
      return { ...state, role: action.role };

    case "set-lead-open":
      return { ...state, openLeadId: action.leadId };

    case "set-status":
      // Mirrors the database write exactly: only the status column changes
      // (last_contact_at is only touched when a reply is sent).
      return {
        ...state,
        leads: state.leads.map((item) =>
          item.id === action.leadId ? { ...item, status: action.status } : item,
        ),
        activity: pushEvent(state.activity, {
          id: nextId("ev"),
          kind: "status-changed",
          leadId: action.leadId,
          actorId: state.users[state.role].id,
          summary: `Moved to ${LEAD_STATUS_META[action.status].label}`,
          at: new Date().toISOString(),
        }),
      };

    case "assign": {
      const lead = state.leads.find((item) => item.id === action.leadId);
      if (!lead) return state;
      return {
        ...state,
        leads: state.leads.map((item) =>
          item.id === action.leadId ? { ...item, assignedEmployeeId: action.employeeId } : item,
        ),
        activity: pushEvent(state.activity, {
          id: nextId("ev"),
          kind: "assigned",
          leadId: action.leadId,
          actorId: state.users[state.role].id,
          summary: action.employeeId
            ? `Assigned to ${action.employeeId}`
            : "Cleared the assignee",
          at: new Date().toISOString(),
        }),
      };
    }

    case "add-note": {
      const note = {
        id: nextId("note"),
        leadId: action.leadId,
        authorId: state.users[state.role].id,
        body: action.body,
        at: new Date().toISOString(),
      };
      return {
        ...state,
        notes: [note, ...state.notes],
        activity: pushEvent(state.activity, {
          id: nextId("ev"),
          kind: "note-added",
          leadId: action.leadId,
          actorId: state.users[state.role].id,
          summary: "Added an internal note",
          at: note.at,
        }),
      };
    }

    case "send-message": {
      const message = {
        id: nextId("msg"),
        leadId: action.leadId,
        direction: "outbound" as const,
        body: action.body,
        at: new Date().toISOString(),
        authorId: state.users[state.role].id,
      };
      return {
        ...state,
        messages: [...state.messages, message],
        leads: state.leads.map((item) =>
          item.id === action.leadId ? { ...item, lastContactAt: message.at } : item,
        ),
        activity: pushEvent(state.activity, {
          id: nextId("ev"),
          kind: "message",
          leadId: action.leadId,
          actorId: state.users[state.role].id,
          summary: "Replied on WhatsApp",
          at: message.at,
        }),
      };
    }

    case "schedule-follow-up": {
      const followUp: FollowUp = {
        id: nextId("fu"),
        leadId: action.leadId,
        summary: action.summary,
        channel: action.channel,
        ownerId: state.users[state.role].id,
        dueAt: action.dueAt,
      };
      return {
        ...state,
        followUps: [followUp, ...state.followUps],
        activity: pushEvent(state.activity, {
          id: nextId("ev"),
          kind: "follow-up-scheduled",
          leadId: action.leadId,
          actorId: state.users[state.role].id,
          summary: `Scheduled a ${action.channel} follow-up`,
          at: new Date().toISOString(),
        }),
      };
    }

    case "complete-follow-up":
      return {
        ...state,
        followUps: state.followUps.map((item) =>
          item.id === action.followUpId ? { ...item, completedAt: new Date().toISOString() } : item,
        ),
        activity: pushEvent(state.activity, {
          id: nextId("ev"),
          kind: "follow-up-completed",
          leadId: state.followUps.find((item) => item.id === action.followUpId)?.leadId ?? null,
          actorId: state.users[state.role].id,
          summary: "Completed a follow-up",
          at: new Date().toISOString(),
        }),
      };

    case "delete-follow-up":
      return {
        ...state,
        followUps: state.followUps.filter((item) => item.id !== action.followUpId),
      };

    /* ---------------- Connection lifecycle ---------------- */

    case "connection-start":
      return {
        ...state,
        connection: {
          ...state.connection,
          configured: true,
          status: "connecting",
          error: null,
          rowCount: null,
        },
      };

    case "connection-ok":
      return {
        ...state,
        loadState: "ready",
        dataSource: "database",
        connection: {
          configured: true,
          status: "connected",
          error: null,
          rowCount: action.leads.length,
        },
        leads: action.leads,
        // Derived, session-only collections are cleared: the database has no
        // corresponding tables yet (see migrations/002-003), so keeping the
        // demo copies would mix fictional records with real leads.
        messages: [],
        notes: [],
        followUps: [],
        activity: [],
      };

    case "connection-fail":
      return {
        ...state,
        loadState: "ready",
        connection: {
          ...state.connection,
          status: "failed",
          error: action.error,
          rowCount: null,
        },
      };

    case "connection-skip":
      return {
        ...state,
        loadState: "ready",
        connection: {
          configured: false,
          status: "idle",
          error: action.error,
          rowCount: null,
        },
      };

    /* ---------------- Toasts ---------------- */

    case "toast-push":
      return { ...state, toasts: [...state.toasts.slice(-3), action.toast] };

    case "toast-dismiss":
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };

    default:
      return state;
  }
}

function initState(): CrmState {
  return {
    ...DEMO_DATASET,
    loadState: "loading",
    role: "admin",
    openLeadId: null,
    dataSource: "demo",
    connection: { configured: isSupabaseConfigured(), status: "idle", error: null, rowCount: null },
    toasts: [],
  };
}

/**
 * The database may store the employee id (preferred) or the display name.
 * Normalise a stored value to the canonical id so every consumer (table,
 * sheet, filters, assignment) compares against ids only.
 */
function normalizeAssignee(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (EMPLOYEES.some((employee) => employee.id === raw)) return raw;
  const byName = EMPLOYEES.find(
    (employee) => employee.name.toLowerCase() === raw.trim().toLowerCase(),
  );
  return byName?.id ?? raw;
}

interface StoreValue {
  state: CrmState;
  dispatch: Dispatch<Action>;
  isAdmin: boolean;
  leadById: (id: string | null | undefined) => Lead | undefined;
  employeeName: (id: string | null | undefined) => string;
  campaignName: (id: string | null | undefined) => string;
  campaignNameOfLead: (lead: Pick<Lead, "campaignId" | "campaignRawName">) => string;
  followUpsFor: (leadId: string) => FollowUp[];
  /* Connection + persistence helpers */
  dataSource: DataSource;
  connection: ConnectionState;
  retryConnection: () => Promise<void>;
  /** Persist (when in database mode) then apply a pipeline stage change. */
  setLeadStatus: (leadId: string, status: LeadStatus) => Promise<boolean>;
  /** Persist (when in database mode) then apply an assignment change. */
  assignLead: (leadId: string, employeeId: string | null) => Promise<boolean>;
  /** Persist last contact (when in database mode), then append the outbound message locally. */
  sendMessage: (leadId: string, body: string) => Promise<boolean>;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  const dataSourceRef = useRef<DataSource>(state.dataSource);
  useEffect(() => {
    dataSourceRef.current = state.dataSource;
  }, [state.dataSource]);

  // Simulate the initial data fetch so loading skeletons are observable.
  useEffect(() => {
    const timer = window.setTimeout(() => dispatch({ type: "loaded" }), 850);
    return () => window.clearTimeout(timer);
  }, []);

  const pushToast = useCallback((tone: Toast["tone"], title: string, detail?: string) => {
    dispatch({ type: "toast-push", toast: { id: nextId("toast"), tone, title, detail } });
  }, []);

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: "toast-dismiss", id });
  }, []);

  const connectStarted = useRef(false);

  /**
   * Attempt to connect to Supabase and, if configured and reachable, replace
   * the demo dataset with real rows. Fails gracefully back to demo mode.
   */
  const connect = useCallback(async (force = false) => {
    if (!force && connectStarted.current) return;
    connectStarted.current = true;

    if (!isSupabaseConfigured()) {
      const reason = getSupabaseConfigError()?.message ?? "Supabase is not configured.";
      if (import.meta.env.DEV) {
        console.warn("[crm:supabase]", { configured: false, querySkipped: true, reason });
      }
      dispatch({ type: "connection-skip", error: reason });
      return;
    }

    try {
      getSupabaseClient(); // throws a clear error when the URL/key are invalid
    } catch (error) {
      const message = describeError(error);
      if (import.meta.env.DEV) {
        console.warn("[crm:supabase]", { configured: true, clientInit: "failed", error: message });
      }
      dispatch({ type: "connection-skip", error: message });
      return;
    }

    dispatch({ type: "connection-start" });
    try {
      const leads = await getLeads(500);
      if (import.meta.env.DEV) {
        console.info("[crm:supabase]", { configured: true, querySucceeded: true, rowCount: leads.length });
        if (leads.length === 0) {
          console.warn(
            "[crm:supabase] Query succeeded but returned 0 rows. If the dashboard Table Editor " +
              "shows rows, the anon (publishable) role is almost certainly blocked by Row Level " +
              "Security — review pg_policies for public.leads and grant anon SELECT (see " +
              "supabase/migrations/004_rls_demo_readonly.sql).",
          );
        }
      }
      const mapped = leads.map((lead) => {
        const campaignId = resolveCampaignId(lead.campaignRawName, CAMPAIGNS);
        // The database may store the employee name rather than the id; resolve
        // to the id so filters, the sheet dropdown and bulk assignment work the
        // same for both storage styles.
        const assignedEmployeeId = normalizeAssignee(lead.assignedEmployeeId);
        return { ...lead, campaignId: campaignId ?? lead.campaignId, assignedEmployeeId };
      });
      dispatch({ type: "connection-ok", leads: mapped });
    } catch (error) {
      const message = describeError(error);
      if (import.meta.env.DEV) {
        console.warn("[crm:supabase]", { configured: true, querySucceeded: false, error: message });
      }
      dispatch({ type: "connection-fail", error: message });
    }
  }, []);

  useEffect(() => {
    void connect();
  }, [connect]);

  const retryConnection = useCallback(() => connect(true), [connect]);

  /* ---------------- Persistent mutations ---------------- */

  const setLeadStatus = useCallback(
    async (leadId: string, status: LeadStatus): Promise<boolean> => {
      if (dataSourceRef.current !== "database") {
        dispatch({ type: "set-status", leadId, status });
        return true;
      }
      try {
        await updateLeadStatus(leadId, status);
        dispatch({ type: "set-status", leadId, status });
        pushToast(
          "success",
          "Status saved",
          `Moved to ${LEAD_STATUS_META[status].label} and saved to Supabase.`,
        );
        return true;
      } catch (error) {
        pushToast("error", "Status not saved", describeError(error));
        return false;
      }
    },
    [pushToast],
  );

  const assignLead = useCallback(
    async (leadId: string, employeeId: string | null): Promise<boolean> => {
      if (dataSourceRef.current !== "database") {
        dispatch({ type: "assign", leadId, employeeId });
        return true;
      }
      try {
        await updateLead(leadId, { assigned_to: employeeId });
        dispatch({ type: "assign", leadId, employeeId });
        pushToast(
          "success",
          "Assignment saved",
          employeeId ? "Saved to Supabase." : "Lead unassigned and saved to Supabase.",
        );
        return true;
      } catch (error) {
        pushToast("error", "Assignment not saved", describeError(error));
        return false;
      }
    },
    [pushToast],
  );

  const sendMessage = useCallback(
    async (leadId: string, body: string): Promise<boolean> => {
      if (dataSourceRef.current !== "database") {
        dispatch({ type: "send-message", leadId, body });
        return true;
      }
      try {
        await updateLead(leadId, { last_contact_at: new Date().toISOString() });
        dispatch({ type: "send-message", leadId, body });
        return true;
      } catch (error) {
        pushToast("error", "Reply not saved", describeError(error));
        return false;
      }
    },
    [pushToast],
  );

  /* ---------------- Selectors ---------------- */

  const leadById = useCallback(
    (id: string | null | undefined) => state.leads.find((lead) => lead.id === id),
    [state.leads],
  );

  const employeeName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return "";
      const byId = state.employees.find((employee) => employee.id === id);
      if (byId) return byId.name;
      // assigned_to in the database may store the employee *name* rather than
      // the id; resolve it so the UUID rows still render a friendly name.
      const byName = state.employees.find(
        (employee) => employee.name.toLowerCase() === String(id).toLowerCase(),
      );
      return byName?.name ?? "Unknown";
    },
    [state.employees],
  );

  const campaignName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return "";
      return state.campaigns.find((campaign) => campaign.id === id)?.name ?? "Unknown";
    },
    [state.campaigns],
  );

  const campaignNameOfLead = useCallback(
    (lead: Pick<Lead, "campaignId" | "campaignRawName">) => {
      if (lead.campaignRawName) return lead.campaignRawName;
      const campaign = lead.campaignId
        ? state.campaigns.find((item) => item.id === lead.campaignId)
        : undefined;
      return campaign?.name ?? "";
    },
    [state.campaigns],
  );

  const followUpsFor = useCallback(
    (leadId: string) => state.followUps.filter((item) => item.leadId === leadId),
    [state.followUps],
  );

  const value = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      isAdmin: state.role === "admin",
      leadById,
      employeeName,
      campaignName,
      campaignNameOfLead,
      followUpsFor,
      dataSource: state.dataSource,
      connection: state.connection,
      retryConnection,
      setLeadStatus,
      assignLead,
      sendMessage,
      toasts: state.toasts,
      dismissToast,
    }),
    [
      state,
      leadById,
      employeeName,
      campaignName,
      campaignNameOfLead,
      followUpsFor,
      retryConnection,
      setLeadStatus,
      assignLead,
      sendMessage,
      dismissToast,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within <StoreProvider>");
  return value;
}