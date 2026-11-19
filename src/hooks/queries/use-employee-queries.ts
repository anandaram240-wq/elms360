'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getMyLeaveRequests,
  getLeaveRequestDetail,
  getMyLeaveBalances,
} from '@/app/actions/employee/leave-actions'
import {
  getMyNotifications,
  getUnreadNotificationCount,
  getCompanyHolidays,
} from '@/app/actions/employee/notification-actions'
import type { LeaveRequestFilters, PaginationParams } from '@/types/app'

/**
 * Hook to fetch paginated list of current employee's leave requests
 */
export function useMyLeaveRequests(filters?: LeaveRequestFilters & PaginationParams) {
  return useQuery({
    queryKey: ['employee', 'leave-requests', filters],
    queryFn: async () => {
      return await getMyLeaveRequests(filters)
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch detailed view of a single leave request
 */
export function useLeaveRequestDetail(id: string) {
  return useQuery({
    queryKey: ['employee', 'leave-request-detail', id],
    queryFn: async () => {
      const res = await getLeaveRequestDetail(id)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch leave balances for current employee
 */
export function useMyLeaveBalances(fiscalYear?: number) {
  return useQuery({
    queryKey: ['employee', 'leave-balances', fiscalYear],
    queryFn: async () => {
      return await getMyLeaveBalances(fiscalYear)
    },
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch notifications for current employee
 */
export function useMyNotifications(filter: 'all' | 'unread' = 'all') {
  return useQuery({
    queryKey: ['employee', 'notifications', filter],
    queryFn: async () => {
      return await getMyNotifications(filter)
    },
    staleTime: 15 * 1000,
  })
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['employee', 'unread-notifications-count'],
    queryFn: async () => {
      return await getUnreadNotificationCount()
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  })
}

/**
 * Hook to fetch company holidays for a given year
 */
export function useCompanyHolidays(year?: number) {
  return useQuery({
    queryKey: ['company', 'holidays', year || new Date().getFullYear()],
    queryFn: async () => {
      return await getCompanyHolidays(year)
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch available leave types with current balances
 */
export function useLeaveTypes(fiscalYear?: number) {
  return useQuery({
    queryKey: ['employee', 'leave-types', fiscalYear],
    queryFn: async () => {
      return await getMyLeaveBalances(fiscalYear)
    },
    staleTime: 60 * 1000,
  })
}
