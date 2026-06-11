/**
 * fets-live.ts
 * Server-side read client for the fets.live Supabase project (qqewusetilxxfvfkmsed).
 * Uses the service role key so RLS is bypassed — safe here because this module
 * is ONLY imported in Server Actions / Route Handlers (never shipped to the browser).
 *
 * Required env var (add to /var/www/fets-os/.env.local on the server):
 *   FETS_LIVE_SERVICE_ROLE_KEY=<service role key from fets.live Supabase dashboard>
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const FETS_LIVE_URL = 'https://qqewusetilxxfvfkmsed.supabase.co'
const FETS_LIVE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s'

let _client: SupabaseClient | null = null

export function getFetsLiveClient(): SupabaseClient {
  if (_client) return _client

  // Prefer service role key (bypasses RLS) — required for server-side reads.
  // Falls back to anon key so the module doesn't hard-crash at import time,
  // but queries against RLS-protected tables will return empty data.
  const key = process.env.FETS_LIVE_SERVICE_ROLE_KEY ?? FETS_LIVE_ANON_KEY

  _client = createClient(FETS_LIVE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return _client
}
