/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Supabase project URL (https://<project-ref>.supabase.co).
   * Optional at build time: when absent the app runs on its demo dataset.
   */
  readonly VITE_SUPABASE_URL?: string;
  /**
   * Supabase publishable ("anon") key. This is safe to ship in the browser:
   * it is restricted by the Row Level Security policies on the tables.
   * Never put a service-role / secret key in VITE_* variables.
   */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}