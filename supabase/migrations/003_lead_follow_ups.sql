-- ============================================================================
-- MIGRATION 003 — follow-up tasks
-- ============================================================================
-- Not created automatically. The UI's Follow-ups tab keeps tasks in the browser
-- session until you run this migration, then a follow-up wiring step can point
-- the store's follow-up actions at this table.
--
-- How to run (choose one):
--   1. Supabase Dashboard -> SQL Editor -> paste this file -> Run.
--   2. supabase db push   (if you use the Supabase CLI with linked migrations)
-- ============================================================================

create table if not exists public.lead_follow_ups (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references public.leads(id) on delete cascade,
  summary        text not null,
  channel        text not null default 'whatsapp'
                 check (channel in ('call', 'whatsapp', 'email', 'meeting')),
  owner_user_id  uuid,
  owner_name     text,
  due_at         timestamptz not null,
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- Fast lookup of a lead's timeline and of every open, due task.
create index if not exists lead_follow_ups_lead_id_idx
  on public.lead_follow_ups (lead_id, due_at);
create index if not exists lead_follow_ups_open_idx
  on public.lead_follow_ups (due_at)
  where completed_at is null;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Enabled with no policies for the same reason as migration 002: follow-ups
-- must not be exposed through the anonymous demo key.
alter table public.lead_follow_ups enable row level security;
