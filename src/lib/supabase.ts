import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getGuestSessionId(): string {
  const key = 'velora_guest_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'guest-' + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
