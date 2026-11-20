/**
 * ELMS 360 V5.1 - Realtime Shared Types
 * Shared between server broadcaster and client hook.
 */

export type ElmsRealtimeEvent =
  | 'LEAVE_REQUEST_SUBMITTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_CLARIFICATION_REQUESTED'
  | 'LEAVE_FORWARDED_FOR_APPROVAL'
  | 'LEAVE_WITHDRAWN'
  | 'LEAVE_CANCELLED'
  | 'LEAVE_CANCELLED_APPROVED'
  | 'STORE_REFRESH'

export interface ElmsBroadcastPayload {
  type: ElmsRealtimeEvent
  requestId?: string
  requestNumber?: string
  notificationId?: string
  ts: number
}
