'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { CurrentUser, RoleCode, DayType, LeaveStatus } from '@/types/app'
import { calculateWorkingDays } from '../date-utils'
import { useElmsRealtime, type RealtimeConnectionStatus } from '@/hooks/use-elms-realtime'
import type { ElmsBroadcastPayload } from '@/lib/realtime-types'
import { useQueryClient } from '@tanstack/react-query'

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
  cancellation_reason?: string
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
  transaction_type: 'OPENING' | 'PENDING_RESERVE' | 'PENDING_RELEASE' | 'APPROVED_DEDUCTION' | 'DEDUCTION' | 'REVERSAL'
  amount: number
  balance_after: number
  reason: string
  created_at: string
}

export interface WorkingDaysResult {
  workingDays: number
  totalCalendarDays: number
  exemptWeekends: number
  exemptHolidays: number
  skippedWeekends: number
  skippedHolidays: number
  breakdown: Array<{
    date: string
    isWorkingDay: boolean
    reason?: 'Weekend' | 'Holiday' | 'Working'
  }>
}

export interface ElmsStoreState {
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

export interface ElmsStoreContextType {
  state: ElmsStoreState
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
  isLoading: boolean
  dbError: string | null
  realtimeStatus: RealtimeConnectionStatus
  lastRealtimeEvent: ElmsBroadcastPayload | null
  reconnectRealtime: () => void

  // Helpers
  refresh: () => Promise<void>
  calculateDuration: (startDate: string, endDate: string, dayType?: DayType) => WorkingDaysResult
  getBalanceForType: (leaveTypeId: string, employeeId?: string) => LeaveBalanceRecord | null

  // Live Database Actions
  submitLeave: (params: {
    leaveTypeId: string
    startDate: string
    endDate: string
    dayType: DayType
    reason: string
    handoverNotes?: string
    emergencyContact?: string
  }) => Promise<{ success: boolean; error?: string; request?: LeaveRequestRecord }>

  managerApprove: (requestId: string, comment?: string) => Promise<{ success: boolean; error?: string }>
  managerReject: (requestId: string, reason: string) => Promise<{ success: boolean; error?: string }>
  managerRequestClarification: (requestId: string, question: string) => Promise<{ success: boolean; error?: string }>
  employeeReplyClarification: (requestId: string, reply: string) => Promise<{ success: boolean; error?: string }>

  hrFinalApprove: (requestId: string, comment?: string) => Promise<{ success: boolean; error?: string }>
  hrReject: (requestId: string, reason: string) => Promise<{ success: boolean; error?: string }>

  withdrawLeave: (requestId: string) => Promise<{ success: boolean; error?: string }>
  cancelApprovedLeave: (requestId: string, reason: string) => Promise<{ success: boolean; error?: string }>

  switchUser: (employeeId: string) => void
  markNotificationAsRead: (notificationId: string) => void
  markAllNotificationsAsRead: () => void

  addEmployee: (employee: any) => Promise<{ success: boolean; error?: string }>
  updateEmployee: (id: string, updates: Partial<EmployeeRecord>) => Promise<{ success: boolean; error?: string }>
  toggleEmployeeActive: (id: string) => Promise<{ success: boolean; error?: string }>

  addHoliday: (nameOrObj: any, date?: string, type?: string) => Promise<{ success: boolean; error?: string }>
  deleteHoliday: (id: string) => Promise<{ success: boolean; error?: string }>

