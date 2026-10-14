import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Central Supabase client for the frontend.
 *
 * - Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
 * - The publishable (anon) key is the only key ever used in the browser. It is
 *   rendered harmless by Row Level Security: the app only works if the RLS
 *   policies in `supabase/migrations/` allow the anon role to read/update.
 * - No service-role key is imported anywhere in this codebase.
 */

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

/** True only when both required variables are present and non-empty. */
export function isSupabaseConfigured(): boolean {
  return Boolean(URL?.trim() && ANON_KEY?.trim());
}

/** Human-readable explanation of what is missing, or null when configured. */
export function getSupabaseConfigError(): SupabaseConfigError | null {
  if (URL?.trim() && ANON_KEY?.trim()) return null;
  const missing = [
    !URL?.trim() && "VITE_SUPABASE_URL",
    !ANON_KEY?.trim() && "VITE_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);
  return new SupabaseConfigError(
    `Supabase is not configured. Missing: ${missing.join(", ")}. ` +
      "Copy `.env.example` to `.env.local` and add your project URL and anon key " +
      "(Project Settings → API). The app is falling back to the local demo dataset.",
  );
}

let client: SupabaseClient | null = null;

/**
 * Lazily created singleton client. Throws a clear error when the environment
 * variables are missing so a misconfigured page fails loudly instead of
 * querying an empty URL.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw getSupabaseConfigError() ?? new SupabaseConfigError("Supabase is not configured.");
  }
  if (!client) {
    client = createClient(URL as string, ANON_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { "x-application-name": "cobalt-crm" },
      },
    });
  }
  return client;
}