import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/lib/db-store'

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('elms360_user')
  let activeUser: any = null
  if (sessionCookie?.value) {
    try {
      activeUser = JSON.parse(sessionCookie.value)
    } catch {}
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured =
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    supabaseKey &&
    supabaseKey !== 'your-anon-key-here'

  if (!isConfigured) {
    return createMockSupabaseClient(activeUser) as unknown as SupabaseClient<Database>
  }

  try {
    return createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
  } catch {
    return createMockSupabaseClient(activeUser) as unknown as SupabaseClient<Database>
  }
}

