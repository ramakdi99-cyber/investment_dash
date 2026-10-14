import type {
  ActivityEvent,
  BudgetBandId,
  Campaign,
  ChatMessage,
  CrmDataset,
  Employee,
  FollowUp,
  InvestmentGoal,
  Lead,
  LeadStatus,
  Note,
  QualificationAnswer,
} from "@/data/types";
import { BUDGET_BAND_BY_ID, GOAL_LABELS } from "@/lib/domain";

/**
 * Seed data.
 *
 * The 20 records below are transcribed verbatim from the provided dataset
 * ("react_dashboard_20_mock_leads.pdf"): same ids, names, masked contacts,
 * campaigns, goals, budget ranges, statuses, assignees and timestamps.
 * Everything else (message threads, notes, follow-ups, the activity feed) is
 * derived deterministically from those records so the app feels alive without
 * contradicting the source data.
 */

const EXEC_01 = "emp_aarav";
const EXEC_02 = "emp_priya";
const EXEC_03 = "emp_rohan";

export const EMPLOYEES: Employee[] = [
  { id: EXEC_01, name: "Aarav Sharma", jobTitle: "Sales Executive", email: "aarav@cobalt.in", capacity: 8 },
  { id: EXEC_02, name: "Priya Nair", jobTitle: "Sales Executive", email: "priya@cobalt.in", capacity: 8 },
  { id: EXEC_03, name: "Rohan Deshmukh", jobTitle: "Sales Executive", email: "rohan@cobalt.in", capacity: 8 },
  { id: "emp_meera", name: "Meera Iyer", jobTitle: "Team Lead", email: "meera@cobalt.in", capacity: 12 },
  { id: "emp_ananya", name: "Ananya Rao", jobTitle: "Associate", email: "ananya@cobalt.in", capacity: 6 },
];

export const USERS: CrmDataset["users"] = {
  admin: { id: "emp_meera", name: "Meera Iyer", role: "admin", email: "meera@cobalt.in" },
  agent: { id: EXEC_03, name: "Rohan Deshmukh", role: "agent", email: "rohan@cobalt.in" },
};

export const CAMPAIGNS: Campaign[] = [
  { id: "cmp_sip", name: "SIP Basics Reel", channel: "instagram", startedAt: "2026-09-24T09:00:00.000Z", spend: 48_200 },
  { id: "cmp_retire", name: "Retirement Planning", channel: "instagram", startedAt: "2026-09-22T09:00:00.000Z", spend: 60_400 },
  { id: "cmp_beginner", name: "Beginner Guide Story", channel: "facebook", startedAt: "2026-09-20T09:00:00.000Z", spend: 31_800 },
  { id: "cmp_child", name: "Child Education Carousel", channel: "facebook", startedAt: "2026-09-18T09:00:00.000Z", spend: 44_600 },
  { id: "cmp_fd", name: "FD vs Mutual Funds", channel: "facebook", startedAt: "2026-09-17T09:00:00.000Z", spend: 39_100 },
];

/**
 * One row per source record. Column order follows the source PDF:
 * id, name, contact (masked), source, campaign, goal, budget, horizon,
 * risk comfort, experience, status, assigned, created, last contact, message.
 */
