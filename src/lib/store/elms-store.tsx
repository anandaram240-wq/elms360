'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import {
  SEED_ORGANIZATION,
  SEED_DEPARTMENTS,
  SEED_LEAVE_TYPES,
  SEED_EMPLOYEES,
  SEED_ROLE_ASSIGNMENTS,
  SEED_ROLES,
  SEED_REPORTING,
  SEED_HOLIDAYS,
  SEED_LEAVE_BALANCES,
  SEED_LEAVE_REQUESTS,
} from '../seed-data'
import { calculateWorkingDays } from '../date-utils'
import type { CurrentUser, RoleCode, DayType, LeaveStatus } from '@/types/app'

export interface EmployeeRecord {
  id: string
  employee_code: string
  full_name: string
  work_email: string
  designation: string
  department_id: string
  department_name: string
  manager_id: string | null
  manager_name?: string
  is_active: boolean
  roles: RoleCode[]
}

export interface LeaveTypeRecord {
  id: string
  name: string
  code: string
  description?: string
  color: string
  annual_entitlement: number
  allows_half_day: boolean
}

export interface LeaveBalanceRecord {
  id: string
  employee_id: string
  leave_type_id: string
  fiscal_year: number
  opening_balance: number
  accrued: number
  used: number
  pending: number
  adjusted: number
  carried_forward: number
  available_balance: number
}

