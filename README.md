# Cobalt CRM — Investment-Lead Admin Dashboard

A single-page React dashboard for managing WhatsApp click-to-chat **mutual fund**
leads: capture, qualify, assign, chase and report on investors from one calm screen.

Built with React 18 + TypeScript + Vite + Tailwind CSS v3. Bootstrap-style
(shadcn/ui-inspired) components, hand-rolled — zero generator scaffolding, no
routing/chart/drag libraries.

Leads can load from **Supabase** (`public.leads`) or fall back to the bundled
**20-lead demo dataset** when Supabase is not configured or unreachable.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then paste your Supabase URL + publishable key
npm run dev                  # http://localhost:5173
```

Production build + typecheck:

```bash
npm run build      # tsc -b && vite build
npm run preview
npx tsc -b         # typecheck only
```

> Requires Node 18+ (developed on Node 24 / npm 11).
>
> **No `.env.local`? The app still runs** — it shows the 20 fictional demo leads
> with a "Demo mode" banner. Configure Supabase to switch to live data.

## Connecting Supabase

1. Create `.env.local` from `.env.example` and fill in two variables:

   ```ini
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Use the **publishable (anon)** key only. **Never** put the `service_role`
   key here — every `VITE_` variable is compiled into the public browser bundle.
   `.env.local` is git-ignored.

2. Run the schema + demo RLS policies so the anonymous demo key can read and
   update leads:

   ```text
   Supabase Dashboard → SQL Editor → paste supabase/sql/schema.sql → Run
   ```

   That is the one file to start with: it is idempotent (safe to re-run, never
   drops data) and includes a **DEMO-ONLY** RLS section granting the `anon`
   role `SELECT` and an `UPDATE` limited to four columns (`status`,
   `assigned_to`, `last_contact_at`, `updated_at`). No `INSERT`/`DELETE` are
   granted, and the file ships with a "remove before production" block.

3. (Optional) Seed the 20 fictional leads:

   ```text
   Supabase Dashboard → SQL Editor → paste supabase/sql/seed_demo_leads.sql → Run
   ```

   Safe to re-run (`on conflict (whatsapp_id) do nothing`). Nothing is inserted
   automatically — you choose when to run it.

4. Restart `npm run dev`. The banner turns into **“Live — leads are loading from
   Supabase.”**

### What persists to Supabase

| Action | Persists? |
| --- | --- |
| Load leads | ✅ `SELECT` on `public.leads` on startup, plus retry from the banner |
| Change status (table, sheet, pipeline drag, bulk) | ✅ `UPDATE status` — the UI only changes after the write succeeds |
| Assign / unassign (sheet, bulk) | ✅ `UPDATE assigned_to` |
| Send a reply from the chat thread | ✅ `UPDATE last_contact_at`; the message body stays in the session |
| Internal notes, chat messages, follow-up tasks, activity feed | ⚠️ Session-only in database mode (see below) |
| Create / delete leads | Not in the UI; `createLead` exists in the service for a future "add lead" form |

**Notes, chat bodies and follow-ups are not stored in the database yet.** Those
tables don't exist. Rather than pretend they persist, the UI keeps them in memory
and labels the affected tabs "Session-only" when live data is loaded. Migrations
`002_lead_notes.sql` and `003_lead_follow_ups.sql` create the tables; wiring the
store to them is a deliberate follow-up step once the schema is reviewed.

### Graceful behaviour

- **Not configured** → demo dataset + a slim "Demo mode" strip that names the two
  variables to set. No crash, no error.
- **Configured but unreachable** → demo dataset + an amber banner with the
  reason and a **Retry** button.
- **Writes fail** (e.g. RLS blocks it) → an **error toast**; state is **not**
  updated and no success message is shown. Raw database errors are never
  surfaced — `describeError()` maps error codes to friendly text.

### Value handling

The database columns are plain `text`, and the mapper tolerates both canonical
keys and human labels:

- `status` — saves/reads upper-case (`NEW`, `CONTACTED`, `QUALIFIED`,
  `FOLLOW_UP`, `CONVERTED`, `NOT_INTERESTED`), accepting `"Follow-up"` etc.
