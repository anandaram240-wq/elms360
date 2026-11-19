import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// SERVICE ROLE - NEVER expose to browser
// Only used in server actions / API routes
export function createAdminClient(): SupabaseClient<Database> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const isConfigured =
    serviceKey &&
    serviceKey !== 'your-service-role-key-here' &&
    supabaseUrl &&
    (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
    !supabaseUrl.includes('your-project.supabase.co')

  if (!isConfigured) {
    throw new Error('DATABASE CONNECTION UNAVAILABLE: Supabase Service Role key missing.')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
