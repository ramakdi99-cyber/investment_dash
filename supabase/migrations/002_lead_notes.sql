-- ============================================================================
-- MIGRATION 002 — internal lead notes
-- ============================================================================
-- Not created automatically. The UI's Notes tab keeps notes in the browser
-- session until you run this migration, then a follow-up wiring step can point
-- the store's note actions at this table.
--
-- Notes are deliberately separate from investor chat messages: notes are
-- internal-only and must never be shown to the investor.
--
-- How to run (choose one):
--   1. Supabase Dashboard -> SQL Editor -> paste this file -> Run.
--   2. supabase db push   (if you use the Supabase CLI with linked migrations)
-- ============================================================================

create table if not exists public.lead_notes (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  -- No auth UI yet, so the author is stored both as an optional auth UUID and a
  -- display name captured from the demo role switcher.
  author_user_id  uuid,
  author_name     text,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists lead_notes_lead_id_idx
  on public.lead_notes (lead_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- RLS is enabled but NO policies are added here on purpose. Until an auth
-- mechanism exists, notes are not readable/writable by the anon key. Add
-- policies only alongside a real authentication story — see migration 004 for
-- the risks of granting the anon role write access.
alter table public.lead_notes enable row level security;
