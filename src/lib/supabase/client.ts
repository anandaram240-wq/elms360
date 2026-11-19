import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/lib/db-store'

export function createClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured =
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    supabaseKey &&
    supabaseKey !== 'your-anon-key-here'

  if (!isConfigured) {
    return createMockSupabaseClient() as unknown as SupabaseClient<Database>
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