export interface LeaveRequestRecord {
  id: string
  request_number: string
  employee_id: string
  employee_name: string
  employee_code: string
  department_name: string
  leave_type_id: string
  leave_type_code: string
  leave_type_name: string
  leave_type_color: string
  start_date: string
  end_date: string
  day_type: DayType
  total_days: number
  reason: string
  handover_notes?: string
  emergency_contact?: string
  status: LeaveStatus
  current_approver_role: 'MANAGER' | 'HR' | null
  current_approver_id?: string
  manager_name?: string
  clarification_question?: string
  clarification_reply?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface ApprovalActionRecord {
  id: string
  leave_request_id: string
  actor_id: string
  actor_name: string
  actor_role: string
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUESTED' | 'REPLIED' | 'WITHDRAWN' | 'CANCELLED'
  comments?: string
  created_at: string
}

export interface NotificationRecord {
  id: string
  user_id: string
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

export interface HolidayRecord {
  id: string
  name: string
  date: string
  type: string
}

export interface LedgerRecord {
  id: string
  employee_id: string
  leave_type_id: string
  transaction_type: 'OPENING' | 'PENDING_RESERVE' | 'PENDING_RELEASE' | 'APPROVED_DEDUCTION' | 'REVERSAL'
  amount: number
  balance_after: number
  reason: string
  created_at: string
}

export interface ElmsState {
  version: number
  currentUser: CurrentUser | null
  employees: EmployeeRecord[]
  leaveTypes: LeaveTypeRecord[]
  leaveBalances: LeaveBalanceRecord[]
  leaveRequests: LeaveRequestRecord[]
  approvalActions: ApprovalActionRecord[]
  notifications: NotificationRecord[]
  holidays: HolidayRecord[]
  ledger: LedgerRecord[]
  weeklyOffDays: number[]
}

const STORAGE_KEY = 'elms360_v3_state'
const SYNC_CHANNEL_NAME = 'elms360_sync'

export function getInitialStoreState(): ElmsState {
  const deptMap: Record<string, string> = {}
  SEED_DEPARTMENTS.forEach((d) => {
    deptMap[d.id] = d.name
  })

  const empMap: Record<string, string> = {}
  SEED_EMPLOYEES.forEach((e) => {
    empMap[e.id] = e.full_name
  })

  const managerLookup: Record<string, string> = {}
  SEED_REPORTING.forEach((r) => {
    managerLookup[r.employee_id] = r.manager_id
  })

  const roleLookup: Record<string, RoleCode[]> = {}
  SEED_ROLE_ASSIGNMENTS.forEach((ra) => {
    const roleObj = SEED_ROLES.find((r) => r.id === ra.role_id)
    if (roleObj) {
      if (!roleLookup[ra.employee_id]) roleLookup[ra.employee_id] = []
      roleLookup[ra.employee_id].push(roleObj.code as RoleCode)
    }
  })

  const employees: EmployeeRecord[] = SEED_EMPLOYEES.map((e) => {
    const mgrId = managerLookup[e.id] || null
    return {
      id: e.id,
      employee_code: e.employee_code,
      full_name: e.full_name,
      work_email: e.work_email,
      designation: e.designation,
      department_id: e.department_id,
      department_name: deptMap[e.department_id] || 'General',
      manager_id: mgrId,
      manager_name: mgrId ? empMap[mgrId] : undefined,
      is_active: e.is_active,
      roles: roleLookup[e.id] || ['EMPLOYEE'],
    }
  })

  const leaveTypes: LeaveTypeRecord[] = SEED_LEAVE_TYPES.map((lt) => ({
    id: lt.id,
    name: lt.name,
    code: lt.code,
    description: lt.description,
    color: lt.color || '#3B82F6',
    annual_entitlement: lt.code === 'AL' ? 21 : lt.code === 'SL' ? 10 : lt.code === 'CL' ? 7 : 15,
    allows_half_day: lt.allows_half_day ?? true,
  }))

  const leaveBalances: LeaveBalanceRecord[] = SEED_LEAVE_BALANCES.map((b, idx) => ({
    id: `bal-${idx + 1}`,
    employee_id: b.employee_id,
    leave_type_id: b.leave_type_id,
    fiscal_year: b.fiscal_year || 2026,
    opening_balance: b.opening_balance || 0,
    accrued: b.accrued || 0,
    used: b.used || 0,
    pending: b.pending || 0,
    adjusted: b.adjusted || 0,
    carried_forward: b.carried_forward || 0,
    available_balance: b.available_balance || 0,
  }))

  const typeMap: Record<string, LeaveTypeRecord> = {}
  leaveTypes.forEach((lt) => {
    typeMap[lt.id] = lt
  })

  const leaveRequests: LeaveRequestRecord[] = (SEED_LEAVE_REQUESTS || []).map((lr, idx) => {
    const emp = employees.find((e) => e.id === lr.employee_id)
    const lt = typeMap[lr.leave_type_id]
    return {
      id: lr.id || `req-seed-${idx + 1}`,
      request_number: lr.request_number || `LR-2026-000${idx + 1}`,
      employee_id: lr.employee_id,
      employee_name: emp?.full_name || 'Arjun Kumar',
      employee_code: emp?.employee_code || 'EMP008',
      department_name: emp?.department_name || 'Engineering',
      leave_type_id: lr.leave_type_id,
      leave_type_code: lt?.code || 'CL',
      leave_type_name: lt?.name || 'Casual Leave',
      leave_type_color: lt?.color || '#3B82F6',
      start_date: lr.start_date,
      end_date: lr.end_date,
      day_type: (lr.day_type as DayType) || 'FULL_DAY',
      total_days: lr.total_days || 2,
      reason: lr.reason || 'Personal commitments',
      status: (lr.status as LeaveStatus) || 'APPROVED',
      current_approver_role: lr.status === 'PENDING_MANAGER_APPROVAL' ? 'MANAGER' : lr.status === 'PENDING_HR_APPROVAL' ? 'HR' : null,
      created_at: lr.created_at || '2026-11-01T09:00:00Z',
      updated_at: lr.updated_at || '2026-11-01T09:00:00Z',
    }
  })

  const holidays: HolidayRecord[] = SEED_HOLIDAYS.map((h: any, idx) => ({
    id: h.id || `hol-${idx + 1}`,
    name: h.name,
    date: h.date || h.holiday_date,
    type: h.type || h.holiday_type || 'PUBLIC',
  }))

  // Default initial active user is Arjun Kumar (Employee)
  const defaultEmp = employees.find((e) => e.employee_code === 'EMP008') || employees[0]
  const currentUser: CurrentUser = {
    id: defaultEmp.id,
    email: defaultEmp.work_email,
    employeeId: defaultEmp.id,
    organizationId: SEED_ORGANIZATION.id,
    fullName: defaultEmp.full_name,
    roles: defaultEmp.roles,
    employeeCode: defaultEmp.employee_code,
    departmentId: defaultEmp.department_id,
    designation: defaultEmp.designation,
  }

  const notifications: NotificationRecord[] = [
    {
      id: 'notif-1',
      user_id: defaultEmp.id,
      title: 'Welcome to ELMS 360',
      message: 'Your leave balance for fiscal year 2026 is active.',
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ]

  return {
    version: 3,
    currentUser,
    employees,
    leaveTypes,
    leaveBalances,
    leaveRequests,
    approvalActions: [],
    notifications,
    holidays,
    ledger: [],
    weeklyOffDays: [0, 6], // Sunday & Saturday
  }
}

// Global broadcast channel for cross-tab sync
let globalChannel: BroadcastChannel | null = null
function getSyncChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!globalChannel) {
      globalChannel = new BroadcastChannel(SYNC_CHANNEL_NAME)
    }
    return globalChannel
  }
  return null
}

