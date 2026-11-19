import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/lib/db-store'

// SERVICE ROLE - NEVER expose to browser
// Only used in server actions / API routes
export function createAdminClient(): SupabaseClient<Database> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const isConfigured =
    serviceKey &&
    serviceKey !== 'your-service-role-key-here' &&
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project.supabase.co')

  if (!isConfigured) {
    return createMockSupabaseClient() as unknown as SupabaseClient<Database>
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