const LEAD_ROWS: {
  id: string;
  name: string;
  contact: string;
  source: "instagram" | "facebook";
  campaignId: string;
  goal: InvestmentGoal;
  budget: BudgetBandId | "Not decided";
  horizon: string;
  risk: string;
  experience: string;
  status: LeadStatus;
  assignee: string;
  created: string;
  lastContact: string | null;
  message: string;
}[] = [
  { id: "LEAD-1001", name: "Arun Kumar", contact: "+91 98XXXXXX10", source: "instagram", campaignId: "cmp_sip", goal: "long-term-savings", budget: "5k-10k", horizon: "10+ years", risk: "Some fluctuations", experience: "Beginner", status: "qualified", assignee: EXEC_01, created: "2026-10-11", lastContact: "2026-10-11", message: "I'd like to learn how a monthly SIP works." },
  { id: "LEAD-1002", name: "Priya S", contact: "+91 97XXXXXX21", source: "facebook", campaignId: "cmp_retire", goal: "retirement", budget: "10k-20k", horizon: "15–20 years", risk: "Moderate fluctuations", experience: "Beginner", status: "new", assignee: "", created: "2026-10-11", lastContact: null, message: "I want to explore mutual funds for retirement." },
  { id: "LEAD-1003", name: "Karthik R", contact: "+91 96XXXXXX32", source: "instagram", campaignId: "cmp_beginner", goal: "learn-basics", budget: "under-1k", horizon: "5–10 years", risk: "Not sure", experience: "No experience", status: "contacted", assignee: EXEC_02, created: "2026-10-10", lastContact: "2026-10-11", message: "I'm new to mutual funds. Where should I start?" },
  { id: "LEAD-1004", name: "Meena Lakshmi", contact: "+91 95XXXXXX43", source: "facebook", campaignId: "cmp_child", goal: "child-education", budget: "5k-10k", horizon: "8–12 years", risk: "Lower fluctuations preferred", experience: "Some experience", status: "follow-up", assignee: EXEC_01, created: "2026-10-10", lastContact: "2026-10-10", message: "I want to plan for my child's education." },
  { id: "LEAD-1005", name: "Vijay Anand", contact: "+91 94XXXXXX54", source: "instagram", campaignId: "cmp_sip", goal: "monthly-sip", budget: "1k-5k", horizon: "3–5 years", risk: "Some fluctuations", experience: "Some experience", status: "qualified", assignee: EXEC_03, created: "2026-10-10", lastContact: "2026-10-11", message: "Can you explain how SIP investing works?" },
  { id: "LEAD-1006", name: "Divya M", contact: "+91 93XXXXXX65", source: "facebook", campaignId: "cmp_fd", goal: "compare-options", budget: "5k-10k", horizon: "1–3 years", risk: "Lower fluctuations preferred", experience: "Beginner", status: "new", assignee: "", created: "2026-10-10", lastContact: null, message: "Can you compare mutual funds with FDs?" },
  { id: "LEAD-1007", name: "Suresh Babu", contact: "+91 92XXXXXX76", source: "instagram", campaignId: "cmp_retire", goal: "retirement", budget: "20k-30k", horizon: "20+ years", risk: "Some fluctuations", experience: "Experienced", status: "contacted", assignee: EXEC_02, created: "2026-10-09", lastContact: "2026-10-10", message: "I want to understand long-term retirement options." },
  { id: "LEAD-1008", name: "Nandhini P", contact: "+91 91XXXXXX87", source: "facebook", campaignId: "cmp_beginner", goal: "learn-basics", budget: "Not decided", horizon: "Not sure", risk: "Not sure", experience: "No experience", status: "new", assignee: "", created: "2026-10-09", lastContact: null, message: "I'd like to understand mutual funds before deciding." },
  { id: "LEAD-1009", name: "Mohammed Faisal", contact: "+91 90XXXXXX98", source: "instagram", campaignId: "cmp_sip", goal: "monthly-sip", budget: "1k-5k", horizon: "5–10 years", risk: "Moderate fluctuations", experience: "Beginner", status: "follow-up", assignee: EXEC_03, created: "2026-10-09", lastContact: "2026-10-11", message: "I am considering a monthly SIP." },
  { id: "LEAD-1010", name: "Anitha R", contact: "+91 89XXXXXX09", source: "facebook", campaignId: "cmp_child", goal: "child-education", budget: "10k-20k", horizon: "10–15 years", risk: "Some fluctuations", experience: "Some experience", status: "qualified", assignee: EXEC_01, created: "2026-10-08", lastContact: "2026-10-10", message: "Can you explain options for education planning?" },
  { id: "LEAD-1011", name: "Prakash D", contact: "+91 88XXXXXX19", source: "instagram", campaignId: "cmp_fd", goal: "compare-options", budget: "20k-30k", horizon: "3–5 years", risk: "Lower fluctuations preferred", experience: "Experienced", status: "contacted", assignee: EXEC_02, created: "2026-10-08", lastContact: "2026-10-09", message: "I'd like to compare different savings options." },
  { id: "LEAD-1012", name: "Kavitha S", contact: "+91 87XXXXXX29", source: "facebook", campaignId: "cmp_beginner", goal: "learn-basics", budget: "under-1k", horizon: "1–3 years", risk: "Not sure", experience: "Beginner", status: "not-interested", assignee: EXEC_03, created: "2026-10-07", lastContact: "2026-10-08", message: "Please share basic information about mutual funds." },
  { id: "LEAD-1013", name: "Ramesh Kumar", contact: "+91 86XXXXXX39", source: "instagram", campaignId: "cmp_retire", goal: "retirement", budget: "5k-10k", horizon: "10–15 years", risk: "Moderate fluctuations", experience: "Some experience", status: "qualified", assignee: EXEC_01, created: "2026-10-07", lastContact: "2026-10-11", message: "I'm planning for retirement and want to learn more." },
  { id: "LEAD-1014", name: "Sneha V", contact: "+91 85XXXXXX49", source: "instagram", campaignId: "cmp_sip", goal: "monthly-sip", budget: "10k-20k", horizon: "5–10 years", risk: "Some fluctuations", experience: "Beginner", status: "new", assignee: "", created: "2026-10-07", lastContact: null, message: "How do I begin a monthly SIP?" },
  { id: "LEAD-1015", name: "Bala Murugan", contact: "+91 84XXXXXX59", source: "instagram", campaignId: "cmp_child", goal: "child-education", budget: "1k-5k", horizon: "8–12 years", risk: "Not sure", experience: "Beginner", status: "follow-up", assignee: EXEC_02, created: "2026-10-06", lastContact: "2026-10-09", message: "I want to save for my child's future education." },
  { id: "LEAD-1016", name: "Harini K", contact: "+91 83XXXXXX69", source: "facebook", campaignId: "cmp_fd", goal: "compare-options", budget: "5k-10k", horizon: "1–3 years", risk: "Lower fluctuations preferred", experience: "Some experience", status: "new", assignee: "", created: "2026-10-06", lastContact: null, message: "What are the differences between FDs and mutual funds?" },
  { id: "LEAD-1017", name: "Gokul S", contact: "+91 82XXXXXX79", source: "instagram", campaignId: "cmp_sip", goal: "monthly-sip", budget: "20k-30k", horizon: "10+ years", risk: "Significant fluctuations acceptable", experience: "Experienced", status: "converted", assignee: EXEC_03, created: "2026-10-05", lastContact: "2026-10-07", message: "I already invest and want to review my options." },
  { id: "LEAD-1018", name: "Revathi M", contact: "+91 81XXXXXX89", source: "facebook", campaignId: "cmp_beginner", goal: "learn-basics", budget: "1k-5k", horizon: "5–10 years", risk: "Some fluctuations", experience: "Beginner", status: "contacted", assignee: EXEC_01, created: "2026-10-05", lastContact: "2026-10-10", message: "Can someone explain the basics to me?" },
  { id: "LEAD-1019", name: "Dinesh P", contact: "+91 80XXXXXX99", source: "instagram", campaignId: "cmp_retire", goal: "retirement", budget: "10k-20k", horizon: "15–20 years", risk: "Moderate fluctuations", experience: "Some experience", status: "follow-up", assignee: EXEC_02, created: "2026-10-04", lastContact: "2026-10-11", message: "I'd like to discuss planning for retirement." },
  { id: "LEAD-1020", name: "Janani T", contact: "+91 79XXXXXX08", source: "facebook", campaignId: "cmp_sip", goal: "monthly-sip", budget: "Not decided", horizon: "Not sure", risk: "Not sure", experience: "No experience", status: "new", assignee: "", created: "2026-10-03", lastContact: null, message: "I want to learn about mutual funds and SIPs." },
];