export function loadStoredState(): ElmsState {
  if (typeof window === 'undefined') {
    return getInitialStoreState()
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === 3) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed to parse localStorage state:', err)
  }
  const fresh = getInitialStoreState()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  } catch {}
  return fresh
}

export function persistStoreState(state: ElmsState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    const ch = getSyncChannel()
    ch?.postMessage({ type: 'SYNC_STATE', timestamp: Date.now() })
  } catch (err) {
    console.error('Failed to persist store state:', err)
  }
}

// React Context
interface ElmsStoreContextType {
  state: ElmsState
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser | null) => void
  switchUser: (emailOrId: string) => void
  calculateDuration: (startDate: string, endDate: string, dayType?: DayType) => {
    workingDays: number
    totalCalendarDays: number
    skippedWeekends: number
    skippedHolidays: number
    breakdown: Array<{ date: string; isWorkingDay: boolean; reason?: string }>
  }
  submitLeave: (params: {
    leaveTypeId: string
    startDate: string
    endDate: string
    dayType: DayType
    reason: string
    handoverNotes?: string
    emergencyContact?: string
  }) => { success: boolean; error?: string; request?: LeaveRequestRecord }
  withdrawLeave: (requestId: string) => { success: boolean; error?: string }
  managerApprove: (requestId: string, comments?: string) => { success: boolean; error?: string }
  managerReject: (requestId: string, reason: string) => { success: boolean; error?: string }
  managerRequestClarification: (requestId: string, question: string) => { success: boolean; error?: string }
  employeeReplyClarification: (requestId: string, reply: string) => { success: boolean; error?: string }
  hrFinalApprove: (requestId: string, comments?: string) => { success: boolean; error?: string }
  hrReject: (requestId: string, reason: string) => { success: boolean; error?: string }
  cancelApprovedLeave: (requestId: string, reason: string) => { success: boolean; error?: string }
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  addEmployee: (emp: Omit<EmployeeRecord, 'id'>) => void
  updateEmployee: (id: string, updates: Partial<EmployeeRecord>) => void
  toggleEmployeeActive: (id: string) => void
  addHoliday: (name: string, date: string, type?: string) => void
  deleteHoliday: (id: string) => void
  updateLeaveQuota: (leaveTypeId: string, quota: number) => void
  setWeeklyOffSchedule: (days: number[]) => void
  resetDemoData: () => void
}

const ElmsStoreContext = createContext<ElmsStoreContextType | undefined>(undefined)

