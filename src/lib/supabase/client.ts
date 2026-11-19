import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured =
    supabaseUrl &&
    (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    supabaseKey &&
    supabaseKey !== 'your-anon-key-here'

  if (!isConfigured) {
    throw new Error('DATABASE CONNECTION UNAVAILABLE: Supabase configuration missing.')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
