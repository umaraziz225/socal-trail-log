import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const isConfigured =
  /^https?:\/\//.test(SUPABASE_URL) && !SUPABASE_ANON_KEY.startsWith("YOUR_");

// Only load the SDK when configured, so demo mode has no network dependency.
export const supabase = isConfigured
  ? (await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm")).createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    )
  : null;