- `investment_goal` — canonical key (`retirement`) or label.
- `monthly_budget_range` — band id (`5k-10k`, `not-decided`) or a free-text
  range (`₹5,000 – ₹10,000`); the parse is best-effort and never throws.
- `source` / `campaign_name` / `assigned_to` — human labels. `assigned_to`
  resolves against an employee **id or name**, so name-only rows render
  correctly. `campaign_name` is matched back to a known campaign
  case-insensitively and the raw text is preserved on the lead.

Only the 18 columns listed in `001_leads_reference.sql` are touched; no schema is
changed automatically and no extra columns are assumed.

## The five areas

| Area | Route | What it does |
| --- | --- | --- |
| **Overview** (`/` or `?view=dashboard`) | Metric cards (total, new today, qualified, follow-ups pending, converted, stated monthly interest in INR), a 14-day received-vs-converted trend chart, leads-by-stage breakdown, campaign cost-per-lead, recent activity feed. |
| **Leads** (`?view=leads`) | Sortable/filterable register: investor, masked WhatsApp, first message (truncated, full text on hover), goal, budget, status badge, assignee, last contact. Row selection + bulk assign / bulk status, and pagination once the result set exceeds 25 rows. |
| **Profile sheet** (`?view=leads&lead=<id>`) | Slides in from the right: threaded chat with quick reply, qualification Q&A, internal notes (add-note), follow-up timeline (schedule / complete), status + assignee quick actions. |
| **Pipeline** (`?view=pipeline`) | Six kanban columns (New → Contacted → Qualified → Follow-up → Converted → Not Interested) with drag-and-drop (native HTML5 DnD), arrow-key movement, per-column counts and empty drops. Moves persist in database mode. |
| **Search & reports** (`?view=reports`) | The same filter set combined, mirrored in the URL, results table, and a **CSV export gated by role** — agents see it disabled with an explanation; the demo role switcher (top bar, command palette, and the reports header) flips the gate live. |

Filters (`status`, `campaign`, `goal`, `budget`, `employee`, `from`, `to`, `q`)
live in the real query string, so a result set can be copied, bookmarked and
reopened. `Ctrl/⌘ + K` opens the global command palette.

> The role switcher is a **UI demo of the export gate, not a security boundary.**
> Real authorization belongs in Supabase RLS policies, not in the client.

## Data

`src/data/seed.ts` transcribes the **20 fictional records** (same LEAD ids,
masked contacts, campaigns, goals, budget ranges, horizons, risk comfort,
experience, statuses, assignees and timestamps). Message threads, notes,
follow-ups and the activity feed are derived deterministically from those
records with a seeded PRNG, so the app feels alive without contradicting the
source data. `supabase/sql/seed_demo_leads.sql` writes the same 20 leads to
Supabase for end-to-end testing.

- **Currency:** Indian Rupee, `en-IN` grouping (`₹1,25,000`) — see `CURRENCY`
  in `src/lib/format.ts` for a one-line switch.
- **Missing data** is rendered consistently: "Not provided" in tables, "—" in
  metrics. "Not decided yet" is a *real* budget value (the lead said so), kept
  distinct from "never captured".
- Status mix: 6 New · 4 Contacted · 4 Qualified · 4 Follow-up · 1 Converted ·
  1 Not Interested.

## Supabase architecture

```
src/
├─ lib/supabase.ts          # env validation + lazy client (publishable key only)
├─ services/
│  ├─ db-mapper.ts          # snake_case ⇄ camelCase, tolerant value parsing
│  └─ leadService.ts        # getLeads / getLeadById / searchLeads /
│                           #   createLead / updateLead / updateLeadStatus
└─ state/store.tsx          # connection lifecycle + persistence wrappers
supabase/
├─ config.toml              # optional CLI config
├─ migrations/
│  ├─ 001_leads_reference.sql      # reference DDL for a fresh project
│  ├─ 002_lead_notes.sql           # internal notes table (not yet wired)
│  ├─ 003_lead_follow_ups.sql      # follow-up tasks table (not yet wired)
│  └─ 004_rls_demo_readonly.sql    # DEMO ONLY anonymous read/update
├─ sql/schema.sql           # consolidated idempotent schema + DEMO-ONLY RLS
├─ sql/seed_demo_leads.sql  # the 20 fictional leads (opt-in)
└─ functions/aisensy-webhook/index.ts  # scaffold only (returns 501)
```

