import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ksataubrattfspjpftlk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYXRhdWJyYXR0ZnNwanBmdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjcxNTksImV4cCI6MjA5MjUwMzE1OX0.Aq_aDRG5Op4lAii5Fk_7Mxe37Stf7MPfAxcU_6GYCSY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
