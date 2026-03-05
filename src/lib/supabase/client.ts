import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

export function hasSupabaseBrowserConfig(): boolean {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    !supabaseUrl.includes('your-project') &&
    !supabasePublishableKey.includes('sb_publishable_xxx'),
  );
}

export function createBrowserSupabase() {
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false },
  });
}

export const browserSupabase = createBrowserSupabase();