- The **UI never touches the database directly** — components call the store,
  which calls `leadService`. All queries are parameterised by supabase-js /
  PostgREST; user input is never interpolated into SQL.
- **Duplicate submissions** are prevented: in-flight writes go through the store,
  and `createLead` checks the unique `whatsapp_id` first, translating a
  unique-constraint error into a friendly message as a backstop.

### Migration safety

- **Nothing is executed for you.** Every SQL file is run manually from the
  Supabase SQL Editor (or `supabase db push`).
- `001_leads_reference.sql` is reference-only and uses `IF NOT EXISTS`
  throughout; your project already has `public.leads`.
- `002`/`003` create new tables and enable RLS **without** policies, so the new
  data is not exposed to the anonymous key.
- `sql/schema.sql` is the **consolidated** setup file (schema + indexes + RLS)
  and is the recommended single file to run. Its RLS section is equivalent to
  `004` and is isolated, named DEMO ONLY, explains the risk, and ships with a
  removal block.

## AiSensy WhatsApp (planned — not connected)

Nothing here talks to AiSensy yet, and no endpoint or payload shape is assumed.
The reply box is UI-only. The integration is scoped as:

1. An AiSensy webhook → `supabase/functions/aisensy-webhook` (Edge Function).
   The scaffold currently returns **HTTP 501** on purpose.
2. Secrets (`AISENSY_API_KEY`, `AISENSY_WEBHOOK_SECRET`) live as **Edge Function
   secrets**, never in `.env.local` or any `VITE_` variable.
3. A future migration adds a chat-thread table; the webhook appends inbound
   messages and refreshes `leads.last_contact_at`.
4. Signature verification and the real inbound payload are **to be confirmed**
   against AiSensy's docs before any code is written — see the TODOs in the
   function file.

```bash
supabase secrets set AISENSY_API_KEY=... AISENSY_WEBHOOK_SECRET=...
supabase functions deploy aisensy-webhook
```

## File structure

```
lead-crm/
├─ .env.example                 # VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
├─ index.html                   # entry HTML (Inter font)
├─ vite.config.ts               # @ alias, dev server
├─ tailwind.config.js           # cobalt/ink palette, shadows, animations
├─ src/
│  ├─ main.tsx / App.tsx        # bootstrap; StoreProvider + AppShell + palette + toaster
│  ├─ index.css                 # global tokens, skeletons, focus rings
│  ├─ data/
│  │  ├─ types.ts               # Lead, Campaign, Employee, messages, notes…
│  │  └─ seed.ts                # the 20 demo leads + derived demo records
│  ├─ services/                 # Supabase data access (see above)
│  ├─ state/store.tsx           # reducer + context + connection lifecycle
│  ├─ lib/
│  │  ├─ supabase.ts            # env validation + lazy client
│  │  ├─ router.ts              # tiny pushState router (view + query params)
│  │  ├─ url-filters.ts         # one source of truth for the filter set
│  │  ├─ filters.ts             # pure apply/sort helpers
│  │  ├─ domain.ts              # status/goal/budget/channel/role metadata
│  │  ├─ format.ts              # INR + relative-date formatting
│  │  ├─ csv.ts                 # CSV builder + download (BOM for Excel)
│  │  └─ utils.ts               # cn(), initialsOf(), uid()
│  ├─ components/
│  │  ├─ ui/                    # shadcn-style primitives (button, card, sheet…)
│  │  ├─ layout/                # sidebar + top bar (role switcher lives here)
│  │  ├─ leads/                 # table, profile sheet (chat/qualification/…)
│  │  ├─ dashboard/             # metric card, trend chart, activity list
│  │  ├─ toaster.tsx            # success/error notifications
│  │  ├─ connection-banner.tsx  # demo / connecting / live / failed strip
│  │  └─ …                      # filter-bar, page-header, status-badge, palette
│  └─ views/                    # dashboard / leads / pipeline / reports views
└─ supabase/                    # migrations, seed SQL, edge function
```

