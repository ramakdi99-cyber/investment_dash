-- ============================================================================
-- MIGRATION 004 — DEMO ONLY: anonymous access for the public demo
-- ============================================================================
--
--  ██████╗ ███████╗███╗   ███╗ ██████╗
--  ██╔══██╗██╔════╝████╗ ████║██╔═══██╗
--  ██║  ██║█████╗  ██╔████╔██║██║   ██║
--  ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║
--  ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝
--  ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝
--
--  DO NOT RUN THIS IN PRODUCTION.
--
-- ---------------------------------------------------------------------------
-- WHY THIS FILE EXISTS
-- ---------------------------------------------------------------------------
-- This project has no authentication yet, but the demo needs the browser (which
-- holds only the *publishable / anon* key) to read leads and to persist status
-- and assignee changes. That requires RLS policies that grant the `anon` role
-- those operations.
--
-- ---------------------------------------------------------------------------
-- THE RISK
-- ---------------------------------------------------------------------------
-- Anyone who has the publishable key — which is embedded in the shipped
-- JavaScript bundle — can perform every operation these policies allow. So the
-- policies below are intentionally the *minimum* needed for the demo:
--   * SELECT  on public.leads
--   * UPDATE  on four specific columns only (status, assigned_to,
--             last_contact_at, updated_at) via a column-level GRANT.
-- There is NO INSERT and NO DELETE. The demo never creates or removes leads
-- through the UI, so those are not granted.
--
-- This is fine for 20 fictional investor records. It is NOT acceptable for real
-- investor data. Before production:
--   1. Implement authentication (Supabase Auth / a server-side proxy).
--   2. Replace these policies with per-user policies.
--   3. Run the "REMOVE" block at the bottom of this file.
--
-- ---------------------------------------------------------------------------
-- HOW TO RUN
-- ---------------------------------------------------------------------------
-- Supabase Dashboard -> SQL Editor -> paste this file -> Run.
-- Or: supabase db push
-- ============================================================================

-- Read access for the anonymous demo.
alter table public.leads enable row level security;

drop policy if exists "demo_anon_read_leads" on public.leads;
create policy "demo_anon_read_leads"
  on public.leads
  for select
  to anon
  using (true);

-- Supabase grants the anon role table-level ALL on tables it creates, which
-- would let the demo update ANY column. Revoke the broad grants first, then
-- re-grant exactly the four columns the dashboard edits. (PostgREST UPDATE
-- only needs privileges on the columns a request actually sets.)
revoke update on public.leads from anon;
revoke insert, delete, truncate, references on public.leads from anon;

grant update (status, assigned_to, last_contact_at, updated_at)
  on public.leads to anon;

drop policy if exists "demo_anon_update_leads" on public.leads;
create policy "demo_anon_update_leads"
  on public.leads
  for update
  to anon
  using (true)
  with check (true);

-- ============================================================================
-- REMOVE BEFORE PRODUCTION
-- ============================================================================
-- Uncomment and run the following block to undo this migration, then implement
-- authenticated, per-user policies instead.
--
-- drop policy if exists "demo_anon_update_leads" on public.leads;
-- drop policy if exists "demo_anon_read_leads" on public.leads;
-- revoke update (status, assigned_to, last_contact_at, updated_at)
--   on public.leads from anon;
-- revoke select on public.leads from anon;
-- -- Optionally restore Supabase's broad default grants (needed if you later
-- -- re-create table-level access for the anon role):
-- -- grant all on table public.leads to anon, authenticated;
-- alter table public.leads disable row level security;  -- only if RLS wasn't previously on
-- ============================================================================
