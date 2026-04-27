import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ksataubrattfspjpftlk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYXRhdWJyYXR0ZnNwanBmdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjcxNTksImV4cCI6MjA5MjUwMzE1OX0.Aq_aDRG5Op4lAii5Fk_7Mxe37Stf7MPfAxcU_6GYCSY'

// Main client — persists the PT's session in localStorage for auth
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Public client — never reads localStorage, always sends the anon key.
// Used on the check-in page so a PT's active session doesn't bleed into
// unauthenticated client submissions and trip RLS policies scoped to anon.
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