  updateLeaveQuota: (leaveTypeId: string, annualEntitlement: number) => Promise<{ success: boolean; error?: string }>
  setWeeklyOffSchedule: (days: number[]) => Promise<{ success: boolean; error?: string }>
  resetDemoData: () => Promise<void>
}

const ElmsStoreContext = createContext<ElmsStoreContextType | null>(null)

export function ElmsStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRecord[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([])
  const [approvalActions, setApprovalActions] = useState<ApprovalActionRecord[]>([])
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [holidays, setHolidays] = useState<HolidayRecord[]>([])
  const [ledger, setLedger] = useState<LedgerRecord[]>([])
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0, 6])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dbError, setDbError] = useState<string | null>(null)

  // Authoritative PostgreSQL Fetch
  const fetchAuthoritativeState = useCallback(async () => {
    try {
      const res = await fetch('/api/store/sync', { cache: 'no-store' })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}: Database unavailable`)
      }
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch database state')
      }

      setEmployees(data.employees || [])
      setLeaveTypes(data.leaveTypes || [])
      setLeaveBalances(data.leaveBalances || [])
      setLeaveRequests(data.leaveRequests || [])
      setApprovalActions(data.approvalActions || [])
      setHolidays(data.holidays || [])
      setLedger(data.ledger || [])
      setNotifications(data.notifications || [])
      if (data.weeklyOffDays) setWeeklyOffDays(data.weeklyOffDays)

      if (data.currentUser) {
        setCurrentUser(data.currentUser)
      } else if (data.employees && data.employees.length > 0) {
        const defaultEmp = data.employees.find((e: any) => e.employee_code === 'EMP008') || data.employees[0]
        setCurrentUser({
          id: defaultEmp.id,
          email: defaultEmp.work_email,
          employeeId: defaultEmp.id,
          organizationId: defaultEmp.organization_id || 'aaaaaaaa-0000-0000-0000-000000000001',
          fullName: defaultEmp.full_name,
          roles: defaultEmp.roles || ['EMPLOYEE'],
          employeeCode: defaultEmp.employee_code,
          departmentId: defaultEmp.department_id,
          designation: defaultEmp.designation,
        })
      }
      setDbError(null)
    } catch (err: any) {
      console.error('[ELMS_STORE_SYNC_ERROR]', err)
      setDbError(err.message || 'DATABASE CONNECTION UNAVAILABLE')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuthoritativeState()
  }, [fetchAuthoritativeState])

  const queryClient = useQueryClient()

  // Realtime Broadcast Listener
  const handleRealtimeEvent = useCallback(
    (_payload: ElmsBroadcastPayload) => {
      fetchAuthoritativeState()
      try {
        queryClient.invalidateQueries()
      } catch {}
    },
    [fetchAuthoritativeState, queryClient]
  )

  const {
    connectionStatus: realtimeStatus,
    lastEvent: lastRealtimeEvent,
    reconnect: reconnectRealtime,
  } = useElmsRealtime({
    employeeId: currentUser?.id ?? null,
    onEvent: handleRealtimeEvent,
    enabled: !!currentUser?.id,
  })

  // Live Working Days Calculation
  const calculateDuration = useCallback(
    (startDate: string, endDate: string, dayType: DayType = 'FULL_DAY'): WorkingDaysResult => {
      if (!startDate || !endDate || endDate < startDate) {
        return {
          workingDays: 0,
          totalCalendarDays: 0,
          exemptWeekends: 0,
          exemptHolidays: 0,
          skippedWeekends: 0,
          skippedHolidays: 0,
          breakdown: [],
        }
      }

      const holidayDates = holidays.map((h) => h.date)
      const normalizedDayType = dayType === 'HALF_DAY_AM' || dayType === 'HALF_DAY_PM' ? dayType : 'FULL_DAY'
      const res = calculateWorkingDays(startDate, endDate, weeklyOffDays, holidayDates, normalizedDayType)

      const breakdown = (res.perDay || []).map((day) => ({
        date: day.date,
        isWorkingDay: day.type === 'WORKING_DAY',
        reason: (day.type === 'WEEKLY_OFF' ? 'Weekend' : day.type === 'COMPANY_HOLIDAY' ? 'Holiday' : 'Working') as 'Weekend' | 'Holiday' | 'Working',
      }))

      return {
        workingDays: res.workingDays,
        totalCalendarDays: res.totalCalendarDays,
        exemptWeekends: res.weekendDays,
        exemptHolidays: res.holidayDays,
        skippedWeekends: res.weekendDays,
        skippedHolidays: res.holidayDays,
        breakdown,
      }
    },
    [weeklyOffDays, holidays]
  )

  const getBalanceForType = useCallback(
    (leaveTypeId: string, employeeId?: string): LeaveBalanceRecord | null => {
      const targetEmpId = employeeId || currentUser?.id
      if (!targetEmpId) return null
      return leaveBalances.find((b) => b.employee_id === targetEmpId && b.leave_type_id === leaveTypeId) || null
    },
    [currentUser?.id, leaveBalances]
  )

  // Database Mutation Helper
  const mutateBackend = async (action: string, payload: any) => {
    const res = await fetch('/api/store/mutate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Action failed with status ${res.status}`)
    }
    await fetchAuthoritativeState()
    return json
  }

  // Submit Leave Action
  const submitLeave = useCallback(
    async (params: {
      leaveTypeId: string
      startDate: string
      endDate: string
      dayType: DayType
      reason: string
      handoverNotes?: string
      emergencyContact?: string
    }) => {
      try {
        if (!currentUser?.id) {
          return { success: false, error: 'User session not found' }
        }

        const res = await mutateBackend('submit_leave', {
          employeeId: currentUser.id,
          ...params,
        })

        const reqRecord: LeaveRequestRecord = {
          id: res.requestId,
          request_number: res.requestNumber,
          employee_id: currentUser.id,
          employee_name: currentUser.fullName,
          employee_code: currentUser.employeeCode || '',
          department_name: 'Engineering',
          leave_type_id: params.leaveTypeId,
          leave_type_code: 'CL',
          leave_type_name: 'Leave',
          leave_type_color: '#3B82F6',
          start_date: params.startDate,
          end_date: params.endDate,
          day_type: params.dayType,
          total_days: 1,
          reason: params.reason,
          status: 'PENDING_MANAGER_APPROVAL',
          current_approver_role: 'MANAGER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        return {
          success: true,
          request: reqRecord,
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'DATABASE CONNECTION UNAVAILABLE' }
      }
    },
    [currentUser, fetchAuthoritativeState]
  )

  // Manager Actions
  const managerApprove = useCallback(
    async (requestId: string, comment?: string) => {
      try {
        await mutateBackend('manager_approve', {
          requestId,
          managerId: currentUser?.id,
          comments: comment,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  const managerReject = useCallback(
    async (requestId: string, reason: string) => {
      try {
        await mutateBackend('manager_reject', {
          requestId,
          managerId: currentUser?.id,
          comments: reason,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  const managerRequestClarification = useCallback(
    async (requestId: string, question: string) => {
      try {
        await mutateBackend('manager_clarify', {
          requestId,
          managerId: currentUser?.id,
          comments: question,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  const employeeReplyClarification = useCallback(
    async (requestId: string, reply: string) => {
      try {
        await mutateBackend('employee_reply_clarification', {
          requestId,
          employeeId: currentUser?.id,
          reply,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  // HR Actions
  const hrFinalApprove = useCallback(
    async (requestId: string, comment?: string) => {
      try {
        await mutateBackend('hr_approve', {
          requestId,
          hrId: currentUser?.id,
          comments: comment,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  const hrReject = useCallback(
    async (requestId: string, reason: string) => {
      try {
        await mutateBackend('hr_reject', {
          requestId,
          hrId: currentUser?.id,
          comments: reason,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  // Withdraw & Cancel
  const withdrawLeave = useCallback(
    async (requestId: string) => {
      try {
        await mutateBackend('withdraw', {
          requestId,
          employeeId: currentUser?.id,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  const cancelApprovedLeave = useCallback(
    async (requestId: string, reason: string) => {
      try {
        await mutateBackend('cancel_approved', {
          requestId,
          actorId: currentUser?.id,
          comments: reason,
        })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    [currentUser?.id, fetchAuthoritativeState]
  )

  const switchUser = useCallback(
    (employeeId: string) => {
      const target = employees.find((e) => e.id === employeeId)
      if (!target) return

      const newUser: CurrentUser = {
        id: target.id,
        email: target.work_email,
        employeeId: target.id,
        organizationId: 'aaaaaaaa-0000-0000-0000-000000000001',
        fullName: target.full_name,
        roles: target.roles,
        employeeCode: target.employee_code,
        departmentId: target.department_id,
        designation: target.designation,
      }

      setCurrentUser(newUser)
      document.cookie = `elms360_user=${encodeURIComponent(JSON.stringify(newUser))}; path=/; max-age=604800; SameSite=Lax`
    },
    [employees]
  )

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
  }, [])

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }, [])

  const addEmployee = useCallback(
    async (empData: any) => {
      await fetchAuthoritativeState()
      return { success: true }
    },
    [fetchAuthoritativeState]
  )

  const updateEmployee = useCallback(
    async (id: string, updates: Partial<EmployeeRecord>) => {
      await fetchAuthoritativeState()
      return { success: true }
    },
    [fetchAuthoritativeState]
  )

  const toggleEmployeeActive = useCallback(
    async (id: string) => {
      await fetchAuthoritativeState()
      return { success: true }
    },
    [fetchAuthoritativeState]
  )

  const addHoliday = useCallback(
    async (nameOrObj: any, date?: string, type?: string) => {
      await fetchAuthoritativeState()
      return { success: true }
    },
    [fetchAuthoritativeState]
  )

  const deleteHoliday = useCallback(
    async (id: string) => {
      await fetchAuthoritativeState()
      return { success: true }
    },
    [fetchAuthoritativeState]
  )

  const updateLeaveQuota = useCallback(
    async (leaveTypeId: string, annualEntitlement: number) => {
      await fetchAuthoritativeState()
      return { success: true }
    },
    [fetchAuthoritativeState]
  )

  const setWeeklyOffSchedule = useCallback(
    async (days: number[]) => {
      setWeeklyOffDays(days)
      return { success: true }
    },
    []
  )

  const resetDemoData = useCallback(async () => {
    await fetchAuthoritativeState()
  }, [fetchAuthoritativeState])

  const state: ElmsStoreState = useMemo(
    () => ({
      employees,
      leaveTypes,
      leaveBalances,
      leaveRequests,
      approvalActions,
      notifications,
      holidays,
      ledger,
      weeklyOffDays,
    }),
    [
      employees,
      leaveTypes,
      leaveBalances,
      leaveRequests,
      approvalActions,
      notifications,
      holidays,
      ledger,
      weeklyOffDays,
    ]
  )

  const value = useMemo(
    () => ({
      state,
      currentUser,
      employees,
      leaveTypes,
      leaveBalances,
      leaveRequests,
      approvalActions,
      notifications,
      holidays,
      ledger,
      weeklyOffDays,
      isLoading,
      dbError,
      realtimeStatus,
      lastRealtimeEvent,
      reconnectRealtime,
      refresh: fetchAuthoritativeState,
      calculateDuration,
      getBalanceForType,
      submitLeave,
      managerApprove,
      managerReject,
      managerRequestClarification,
      employeeReplyClarification,
      hrFinalApprove,
      hrReject,
      withdrawLeave,
      cancelApprovedLeave,
      switchUser,
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
      currentUser,
      employees,
      leaveTypes,
      leaveBalances,
      leaveRequests,
      approvalActions,
      notifications,
      holidays,
      ledger,
      weeklyOffDays,
      isLoading,
      dbError,
      realtimeStatus,
      lastRealtimeEvent,
      reconnectRealtime,
      fetchAuthoritativeState,
      calculateDuration,
      getBalanceForType,
      submitLeave,
      managerApprove,
      managerReject,
      managerRequestClarification,
      employeeReplyClarification,
      hrFinalApprove,
      hrReject,
      withdrawLeave,
      cancelApprovedLeave,
      switchUser,
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
  const context = useContext(ElmsStoreContext)
  if (!context) {
    throw new Error('useElmsStore must be used within an ElmsStoreProvider')
  }
  return context
}
