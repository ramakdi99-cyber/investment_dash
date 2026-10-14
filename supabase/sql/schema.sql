-- ============================================================================
-- COBALT CRM — DATABASE SCHEMA (consolidated, idempotent, non-destructive)
-- ============================================================================
-- This is the single file to paste into the Supabase SQL Editor.
--
-- It is SAFE TO RE-RUN at any time:
--   * CREATE TABLE / CREATE INDEX use IF NOT EXISTS  -> never drops data
--   * policies use DROP POLICY IF EXISTS + CREATE     -> idempotent
--   * nothing here deletes, truncates, or disables RLS
--
-- What it does:
--   1. Ensures the `public.leads` table matches the schema the dashboard reads
--      (exactly the 18 columns your table already has).
--   2. Adds the indexes the dashboard's filters/sorting rely on.
--   3. Applies the DEMO-ONLY RLS section that lets the anon (publishable) key
--      read leads and update the four columns the dashboard edits.
--
-- WARNING: section 3 grants the anonymous key read+limited-update access.
-- That is acceptable ONLY for fictional/demo data. For real investor data,
-- replace section 3 with per-user policies + authentication, and run the
-- "REMOVE BEFORE PRODUCTION" block at the bottom of section 3.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extension (gen_random_uuid)
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Reference schema for public.leads
-- ----------------------------------------------------------------------------
-- Matches the table already present in the project; IF NOT EXISTS means this
-- is a no-op when the table exists (nothing is altered or dropped).
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  name                  text,
  phone                 text,
  whatsapp_id           text unique,
  first_message         text,
  source                text,
  campaign_name         text,
  ad_id                 text,
  investment_goal       text,
  monthly_budget_range  text,
  time_horizon          text,
  risk_comfort          text,
  experience            text,
  status                text not null default 'NEW',
  assigned_to           text,
  last_contact_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Keep updated_at current on writes. Idempotent: replaces only our own trigger,
-- never a pre-existing one with a different name.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Indexes used by the dashboard (status filters, date sort, campaign,
--    assignee filters)
-- ----------------------------------------------------------------------------
create index if not exists leads_status_idx        on public.leads (status);
create index if not exists leads_created_at_idx    on public.leads (created_at desc);
create index if not exists leads_assigned_to_idx   on public.leads (assigned_to);
create index if not exists leads_campaign_name_idx on public.leads (campaign_name);

-- ----------------------------------------------------------------------------
-- 3. DEMO-ONLY ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Read this before running. It grants the `anon` role (the browser's
-- publishable key) the minimum needed for the dashboard demo.
--
--   LET THE DEMO WORK:
--     SELECT on all rows
--     UPDATE restricted to status, assigned_to, last_contact_at, updated_at
--
--   INTENTIONALLY NOT GRANTED:
--     INSERT / DELETE / TRUNCATE / REFERENCES
--
-- The broad table-level UPDATE that Supabase grants by default is REVOKED
-- first, so the column-level grant actually constrains the anon role.
-- ----------------------------------------------------------------------------

alter table public.leads enable row level security;

-- Read access for the anonymous demo.
drop policy if exists "demo_anon_read_leads" on public.leads;
create policy "demo_anon_read_leads"
  on public.leads
  for select
  to anon
  using (true);

-- Remove the broad grants, then re-grant exactly the four updatable columns.
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
-- Uncomment and run the block below to undo section 3 once real per-user
-- policies and authentication are in place:
--
-- drop policy if exists "demo_anon_update_leads" on public.leads;
-- drop policy if exists "demo_anon_read_leads" on public.leads;
-- revoke update (status, assigned_to, last_contact_at, updated_at)
--   on public.leads from anon;
-- revoke select on public.leads from anon;
-- -- Optionally restore Supabase's broad default grants:
-- -- grant all on table public.leads to anon, authenticated;
-- alter table public.leads disable row level security;  -- only if RLS wasn't previously on
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (Optional) populate the 20 fictional demo leads:
--   run supabase/sql/seed_demo_leads.sql after this file.
-- ----------------------------------------------------------------------------