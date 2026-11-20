/**
 * ELMS 360 V5.1 - Server-Side Realtime Broadcaster
 *
 * Uses Supabase Broadcast to deliver cross-role realtime events.
 * This runs ONLY on the server (API routes, server actions).
 * The browser uses the anon key; this module uses the service role key.
 *
 * Channel naming convention:
 *   private:employee:{employeeId}  — per-employee notifications
 *
 * Event types mirror the notification `type` column.
 */

import { createClient } from '@supabase/supabase-js'
import type { ElmsBroadcastPayload, ElmsRealtimeEvent } from './realtime-types'

export type { ElmsBroadcastPayload, ElmsRealtimeEvent }

function createServerBroadcaster() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Broadcast an event to a specific employee's private channel.
 * Fire-and-forget — does not throw on failure (realtime is not the source of truth).
 */
export async function broadcastToEmployee(
  employeeId: string,
  eventType: ElmsRealtimeEvent,
  payload: Omit<ElmsBroadcastPayload, 'ts' | 'type'>
): Promise<void> {
  try {
    const supabase = createServerBroadcaster()
    if (!supabase) return

    const channelName = `private:employee:${employeeId}`
    const result = await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'store_refresh',
      payload: { ...payload, type: eventType, ts: Date.now() } satisfies ElmsBroadcastPayload,
    })

    if (result !== 'ok') {
      console.warn(`[REALTIME] Broadcast to ${channelName} returned: ${result}`)
    }
  } catch (err) {
    console.warn('[REALTIME] Broadcast error (non-fatal):', err)
  }
}

/**
 * Broadcast to multiple employees simultaneously.
 */
export async function broadcastToEmployees(
  employeeIds: string[],
  eventType: ElmsRealtimeEvent,
  payload: Omit<ElmsBroadcastPayload, 'ts' | 'type'>
): Promise<void> {
  await Promise.allSettled(
    employeeIds.map((id) => broadcastToEmployee(id, eventType, payload))
  )
}