const OUTBOUND_REPLIES: string[] = [
  "Thanks for reaching out — sharing our current SIP options now.",
  "Happy to help. Could you confirm your monthly budget so I can shortlist funds?",
  "Noted. For that horizon, a balanced hybrid fund might fit well.",
  "I've added you to our advisor call list for this week.",
  "Sending the one-pager on WhatsApp. Let me know if you'd like a call.",
  "Would tomorrow 11am work for a quick call?",
  "The minimum SIP here is ₹500 — happy to start you this week.",
];

const INBOUND_REPLIES: string[] = [
  "Thanks, please send the details.",
  "Can you share the expense ratio?",
  "What's the minimum lock-in period?",
  "Let me discuss with my family and revert.",
  "Sounds good. What's the KYC process?",
  "I'll call you next week.",
  "Sorry, been busy. Still interested.",
];

const DECLINES = [
  "Sorry, we've decided to go with our bank for now.",
  "This is above what I planned. Please remove me from the list.",
  "Not interested at the moment, thanks.",
];

/** Pick a clock time for the created row: 09:00–18:30, deterministic per row. */
function createdTime(index: number) {
  const hour = 9 + ((index * 5) % 10);
  const minute = (index * 13) % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function minutesBetween(a: Date, b: Date) {
  return Math.max(30, Math.floor((b.getTime() - a.getTime()) / 60_000));
}

function buildMessages(lead: Lead, created: Date, lastContact: Date | null) {
  const thread: ChatMessage[] = [
    {
      id: `${lead.id}_m0`,
      leadId: lead.id,
      direction: "inbound",
      body: lead.firstMessage,
      at: created.toISOString(),
    },
  ];

  if (!lastContact || lead.status === "new") return thread;

  const spanMinutes = minutesBetween(created, lastContact);
  const turns =
    lead.status === "not-interested"
      ? 2
      : Math.min(3, Math.max(2, Math.floor(spanMinutes / 720)));

  // Spread the exchange evenly across the created→last-contact span, leaving a
  // 15-minute reply gap at the end.
  const start = created.getTime() + 30 * 60_000;
  const end = Math.max(start + 45 * 60_000, lastContact.getTime() - 15 * 60_000);

  for (let i = 0; i < turns; i += 1) {
    const at = start + (end - start) * ((i + 1) / (turns + 1));
    thread.push({
      id: `${lead.id}_m${i * 2 + 1}`,
      leadId: lead.id,
      direction: "outbound",
      body:
        i === turns - 1 && lead.status === "follow-up"
          ? "Following up as promised. Are you still evaluating?"
          : OUTBOUND_REPLIES[i % OUTBOUND_REPLIES.length],
      at: new Date(at).toISOString(),
      ...(lead.assignedEmployeeId ? { authorId: lead.assignedEmployeeId } : {}),
    });

    if (i === turns - 1 && lead.status === "not-interested") {
      thread.push({
        id: `${lead.id}_m${i * 2 + 2}`,
        leadId: lead.id,
        direction: "inbound",
        body: DECLINES[i % DECLINES.length],
        at: lastContact.toISOString(),
      });
      break;
    }

    thread.push({
      id: `${lead.id}_m${i * 2 + 2}`,
      leadId: lead.id,
      direction: "inbound",
      body: INBOUND_REPLIES[i % INBOUND_REPLIES.length],
      at: new Date(Math.min(end, at + 25 * 60_000)).toISOString(),
    });
  }

  return thread;
}

function buildQualification(lead: Lead): QualificationAnswer[] {
  const answered = (question: string, answer: string | null): QualificationAnswer => ({ question, answer });
  return [
    answered("What is your primary goal?", GOAL_LABELS[lead.goal]),
    answered("Monthly budget range", lead.budgetBand ? BUDGET_BAND_BY_ID[lead.budgetBand].label : null),
    answered("Investment horizon", lead.timeHorizon),
    answered("Risk comfort", lead.riskComfort),
    answered("Experience level", lead.experience),
  ];
}

function createDataset(): CrmDataset {
  const leads: Lead[] = [];
  const messages: ChatMessage[] = [];
  const notes: Note[] = [];
  const followUps: FollowUp[] = [];
  const activity: ActivityEvent[] = [];
  const now = Date.now();

  LEAD_ROWS.forEach((row, index) => {
    const created = new Date(`${row.created}T${createdTime(index)}`);
    const lastContactDate = row.lastContact ? new Date(`${row.lastContact}T${createdTime(index + 3)}`) : null;

    const budget: BudgetBandId | null = row.budget === "Not decided" ? null : row.budget;

    const lead: Lead = {
      id: row.id,
      investorName: row.name,
      whatsapp: row.contact,
      contactId: row.id.toLowerCase().replace("-", "_"),
      firstMessage: row.message,
      goal: row.goal,
      budgetBand: budget,
      statedMonthlyInterest: budget ? BUDGET_BAND_BY_ID[budget].midpoint : null,
      status: row.status,
      assignedEmployeeId: row.assignee || null,
      campaignId: row.campaignId,
      campaignRawName: CAMPAIGNS.find((campaign) => campaign.id === row.campaignId)?.name ?? null,
      source: row.source,
      timeHorizon: row.horizon === "Not sure" ? null : row.horizon,
      riskComfort: row.risk === "Not sure" ? null : row.risk,
      experience: row.experience === "No experience" ? "Beginner (no prior investing)" : row.experience,
      createdAt: created.toISOString(),
      lastContactAt: lastContactDate?.toISOString() ?? null,
      qualification: [],
    };
    lead.qualification = buildQualification(lead);
    leads.push(lead);

    const thread = buildMessages(lead, created, lastContactDate);
    messages.push(...thread);

    if (row.status !== "new" && index % 3 !== 2) {
      notes.push({
        id: `${row.id}_n1`,
        leadId: row.id,
        authorId: row.assignee || EXEC_01,
        body:
          index % 2 === 0
            ? "Prefers WhatsApp over calls. Budget is a soft number — asking for a small trial SIP first."
            : "Decision maker may be a family member; keep the explanation jargon-free.",
        at: new Date((lastContactDate ?? created).getTime() + 40 * 60_000).toISOString(),
      });
    }

    if (row.status === "follow-up") {
      followUps.push({
        id: `${row.id}_fu1`,
        leadId: row.id,
        summary: "Send fund shortlist and confirm trial SIP amount",
        channel: index % 2 === 0 ? "whatsapp" : "call",
        ownerId: row.assignee || EXEC_01,
        dueAt: new Date(now + (index % 3 === 0 ? -2 : 26) * 3_600_000).toISOString(),
      });
    } else if (row.status === "qualified") {
      followUps.push({
        id: `${row.id}_fu1`,
        leadId: row.id,
        summary: "Share KYC checklist and schedule onboarding call",
        channel: "call",
        ownerId: row.assignee || EXEC_01,
        dueAt: new Date(now + (index % 4 === 0 ? -18 : 52) * 3_600_000).toISOString(),
      });
    } else if (row.status === "converted") {
      followUps.push({
        id: `${row.id}_fu1`,
        leadId: row.id,
        summary: "Submit SIP application and first payment proof",
        channel: "meeting",
        ownerId: row.assignee || EXEC_01,
        dueAt: new Date((lastContactDate ?? created).getTime() + 20 * 3_600_000).toISOString(),
        completedAt: new Date((lastContactDate ?? created).getTime() + 18 * 3_600_000).toISOString(),
      });
    }

    activity.push({
      id: `${row.id}_ev1`,
      kind: "lead-created",
      leadId: row.id,
      actorId: null,
      summary: row.assignee ? "Lead assigned and first reply drafted" : "New inbound WhatsApp lead",
      at: created.toISOString(),
    });
    if (row.status !== "new") {
      activity.push({
        id: `${row.id}_ev2`,
        kind: "status-changed",
        leadId: row.id,
        actorId: row.assignee || null,
        summary: `Moved to ${row.status.replace("-", " ")}`,
        at: (lastContactDate ?? created).toISOString(),
      });
    }
  });

  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    employees: EMPLOYEES,
    campaigns: CAMPAIGNS,
    leads,
    messages,
    notes,
    followUps,
    activity,
    users: USERS,
  };
}

export const DEMO_DATASET = createDataset();