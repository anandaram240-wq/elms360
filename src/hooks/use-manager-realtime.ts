'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface RealtimeLeaveEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'LEAVE_SUBMITTED' | 'CLARIFICATION_ANSWERED'
  requestId?: string
  requestNumber?: string
  employeeName?: string
  leaveType?: string
  message?: string
}

export interface UseManagerRealtimeOptions {
  employeeId?: string
  onNewRequest?: (event: RealtimeLeaveEvent) => void
  enabled?: boolean
}

export function useManagerRealtime({
  employeeId,
  onNewRequest,
  enabled = true,
}: UseManagerRealtimeOptions = {}) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const queryClient = useQueryClient()
  const supabase = createClient()
  const onNewRequestRef = useRef(onNewRequest)
  onNewRequestRef.current = onNewRequest

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] })
    queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
    queryClient.invalidateQueries({ queryKey: ['managerStats'] })
    queryClient.invalidateQueries({ queryKey: ['teamCalendar'] })
  }, [queryClient])

  useEffect(() => {
    if (!enabled || !employeeId) {
      setConnectionState('disconnected')
      return
    }

    setConnectionState('connecting')

    // 1. Subscribe to broadcast channel for manager: private:manager:{employeeId}
    const channelName = `private:manager:${employeeId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
      },
    })

    // Listen to broadcast custom events
    channel.on(
      'broadcast',
      { event: 'new_leave_request' },
      ({ payload }) => {
        const empName = payload?.employeeName || 'A team member'
        const leaveType = payload?.leaveType || 'Leave'
        toast.info(`New leave request from ${empName}`, {
          description: `${empName} applied for ${leaveType}`,
          action: {
            label: 'Review',
            onClick: () => {
              if (payload?.requestId) {
                window.location.href = `/manager/approvals/${payload.requestId}`
              } else {
                window.location.href = '/manager/approvals'
              }
            },
          },
        })

        setUnreadCount((prev) => prev + 1)
        invalidateQueries()

        if (onNewRequestRef.current) {
          onNewRequestRef.current({
            eventType: 'LEAVE_SUBMITTED',
            requestId: payload?.requestId,
            requestNumber: payload?.requestNumber,
            employeeName: payload?.employeeName,
            leaveType: payload?.leaveType,
          })
        }
      }
    )

    // 2. Also listen for Postgres changes on leave_requests where current_approver_id = employeeId
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leave_requests',
        filter: `current_approver_id=eq.${employeeId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = payload.new as { id?: string; request_number?: string }
          toast.info('New approval request', {
            description: `Request ${newRow.request_number || ''} requires your approval.`,
          })
          setUnreadCount((prev) => prev + 1)
        }
        invalidateQueries()
      }
    )

    // Handle channel subscription state
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionState('connected')
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setConnectionState('disconnected')
      } else if (status === 'TIMED_OUT') {
        setConnectionState('disconnected')
        // Attempt resubscribe
        setTimeout(() => {
          channel.subscribe()
        }, 3000)
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [employeeId, enabled, supabase, invalidateQueries])

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return {
    unreadCount,
    clearUnreadCount,
    connectionState,
    invalidateQueries,
  }
}
