'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  leaveRequestId?: string
}

export async function getMyNotifications(filter: 'all' | 'unread' = 'all') {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) {
    return []
  }

  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .select('id, title, message, type, is_read, read_at, created_at, leave_request_id')
    .eq('recipient_id', user.employeeId)
    .order('created_at', { ascending: false })

  if (filter === 'unread') {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return (data || []).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.is_read,
    readAt: n.read_at,
    createdAt: n.created_at,
    leaveRequestId: n.leave_request_id || undefined,
  }))
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) return 0

  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.employeeId)
    .eq('is_read', false)

  if (error) return 0
  return count || 0
}

export async function markNotificationAsRead(id: string) {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) return { success: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', user.employeeId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/employee/notifications')
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) return { success: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.employeeId)
    .eq('is_read', false)

  if (error) return { success: false, error: error.message }
  revalidatePath('/employee/notifications')
  return { success: true }
}

export async function deleteNotification(id: string) {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) return { success: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('recipient_id', user.employeeId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/employee/notifications')
  return { success: true }
}

export async function getCompanyHolidays(year?: number) {
  const user = await getCurrentUser()
  const targetYear = year || new Date().getFullYear()
  const supabase = await createClient()

  const startOfYear = `${targetYear}-01-01`
  const endOfYear = `${targetYear}-12-31`

  const { data, error } = await supabase
    .from('holidays')
    .select('id, name, date, is_optional, description')
    .gte('date', startOfYear)
    .lte('date', endOfYear)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching holidays:', error)
    return []
  }

  return data || []
}
