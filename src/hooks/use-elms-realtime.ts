'use client'

/**
 * ELMS 360 V5.1 — useElmsRealtime
 *
 * Central realtime hook that every authenticated user mounts once.
 * Uses Supabase Broadcast on a per-employee private channel.
 *
 * Channel: private:employee:{currentEmployeeId}
 *
 * On receiving a broadcast event the hook:
 *   1. Shows a non-intrusive toast
 *   2. Calls the store's fetchAuthoritativeState() to sync from PostgreSQL
 *
 * This hook does NOT replace RLS — it is simply a push trigger.
 * All authoritative data still comes from /api/store/sync.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ElmsBroadcastPayload, ElmsRealtimeEvent } from '@/lib/realtime-types'

export type RealtimeConnectionStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'RECONNECTING'
  | 'CHANNEL_ERROR'
  | 'TIMED_OUT'
  | 'CLOSED'

interface UseElmsRealtimeOptions {
  /** Employee UUID (from elms-store currentUser.id) */
  employeeId: string | null | undefined
  /** Called after every broadcast event — should trigger store.refresh() */
  onEvent: (payload: ElmsBroadcastPayload) => void
  /** Disable the hook entirely */
  enabled?: boolean
}

export interface UseElmsRealtimeReturn {
  connectionStatus: RealtimeConnectionStatus
  lastEvent: ElmsBroadcastPayload | null
  reconnect: () => void
}

/** Human-readable labels for each event type */
const EVENT_TOAST_LABELS: Record<ElmsRealtimeEvent, string> = {
  LEAVE_REQUEST_SUBMITTED: 'New leave request submitted',
  LEAVE_APPROVED: 'Leave request approved',
  LEAVE_REJECTED: 'Leave request rejected',
  LEAVE_CLARIFICATION_REQUESTED: 'Clarification requested on leave',
  LEAVE_FORWARDED_FOR_APPROVAL: 'Leave request forwarded to you',
  LEAVE_WITHDRAWN: 'Leave request withdrawn',
  LEAVE_CANCELLED: 'Leave request cancelled',
  LEAVE_CANCELLED_APPROVED: 'Leave cancellation approved',
  STORE_REFRESH: 'Data updated',
}

export function useElmsRealtime({
  employeeId,
  onEvent,
  enabled = true,
}: UseElmsRealtimeOptions): UseElmsRealtimeReturn {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('IDLE')
  const [lastEvent, setLastEvent] = useState<ElmsBroadcastPayload | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onEventRef = useRef(onEvent)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const scheduleRetryRef = useRef<() => void>(() => {})

  // Keep the callback ref fresh without re-creating the subscription
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (channelRef.current) {
      try {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
      } catch {}
      channelRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!employeeId || !enabled) return
    if (!isMountedRef.current) return

    cleanup()

    setConnectionStatus('CONNECTING')
    const supabase = createClient()
    const channelName = `private:employee:${employeeId}`

    const channel = supabase
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'store_refresh' }, (msg) => {
        if (!isMountedRef.current) return
        const payload = msg.payload as ElmsBroadcastPayload
        setLastEvent(payload)

        // Show a non-intrusive toast (suppress generic STORE_REFRESH)
        if (payload.type && payload.type !== 'STORE_REFRESH') {
          const label = EVENT_TOAST_LABELS[payload.type] ?? 'Update received'
          toast.info(label, {
            duration: 4000,
            id: `realtime-${payload.type}-${payload.requestId ?? Date.now()}`,
          })
        }

        // Delegate to the store refresh callback
        onEventRef.current(payload)
      })
      .subscribe((status, err) => {
        if (!isMountedRef.current) return

        if (status === 'SUBSCRIBED') {
          setConnectionStatus('SUBSCRIBED')
          retryCountRef.current = 0
        } else if (status === 'CLOSED') {
          setConnectionStatus('CLOSED')
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('CHANNEL_ERROR')
          console.warn('[REALTIME] Channel error:', err?.message)
          scheduleRetryRef.current()
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('TIMED_OUT')
          scheduleRetryRef.current()
        }
      })

    channelRef.current = channel
  }, [employeeId, enabled, cleanup])

  const scheduleRetry = useCallback(() => {
    retryCountRef.current++
    const MAX_RETRIES = 5
    if (retryCountRef.current > MAX_RETRIES) return

    const backoffMs = Math.min(1000 * 2 ** retryCountRef.current, 30000)
    setConnectionStatus('RECONNECTING')

    retryTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connect()
      }
    }, backoffMs)
  }, [connect])

  scheduleRetryRef.current = scheduleRetry

  const reconnect = useCallback(() => {
    retryCountRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    isMountedRef.current = true
    connect()

    return () => {
      isMountedRef.current = false
      cleanup()
      setConnectionStatus('CLOSED')
    }
  }, [connect, cleanup])

  // Reconnect on tab focus (reconcile any missed events)
  useEffect(() => {
    const onFocus = () => {
      if (connectionStatus === 'CLOSED' || connectionStatus === 'CHANNEL_ERROR') {
        reconnect()
      } else if (connectionStatus === 'SUBSCRIBED') {
        // Just refresh data to reconcile missed events
        onEventRef.current({ type: 'STORE_REFRESH', ts: Date.now() })
      }
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [connectionStatus, reconnect])

  return { connectionStatus, lastEvent, reconnect }
}
