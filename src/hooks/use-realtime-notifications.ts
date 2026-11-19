'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { QUERY_KEYS, REALTIME_CHANNEL_PREFIX } from '@/lib/constants'
import type { Database } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

interface UseRealtimeNotificationsOptions {
  employeeId?: string | null
  enabled?: boolean
  showToast?: boolean
}

interface UseRealtimeNotificationsReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnect: () => void
}

export function useRealtimeNotifications({
  employeeId,
  enabled = true,
  showToast = true,
}: UseRealtimeNotificationsOptions): UseRealtimeNotificationsReturn {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache of processed notification IDs to prevent duplicate toasts
  const processedNotificationIds = useRef<Set<string>>(new Set())
  const channelRef = useRef<RealtimeChannel | null>(null)

  const setupChannel = useCallback(() => {
    if (!employeeId || !enabled) {
      return
    }

    setIsConnecting(true)
    setError(null)

    // Clean up existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channelName = `${REALTIME_CHANNEL_PREFIX}:${employeeId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${employeeId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow
          if (!newNotification || !newNotification.id) return

          // Prevent duplicate handling
          if (processedNotificationIds.current.has(newNotification.id)) {
            return
          }
          processedNotificationIds.current.add(newNotification.id)

          // Keep set bounded to avoid memory leaks
          if (processedNotificationIds.current.size > 500) {
            const firstItem = processedNotificationIds.current.values().next().value
            if (firstItem) {
              processedNotificationIds.current.delete(firstItem)
            }
          }

          // Invalidate notifications queries in TanStack Query
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.notifications(employeeId),
          })

          // Invalidate leave requests or dashboard stats if relevant
          queryClient.invalidateQueries({
            queryKey: ['dashboardStats'],
          })
          queryClient.invalidateQueries({
            queryKey: ['leaveRequests'],
          })

          // Show rich toast notification
          if (showToast) {
            toast.info(newNotification.title || 'New Notification', {
              description: newNotification.message || undefined,
              duration: 5000,
            })
          }
        }
      )
      .subscribe((status, err) => {
        setIsConnecting(false)

        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setError(null)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setError(err?.message || 'Realtime channel connection error')
          toast.error('Connection lost', {
            description: 'Real-time updates disconnected. Retrying...',
            duration: 3000,
          })
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setError('Realtime channel subscription timed out')
        }
      })

    channelRef.current = channel
  }, [employeeId, enabled, showToast, queryClient, supabase])

  useEffect(() => {
    setupChannel()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [setupChannel, supabase])

  const reconnect = useCallback(() => {
    setupChannel()
  }, [setupChannel])

  return {
    isConnected,
    isConnecting,
    error,
    reconnect,
  }
}