## Dependencies

**Runtime** — `react@18.3`, `react-dom@18.3`, `@supabase/supabase-js@2.45`,
Radix primitives (`@radix-ui/react-{avatar,checkbox,dialog,dropdown-menu,label,
popover,scroll-area,select,separator,slot,switch,tabs,tooltip}`),
`class-variance-authority@0.7`, `clsx@2.1`, `tailwind-merge@2.5`,
`lucide-react@0.454`, `cmdk@1.0`.

**Dev** — `typescript@5.6`, `vite@5.4`, `@vitejs/plugin-react@4.3`,
`tailwindcss@3.4`, `tailwindcss-animate@1.0`, `autoprefixer@10.4`,
`postcss@8.4`, `@types/node@22`, `@types/react@18.3`, `@types/react-dom@18.3`.

## Verifying the Supabase integration

1. `npx tsc -b` and `npm run build` — both should pass.
2. With `.env.local` unset: the dashboard loads the 20 demo leads and shows the
   **Demo mode** strip.
3. With `.env.local` set (and `004` applied): the strip becomes **Live —
   leads are loading from Supabase**. If `seed_demo_leads.sql` was run, the same
   20 leads appear.
4. Open a lead and change its **status** — reload the page; the new status
   persisted. Watch the Supabase table view to confirm.
5. Send a reply — `last_contact_at` updates in the database.
6. To see the failure path: remove the `UPDATE` policy from `004` (or run it
   without the grant) and change a status — an error toast appears and the UI
   does **not** claim success.

## Troubleshooting: dashboard shows 0 leads

The dev banner (and browser console, prefixed `[crm:supabase]`) reports
`configured`, `rows`, and a sanitized error. Diagnose in this order:

1. **Is the app reaching the right project?** `.env.local` must point at the
   same Supabase project whose Table Editor you are looking at (check the URL
   in the dashboard — it appears in `VITE_SUPABASE_URL`).
2. **Run the SQL count in the Dashboard → SQL Editor:**

   ```sql
   select count(*) from public.leads;
   ```

   If this is `> 0` but the app still shows 0 rows, continue.
3. **Inspect the policies** (Dashboard → Authentication → Policies, or):

   ```sql
   select tablename, policyname, roles, cmd, qual
   from pg_policies where tablename = 'leads';
   ```

   A `200` query that returns **zero rows** while `count(*)` is `> 0` means the
   `anon` role (which the publishable key uses) is blocked by row-level
   security — usually RLS enabled with no `SELECT` policy for `anon`. The fix
   is `supabase/sql/schema.sql` (its RLS section is equivalent to
   `supabase/migrations/004_rls_demo_readonly.sql`). It is **DEMO ONLY**: it
   grants `anon` `SELECT` plus a column-limited `UPDATE`, and must be replaced
   with per-user policies before real investor data is stored.

## Design decisions worth knowing

- **No router dependency** — four views + URL-synced filters fit a ~60-line
  `pushState`/`popstate` wrapper (`src/lib/router.ts`). Shareable query strings,
  real back/forward support, zero install weight.
- **No chart library** — the trend chart is a hand-rolled SVG area chart
  (`src/components/dashboard/trend-chart.tsx`) sized to its container.
- **No dnd-kit** — the kanban uses the native HTML5 Drag & Drop API plus
  arrow-key fallback movement for keyboard users.
- **Cobalt (#0047AB) is reserved** for the primary action button, active nav,
  status highlights and key metrics. Everything else is white/ink neutrals with
  hairline borders and soft shadows.
- **Permission demo** — export is admin-only. The role toggle (top-right user
  menu, reports header, command palette) re-evaluates the gate everywhere.
- Loading skeletons, empty states, and keyboard focus rings are applied
  consistently across all five areas. `prefers-reduced-motion` is honoured
  globally.

---

*All names, numbers and contacts are fictional placeholders for demo purposes —
not real investors.*
