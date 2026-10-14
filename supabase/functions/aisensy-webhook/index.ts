// ============================================================================
// AiSensy WhatsApp webhook — SCAFFOLD ONLY. NOT IMPLEMENTED. NOT CONNECTED.
// ============================================================================
//
// STATUS: this function intentionally returns HTTP 501. Nothing here has been
// tested against AiSensy, and no AiSensy endpoint or payload shape is asserted.
// It exists so the eventual integration has a reviewed place to live.
//
// WHY AN EDGE FUNCTION (and not the React app)
//   AiSensy webhooks must be verified with a secret and AiSensy outbound calls
//   need a private API token. Neither may sit in the Vite bundle — anything
//   prefixed VITE_ is public. So all AiSensy traffic stays server-side here,
//   where secrets come from Edge Function secrets (never from .env.local):
//
//     supabase secrets set AISENSY_API_KEY=... AISENSY_WEBHOOK_SECRET=...
//
//   Do NOT add AiSensy credentials to lead-crm/.env.local or any VITE_ variable.
//
// WHAT STILL NEEDS TO BE DECIDED (do not guess these):
//   1. How AiSensy authenticates the webhook (header name, HMAC signature, …).
//      Verify it before trusting any body — see the guard below.
//   2. The exact inbound event/payload schema. Log the raw body first and map
//      it only once it is observed, rather than inventing field names.
//   3. Which Supabase rows an inbound message should touch: append to a chat
//      thread table and refresh leads.last_contact_at. This needs a chat table
//      (a future migration 005) — one does not exist yet.
//   4. Whether outbound replies are sent from here (server-side, with the API
//      token) or queued. The dashboard's reply box is UI-only today.
//
// The comments below sketch the intended shape; none of it is wired up.

// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  // TODO(aisensy): verify the request signature/secret before parsing the body,
  // e.g. compare an HMAC of the raw body against
  // Deno.env.get("AISENSY_WEBHOOK_SECRET"). Reject with 401 on mismatch.
  //
  // const secret = Deno.env.get("AISENSY_WEBHOOK_SECRET");
  // if (!secret) return json({ error: "Webhook secret is not configured" }, 500);
  //
  // Service-role client (server only — never expose this key to the browser):
  // const supabase = createClient(
  //   Deno.env.get("SUPABASE_URL")!,
  //   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  // );

  return new Response(
    JSON.stringify({
      error: "Not implemented",
      detail:
        "The AiSensy webhook is a scaffold. Implement signature verification and " +
        "payload mapping before pointing AiSensy at this endpoint.",
    }),
    { status: 501, headers: { "content-type": "application/json" } },
  );
});