export function ElmsStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ElmsState>(loadStoredState)

  // Sync state across multiple tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue))
        } catch {}
      }
    }

    const ch = getSyncChannel()
    const handleBroadcast = (ev: MessageEvent) => {
      if (ev.data?.type === 'SYNC_STATE') {
        setState(loadStoredState())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    ch?.addEventListener('message', handleBroadcast)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      ch?.removeEventListener('message', handleBroadcast)
    }
  }, [])

  // Sync cookie with currentUser for Server Actions / Next.js middleware compatibility
  const updateSessionCookie = useCallback((user: CurrentUser | null) => {
    if (typeof document === 'undefined') return
    if (user) {
      document.cookie = `elms360_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`
    } else {
      document.cookie = 'elms360_user=; path=/; max-age=0; SameSite=Lax'
    }
  }, [])

  const switchUser = useCallback(
    (emailOrId: string) => {
      setState((prev) => {
        const emp = prev.employees.find(
          (e) => e.work_email.toLowerCase() === emailOrId.toLowerCase() || e.id === emailOrId
        )
        if (!emp) return prev

        const user: CurrentUser = {
          id: emp.id,
          email: emp.work_email,
          employeeId: emp.id,
          organizationId: SEED_ORGANIZATION.id,
          fullName: emp.full_name,
          roles: emp.roles,
          employeeCode: emp.employee_code,
          departmentId: emp.department_id,
          designation: emp.designation,
        }

        updateSessionCookie(user)

        const next = { ...prev, currentUser: user }
        persistStoreState(next)
        return next
      })
    },
    [updateSessionCookie]
  )

  const setCurrentUser = useCallback(
    (user: CurrentUser | null) => {
      setState((prev) => {
        updateSessionCookie(user)
        const next = { ...prev, currentUser: user }
        persistStoreState(next)
        return next
      })
    },
    [updateSessionCookie]
  )

  // Calculate working days with holidays & weekly-offs
  const calculateDuration = useCallback(
    (startDate: string, endDate: string, dayType: DayType = 'FULL_DAY') => {
      const holidayDates = state.holidays.map((h) => h.date)
      const validDayType =
        dayType === 'HALF_DAY_AM' || dayType === 'HALF_DAY_PM' ? dayType : 'FULL_DAY'
      const res = calculateWorkingDays(startDate, endDate, state.weeklyOffDays, holidayDates, validDayType)
      return {
        workingDays: res.workingDays,
        totalCalendarDays: res.totalCalendarDays,
        skippedWeekends: res.weekendDays,
        skippedHolidays: res.holidayDays,
        breakdown: res.perDay.map((d) => ({
          date: d.date,
          isWorkingDay: d.type === 'WORKING_DAY',
          reason: d.type === 'WEEKLY_OFF' ? 'Weekend' : d.type === 'COMPANY_HOLIDAY' ? 'Holiday' : undefined,
        })),
      }
    },
    [state.holidays, state.weeklyOffDays]
  )

  // Submit leave application
  const submitLeave = useCallback(
    (params: {
      leaveTypeId: string
      startDate: string
      endDate: string
      dayType: DayType
      reason: string
      handoverNotes?: string
      emergencyContact?: string
    }) => {
      const curUser = state.currentUser
      if (!curUser) return { success: false, error: 'User is not authenticated' }

      const emp = state.employees.find((e) => e.id === curUser.id || e.id === curUser.employeeId)
      if (!emp) return { success: false, error: 'Employee record not found' }

      const lt = state.leaveTypes.find((t) => t.id === params.leaveTypeId)
      if (!lt) return { success: false, error: 'Invalid leave type selected' }

      if (params.endDate < params.startDate) {
        return { success: false, error: 'End date cannot be earlier than start date' }
      }

      const duration = calculateDuration(params.startDate, params.endDate, params.dayType)
      if (duration.workingDays <= 0) {
        return {
          success: false,
          error: 'The selected date range contains 0 working days (all selected days are scheduled weekly offs or holidays).',
        }
      }

      // Check balance
      const currentBalance = state.leaveBalances.find(
        (b) => b.employee_id === emp.id && b.leave_type_id === lt.id && b.fiscal_year === 2026
      )
      const available = currentBalance ? currentBalance.available_balance : 0
      if (lt.code !== 'LOP' && available < duration.workingDays) {
        return {
          success: false,
          error: `Insufficient leave balance. You have ${available} days available, but requested ${duration.workingDays} days.`,
        }
      }

      // Overlap check
      const hasOverlap = state.leaveRequests.some((r) => {
        if (r.employee_id !== emp.id) return false
        if (r.status === 'REJECTED' || r.status === 'WITHDRAWN' || r.status === 'CANCELLED') return false
        return !(r.end_date < params.startDate || r.start_date > params.endDate)
      })

      if (hasOverlap) {
        return {
          success: false,
          error: 'An existing active leave request already overlaps with these selected dates.',
        }
      }

      const reqNum = `LR-2026-${String(state.leaveRequests.length + 1).padStart(4, '0')}`
      const newRequest: LeaveRequestRecord = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        request_number: reqNum,
        employee_id: emp.id,
        employee_name: emp.full_name,
        employee_code: emp.employee_code,
        department_name: emp.department_name,
        leave_type_id: lt.id,
        leave_type_code: lt.code,
        leave_type_name: lt.name,
        leave_type_color: lt.color,
        start_date: params.startDate,
        end_date: params.endDate,
        day_type: params.dayType,
        total_days: duration.workingDays,
        reason: params.reason.trim(),
        handover_notes: params.handoverNotes?.trim(),
        emergency_contact: params.emergencyContact?.trim(),
        status: 'PENDING_MANAGER_APPROVAL',
        current_approver_role: 'MANAGER',
        current_approver_id: emp.manager_id || undefined,
        manager_name: emp.manager_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Update state
      let createdRequest: LeaveRequestRecord = newRequest
      setState((prev) => {
        // Reserve balance
        const updatedBalances = prev.leaveBalances.map((b) => {
          if (b.employee_id === emp.id && b.leave_type_id === lt.id && b.fiscal_year === 2026) {
            return {
              ...b,
              pending: b.pending + duration.workingDays,
              available_balance: Math.max(0, b.available_balance - duration.workingDays),
            }
          }
          return b
        })

        // Action record
        const action: ApprovalActionRecord = {
          id: `act-${Date.now()}`,
          leave_request_id: newRequest.id,
          actor_id: emp.id,
          actor_name: emp.full_name,
          actor_role: 'EMPLOYEE',
          action: 'SUBMITTED',
          comments: 'Submitted application for manager approval',
          created_at: new Date().toISOString(),
        }

        // Notification for manager
        const notifs = [...prev.notifications]
        if (emp.manager_id) {
          notifs.unshift({
            id: `notif-${Date.now()}`,
            user_id: emp.manager_id,
            title: `New Leave Request: ${emp.full_name}`,
            message: `${emp.full_name} submitted ${duration.workingDays} days of ${lt.name} (${params.startDate} to ${params.endDate}) for your review.`,
            link: '/manager/approvals',
            is_read: false,
            created_at: new Date().toISOString(),
          })
        }

        const next = {
          ...prev,
          leaveRequests: [newRequest, ...prev.leaveRequests],
          leaveBalances: updatedBalances,
          approvalActions: [action, ...prev.approvalActions],
          notifications: notifs,
        }
        persistStoreState(next)
        createdRequest = newRequest
        return next
      })

      return { success: true, request: createdRequest }
    },
    [state.currentUser, state.employees, state.leaveTypes, state.leaveBalances, state.leaveRequests, calculateDuration]
  )

  // Withdraw leave
  const withdrawLeave = useCallback((requestId: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req) {
        result = { success: false, error: 'Leave request not found' }
        return prev
      }
      if (req.status !== 'PENDING_MANAGER_APPROVAL' && req.status !== 'PENDING_HR_APPROVAL' && req.status !== 'CLARIFICATION_REQUESTED') {
        result = { success: false, error: 'Only pending or clarification requests can be withdrawn' }
        return prev
      }

      // Refund pending balance back to available
      const updatedBalances = prev.leaveBalances.map((b) => {
        if (b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id && b.fiscal_year === 2026) {
          return {
            ...b,
            pending: Math.max(0, b.pending - req.total_days),
            available_balance: b.available_balance + req.total_days,
          }
        }
        return b
      })

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'WITHDRAWN' as LeaveStatus,
            current_approver_role: null,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || req.employee_id,
        actor_name: prev.currentUser?.fullName || req.employee_name,
        actor_role: 'EMPLOYEE',
        action: 'WITHDRAWN',
        comments: 'Employee withdrew the leave application',
        created_at: new Date().toISOString(),
      }

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        leaveBalances: updatedBalances,
        approvalActions: [action, ...prev.approvalActions],
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // Manager Approve
  const managerApprove = useCallback((requestId: string, comments?: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req) {
        result = { success: false, error: 'Request not found' }
        return prev
      }
      if (req.status !== 'PENDING_MANAGER_APPROVAL') {
        result = { success: false, error: 'Request is not pending manager approval' }
        return prev
      }

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'PENDING_HR_APPROVAL' as LeaveStatus,
            current_approver_role: 'HR' as const,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || 'mgr-1',
        actor_name: prev.currentUser?.fullName || 'Reporting Manager',
        actor_role: 'MANAGER',
        action: 'APPROVED',
        comments: comments || 'Approved by Reporting Manager and forwarded to HR',
        created_at: new Date().toISOString(),
      }

      // Notify HR and Employee
      const hrAdmin = prev.employees.find((e) => e.roles.includes('HR_ADMIN'))
      const notifs = [...prev.notifications]
      if (hrAdmin) {
        notifs.unshift({
          id: `notif-${Date.now()}-1`,
          user_id: hrAdmin.id,
          title: `HR Action Required: ${req.employee_name}`,
          message: `${req.employee_name}'s leave request (${req.total_days} days) was approved by manager and requires final HR sign-off.`,
          link: '/hr/approvals',
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }
      notifs.unshift({
        id: `notif-${Date.now()}-2`,
        user_id: req.employee_id,
        title: `Manager Approved: ${req.request_number}`,
        message: `Your manager approved your leave application. It has been routed to HR for final confirmation.`,
        link: '/employee/my-leaves',
        is_read: false,
        created_at: new Date().toISOString(),
      })

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        approvalActions: [action, ...prev.approvalActions],
        notifications: notifs,
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // Manager Reject
  const managerReject = useCallback((requestId: string, reason: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req) {
        result = { success: false, error: 'Request not found' }
        return prev
      }

      // Release reserved balance back to available
      const updatedBalances = prev.leaveBalances.map((b) => {
        if (b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id && b.fiscal_year === 2026) {
          return {
            ...b,
            pending: Math.max(0, b.pending - req.total_days),
            available_balance: b.available_balance + req.total_days,
          }
        }
        return b
      })

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'REJECTED' as LeaveStatus,
            rejection_reason: reason,
            current_approver_role: null,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || 'mgr-1',
        actor_name: prev.currentUser?.fullName || 'Reporting Manager',
        actor_role: 'MANAGER',
        action: 'REJECTED',
        comments: reason,
        created_at: new Date().toISOString(),
      }

      const notifs = [
        {
          id: `notif-${Date.now()}`,
          user_id: req.employee_id,
          title: `Leave Application Rejected: ${req.request_number}`,
          message: `Your manager rejected your leave application. Reason: ${reason}`,
          link: '/employee/my-leaves',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev.notifications,
      ]

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        leaveBalances: updatedBalances,
        approvalActions: [action, ...prev.approvalActions],
        notifications: notifs,
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // Manager Request Clarification
  const managerRequestClarification = useCallback((requestId: string, question: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req) {
        result = { success: false, error: 'Request not found' }
        return prev
      }

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'CLARIFICATION_REQUESTED' as LeaveStatus,
            clarification_question: question,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || 'mgr-1',
        actor_name: prev.currentUser?.fullName || 'Reporting Manager',
        actor_role: 'MANAGER',
        action: 'CLARIFICATION_REQUESTED',
        comments: question,
        created_at: new Date().toISOString(),
      }

      const notifs = [
        {
          id: `notif-${Date.now()}`,
          user_id: req.employee_id,
          title: `Clarification Requested: ${req.request_number}`,
          message: `Your manager requested clarification: "${question}". Please open My Leaves to reply.`,
          link: '/employee/my-leaves',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev.notifications,
      ]

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        approvalActions: [action, ...prev.approvalActions],
        notifications: notifs,
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // Employee Reply to Clarification
  const employeeReplyClarification = useCallback((requestId: string, reply: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req) {
        result = { success: false, error: 'Request not found' }
        return prev
      }

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'PENDING_MANAGER_APPROVAL' as LeaveStatus,
            clarification_reply: reply,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || req.employee_id,
        actor_name: prev.currentUser?.fullName || req.employee_name,
        actor_role: 'EMPLOYEE',
        action: 'REPLIED',
        comments: reply,
        created_at: new Date().toISOString(),
      }

      const notifs = [...prev.notifications]
      if (req.current_approver_id) {
        notifs.unshift({
          id: `notif-${Date.now()}`,
          user_id: req.current_approver_id,
          title: `Clarification Provided: ${req.employee_name}`,
          message: `${req.employee_name} replied: "${reply}". The request is back in your pending queue.`,
          link: '/manager/approvals',
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        approvalActions: [action, ...prev.approvalActions],
        notifications: notifs,
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // HR Final Approve
  const hrFinalApprove = useCallback((requestId: string, comments?: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req) {
        result = { success: false, error: 'Request not found' }
        return prev
      }
      if (req.status !== 'PENDING_HR_APPROVAL') {
        result = { success: false, error: 'Request is not pending HR approval' }
        return prev
      }

      // Convert pending reservation into permanent used deduction
      let balanceAfter = 0
      const updatedBalances = prev.leaveBalances.map((b) => {
        if (b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id && b.fiscal_year === 2026) {
          const newUsed = b.used + req.total_days
          const newPending = Math.max(0, b.pending - req.total_days)
          balanceAfter = b.available_balance
          return {
            ...b,
            used: newUsed,
            pending: newPending,
          }
        }
        return b
      })

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'APPROVED' as LeaveStatus,
            current_approver_role: null,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || 'hr-1',
        actor_name: prev.currentUser?.fullName || 'HR Manager',
        actor_role: 'HR_ADMIN',
        action: 'APPROVED',
        comments: comments || 'Final approval granted by HR Department',
        created_at: new Date().toISOString(),
      }

      const ledgerEntry: LedgerRecord = {
        id: `led-${Date.now()}`,
        employee_id: req.employee_id,
        leave_type_id: req.leave_type_id,
        transaction_type: 'APPROVED_DEDUCTION',
        amount: req.total_days,
        balance_after: balanceAfter,
        reason: `Final approval for ${req.request_number}`,
        created_at: new Date().toISOString(),
      }

      const notifs = [
        {
          id: `notif-${Date.now()}`,
          user_id: req.employee_id,
          title: `Leave Approved: ${req.request_number}`,
          message: `Your ${req.leave_type_name} request from ${req.start_date} to ${req.end_date} (${req.total_days} days) has been officially approved.`,
          link: '/employee/my-leaves',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev.notifications,
      ]

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        leaveBalances: updatedBalances,
        approvalActions: [action, ...prev.approvalActions],
        ledger: [ledgerEntry, ...prev.ledger],
        notifications: notifs,
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // HR Reject
  const hrReject = useCallback((requestId: string, reason: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req) {
        result = { success: false, error: 'Request not found' }
        return prev
      }

      // Release reserved balance
      const updatedBalances = prev.leaveBalances.map((b) => {
        if (b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id && b.fiscal_year === 2026) {
          return {
            ...b,
            pending: Math.max(0, b.pending - req.total_days),
            available_balance: b.available_balance + req.total_days,
          }
        }
        return b
      })

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'REJECTED' as LeaveStatus,
            rejection_reason: reason,
            current_approver_role: null,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || 'hr-1',
        actor_name: prev.currentUser?.fullName || 'HR Manager',
        actor_role: 'HR_ADMIN',
        action: 'REJECTED',
        comments: reason,
        created_at: new Date().toISOString(),
      }

      const notifs = [
        {
          id: `notif-${Date.now()}`,
          user_id: req.employee_id,
          title: `Leave Application Rejected by HR: ${req.request_number}`,
          message: `HR Department rejected your application. Reason: ${reason}`,
          link: '/employee/my-leaves',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev.notifications,
      ]

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        leaveBalances: updatedBalances,
        approvalActions: [action, ...prev.approvalActions],
        notifications: notifs,
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // Cancel Approved Leave
  const cancelApprovedLeave = useCallback((requestId: string, reason: string) => {
    let result = { success: false, error: '' }
    setState((prev) => {
      const req = prev.leaveRequests.find((r) => r.id === requestId)
      if (!req || req.status !== 'APPROVED') {
        result = { success: false, error: 'Only approved leaves can be cancelled' }
        return prev
      }

      // Refund used balance back to available
      let balanceAfter = 0
      const updatedBalances = prev.leaveBalances.map((b) => {
        if (b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id && b.fiscal_year === 2026) {
          const newUsed = Math.max(0, b.used - req.total_days)
          const newAvail = b.available_balance + req.total_days
          balanceAfter = newAvail
          return {
            ...b,
            used: newUsed,
            available_balance: newAvail,
          }
        }
        return b
      })

      const updatedRequests = prev.leaveRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'CANCELLED' as LeaveStatus,
            updated_at: new Date().toISOString(),
          }
        }
        return r
      })

      const action: ApprovalActionRecord = {
        id: `act-${Date.now()}`,
        leave_request_id: requestId,
        actor_id: prev.currentUser?.id || req.employee_id,
        actor_name: prev.currentUser?.fullName || req.employee_name,
        actor_role: prev.currentUser?.roles?.[0] || 'EMPLOYEE',
        action: 'CANCELLED',
        comments: reason,
        created_at: new Date().toISOString(),
      }

      const ledgerEntry: LedgerRecord = {
        id: `led-${Date.now()}`,
        employee_id: req.employee_id,
        leave_type_id: req.leave_type_id,
        transaction_type: 'REVERSAL',
        amount: req.total_days,
        balance_after: balanceAfter,
        reason: `Reversal for cancelled leave ${req.request_number}`,
        created_at: new Date().toISOString(),
      }

      const next = {
        ...prev,
        leaveRequests: updatedRequests,
        leaveBalances: updatedBalances,
        approvalActions: [action, ...prev.approvalActions],
        ledger: [ledgerEntry, ...prev.ledger],
      }
      persistStoreState(next)
      result = { success: true, error: '' }
      return next
    })
    return result
  }, [])

  // Notifications
  const markNotificationAsRead = useCallback((id: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      }
      persistStoreState(next)
      return next
    })
  }, [])

  const markAllNotificationsAsRead = useCallback(() => {
    setState((prev) => {
      const curId = prev.currentUser?.id
      const next = {
        ...prev,
        notifications: prev.notifications.map((n) => (n.user_id === curId ? { ...n, is_read: true } : n)),
      }
      persistStoreState(next)
      return next
    })
  }, [])

  // HR Employee Management
  const addEmployee = useCallback((empData: Omit<EmployeeRecord, 'id'>) => {
    setState((prev) => {
      const newId = `emp-${Date.now()}`
      const newEmp: EmployeeRecord = {
        id: newId,
        ...empData,
      }
      // Initialize balances for the new employee
      const newBalances: LeaveBalanceRecord[] = prev.leaveTypes.map((lt, idx) => ({
        id: `bal-${newId}-${idx}`,
        employee_id: newId,
        leave_type_id: lt.id,
        fiscal_year: 2026,
        opening_balance: lt.annual_entitlement,
        accrued: lt.annual_entitlement,
        used: 0,
        pending: 0,
        adjusted: 0,
        carried_forward: 0,
        available_balance: lt.annual_entitlement,
      }))

      const next = {
        ...prev,
        employees: [...prev.employees, newEmp],
        leaveBalances: [...prev.leaveBalances, ...newBalances],
      }
      persistStoreState(next)
      return next
    })
  }, [])

  const updateEmployee = useCallback((id: string, updates: Partial<EmployeeRecord>) => {
    setState((prev) => {
      const next = {
        ...prev,
        employees: prev.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }
      persistStoreState(next)
      return next
    })
  }, [])

  const toggleEmployeeActive = useCallback((id: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        employees: prev.employees.map((e) => (e.id === id ? { ...e, is_active: !e.is_active } : e)),
      }
      persistStoreState(next)
      return next
    })
  }, [])

  // HR Policy & Holiday Management
  const addHoliday = useCallback((name: string, date: string, type: string = 'PUBLIC') => {
    setState((prev) => {
      const newHol: HolidayRecord = {
        id: `hol-${Date.now()}`,
        name,
        date,
        type,
      }
      const next = { ...prev, holidays: [...prev.holidays, newHol] }
      persistStoreState(next)
      return next
    })
  }, [])

  const deleteHoliday = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, holidays: prev.holidays.filter((h) => h.id !== id) }
      persistStoreState(next)
      return next
    })
  }, [])

  const updateLeaveQuota = useCallback((leaveTypeId: string, quota: number) => {
    setState((prev) => {
      const next = {
        ...prev,
        leaveTypes: prev.leaveTypes.map((t) => (t.id === leaveTypeId ? { ...t, annual_entitlement: quota } : t)),
      }
      persistStoreState(next)
      return next
    })
  }, [])

  const setWeeklyOffSchedule = useCallback((days: number[]) => {
    setState((prev) => {
      const next = { ...prev, weeklyOffDays: days }
      persistStoreState(next)
      return next
    })
  }, [])

  // Reset Demo Data
  const resetDemoData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    const fresh = getInitialStoreState()
    persistStoreState(fresh)
    updateSessionCookie(fresh.currentUser)
    setState(fresh)
  }, [updateSessionCookie])

  const value = useMemo(
    () => ({
      state,
      currentUser: state.currentUser,
      setCurrentUser,
      switchUser,
      calculateDuration,
      submitLeave,
      withdrawLeave,
      managerApprove,
      managerReject,
      managerRequestClarification,
      employeeReplyClarification,
      hrFinalApprove,
      hrReject,
      cancelApprovedLeave,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addEmployee,
      updateEmployee,
      toggleEmployeeActive,
      addHoliday,
      deleteHoliday,
      updateLeaveQuota,
      setWeeklyOffSchedule,
      resetDemoData,
    }),
    [
      state,
      setCurrentUser,
      switchUser,
      calculateDuration,
      submitLeave,
      withdrawLeave,
      managerApprove,
      managerReject,
      managerRequestClarification,
      employeeReplyClarification,
      hrFinalApprove,
      hrReject,
      cancelApprovedLeave,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addEmployee,
      updateEmployee,
      toggleEmployeeActive,
      addHoliday,
      deleteHoliday,
      updateLeaveQuota,
      setWeeklyOffSchedule,
      resetDemoData,
    ]
  )

  return <ElmsStoreContext.Provider value={value}>{children}</ElmsStoreContext.Provider>
}

export function useElmsStore() {
  const ctx = useContext(ElmsStoreContext)
  if (!ctx) {
    throw new Error('useElmsStore must be used within an ElmsStoreProvider')
  }
  return ctx
}
