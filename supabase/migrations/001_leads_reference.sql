-- ============================================================================
-- REFERENCE ONLY — run this ONLY in a fresh project that has no `leads` table.
-- ============================================================================
-- The consolidated, fully idempotent setup file is `supabase/sql/schema.sql`
-- — it includes this DDL plus the DEMO-ONLY RLS policies. This file documents
-- the shape the frontend expects; it uses IF NOT EXISTS everywhere so running
-- it against an existing table changes nothing.
--
-- Required columns (the mapper in src/services/db-mapper.ts mirrors this list):
--   id, name, phone, whatsapp_id, first_message, source, campaign_name, ad_id,
--   investment_goal, monthly_budget_range, time_horizon, risk_comfort,
--   experience, status, assigned_to, last_contact_at, created_at, updated_at
--
-- Text value conventions used by the seed + mapper (all acceptable inputs):
--   status                : NEW | CONTACTED | QUALIFIED | FOLLOW_UP | CONVERTED | NOT_INTERESTED
--   investment_goal       : long-term-savings | retirement | monthly-sip |
--                           child-education | compare-options | learn-basics
--   monthly_budget_range  : under-1k | 1k-5k | 5k-10k | 10k-20k | 20k-30k | not-decided
--                           (a free-text range such as '₹5,000 – ₹10,000' is also parsed)
--   source                : Instagram | Facebook | WhatsApp | Google Ads | Website | Referral
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

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

-- Keep updated_at current on writes (optional; the app also sends it explicitly).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Indexes used by the dashboard's filters and sorting.
create index if not exists leads_status_idx        on public.leads (status);
create index if not exists leads_created_at_idx    on public.leads (created_at desc);
create index if not exists leads_assigned_to_idx   on public.leads (assigned_to);
create index if not exists leads_campaign_name_idx on public.leads (campaign_name);
