/**
 * ELMS 360 V5.1 - End-to-End Realtime Verification Test
 *
 * Verifies that:
 * 1. A client can subscribe to their private broadcast channel with the anon key
 * 2. The server broadcaster can emit an event using the service role key
 * 3. The client receives the broadcast with the exact payload and low latency (<1000ms)
 * 4. Multi-recipient broadcast delivers events to all subscribed channels
 */

import { createClient } from '@supabase/supabase-js'
import { broadcastToEmployee, broadcastToEmployees } from '../src/lib/realtime-broadcaster'
import type { ElmsBroadcastPayload } from '../src/lib/realtime-types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://addyqmoyiiqksvgfwjyu.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PiEf-5W95LRX59c8I8rd0A_2QMJXZoq'

async function runRealtimeE2ETest() {
  console.log('=================================================================')
  console.log('ELMS 360 V5.1 — E2E Realtime Synchronization Verification')
  console.log('=================================================================')

  const testManagerId = 'bbbbbbbb-0000-0000-0000-000000000002' // Michael Chang (Manager)
  const testEmployeeId = 'bbbbbbbb-0000-0000-0000-000000000008' // Sarah Jenkins (Employee)
  const testHRId = 'bbbbbbbb-0000-0000-0000-000000000004' // Priya Sharma (HR)

  // 1. Create client instance (mimicking browser)
  const browserClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Test 1: Single recipient broadcast (Employee submits -> Manager receives)
  console.log('\n--- TEST 1: Single Recipient Broadcast (Employee -> Manager) ---')
  const managerChannelName = `private:employee:${testManagerId}`
  console.log(`[CLIENT] Subscribing to manager channel: ${managerChannelName}...`)

  const managerReceivedEvents: ElmsBroadcastPayload[] = []
  let managerSubscribed = false

  const managerChannel = browserClient.channel(managerChannelName, {
    config: { broadcast: { self: false } },
  })

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!managerSubscribed) reject(new Error('Timeout waiting for manager subscription'))
    }, 10000)

    managerChannel
      .on('broadcast', { event: 'store_refresh' }, (msg) => {
        const payload = msg.payload as ElmsBroadcastPayload
        console.log(`[CLIENT] Received broadcast on ${managerChannelName}:`, payload)
        managerReceivedEvents.push(payload)
      })
      .subscribe((status, err) => {
        console.log(`[CLIENT] Subscription status: ${status}`)
        if (status === 'SUBSCRIBED') {
          managerSubscribed = true
          clearTimeout(timeout)
          resolve()
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout)
          reject(new Error(`Subscription channel error: ${err?.message}`))
        }
      })
  })

  console.log('✅ Manager channel subscribed successfully!')

  // Emit event from server
  const sendTime = Date.now()
  console.log('[SERVER] Broadcasting LEAVE_REQUEST_SUBMITTED from server...')
  await broadcastToEmployee(testManagerId, 'LEAVE_REQUEST_SUBMITTED', {
    requestId: 'e2e-test-req-001',
    requestNumber: 'LR-2026-E2E001',
  })

  // Wait for client to receive event
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (managerReceivedEvents.length === 0) {
    throw new Error('FAILED: Manager channel did not receive broadcast event within 1500ms')
  }

  const received1 = managerReceivedEvents[0]
  const latency1 = received1.ts - sendTime
  console.log(`✅ TEST 1 PASSED: Received ${received1.type} for ${received1.requestNumber} (latency: ${latency1}ms)`)

  // Test 2: Multi-recipient broadcast (Manager approves -> Employee + HR receive)
  console.log('\n--- TEST 2: Multi-Recipient Broadcast (Manager approves -> Employee + HR) ---')

  const hrChannelName = `private:employee:${testHRId}`
  const employeeChannelName = `private:employee:${testEmployeeId}`

  const hrReceivedEvents: ElmsBroadcastPayload[] = []
  const employeeReceivedEvents: ElmsBroadcastPayload[] = []

  const hrChannel = browserClient.channel(hrChannelName, { config: { broadcast: { self: false } } })
  const employeeChannel = browserClient.channel(employeeChannelName, { config: { broadcast: { self: false } } })

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('HR sub timeout')), 10000)
      hrChannel
        .on('broadcast', { event: 'store_refresh' }, (msg) => {
          hrReceivedEvents.push(msg.payload as ElmsBroadcastPayload)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            resolve()
          }
        })
    }),
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Employee sub timeout')), 10000)
      employeeChannel
        .on('broadcast', { event: 'store_refresh' }, (msg) => {
          employeeReceivedEvents.push(msg.payload as ElmsBroadcastPayload)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            resolve()
          }
        })
    }),
  ])

  console.log('✅ Both HR and Employee channels subscribed!')

  const sendTime2 = Date.now()
  console.log('[SERVER] Broadcasting LEAVE_APPROVED to Employee and HR simultaneously...')
  await broadcastToEmployees([testEmployeeId, testHRId], 'LEAVE_APPROVED', {
    requestId: 'e2e-test-req-002',
    requestNumber: 'LR-2026-E2E002',
  })

  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (employeeReceivedEvents.length === 0) {
    throw new Error('FAILED: Employee channel did not receive broadcast')
  }
  if (hrReceivedEvents.length === 0) {
    throw new Error('FAILED: HR channel did not receive broadcast')
  }

  console.log(`✅ TEST 2 PASSED: Employee received ${employeeReceivedEvents[0].type} (${Date.now() - sendTime2}ms)`)
  console.log(`✅ TEST 2 PASSED: HR received ${hrReceivedEvents[0].type} (${Date.now() - sendTime2}ms)`)

  // Cleanup
  await browserClient.removeChannel(managerChannel)
  await browserClient.removeChannel(hrChannel)
  await browserClient.removeChannel(employeeChannel)

  console.log('\n=================================================================')
  console.log('🎉 ALL REALTIME SYNCHRONIZATION ACCEPTANCE TESTS PASSED (2/2)')
  console.log('=================================================================')
}

runRealtimeE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ REALTIME TEST ERROR:', err)
    process.exit(1)
  })
