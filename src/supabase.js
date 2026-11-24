import { createClient } from '@supabase/supabase-js'
import { demoRole, demoFetch, demoStorage } from './demo/demo.js'

const SUPABASE_URL = 'https://ksataubrattfspjpftlk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYXRhdWJyYXR0ZnNwanBmdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjcxNTksImV4cCI6MjA5MjUwMzE1OX0.Aq_aDRG5Op4lAii5Fk_7Mxe37Stf7MPfAxcU_6GYCSY'

// The website demo (/demo) runs the app on made-up data: every request goes to an
// in-memory stand-in at a different address, so nothing reaches the real database.
const demo = demoRole()
const DEMO_OPTIONS = demo
  ? { global: { fetch: demoFetch }, auth: { storage: demoStorage(), storageKey: 'unfnshd-demo-auth', autoRefreshToken: false, detectSessionInUrl: false } }
  : undefined
const URL_FOR_APP = demo ? `${window.location.origin}/demo-api` : SUPABASE_URL

// Main client: persists the PT's session in localStorage for auth
export const supabase = createClient(URL_FOR_APP, SUPABASE_ANON_KEY, DEMO_OPTIONS)

// Public client: never reads localStorage, always sends the anon key.
// Used on the check-in page so a PT's active session doesn't bleed into
// unauthenticated client submissions and trip RLS policies scoped to anon.
export const supabasePublic = createClient(URL_FOR_APP, SUPABASE_ANON_KEY, {
  ...(demo ? { global: { fetch: demoFetch } } : {}),
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
