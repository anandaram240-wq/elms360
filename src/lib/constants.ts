import type { LeaveStatus, ApprovalAction, RoleCode } from '@/types/app'

// ---- Status colors (Tailwind classes) ----
export const STATUS_COLORS: Record<LeaveStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  PENDING_MANAGER_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  PENDING_HR_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  PENDING_ADDITIONAL_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  CLARIFICATION_REQUESTED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  WITHDRAWN: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  CANCELLATION_REQUESTED: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
}

// ---- Status labels ----
export const STATUS_LABELS: Record<LeaveStatus, string> = {
  DRAFT: 'Draft',
  PENDING_MANAGER_APPROVAL: 'Pending Manager Approval',
  PENDING_HR_APPROVAL: 'Pending HR Approval',
  PENDING_ADDITIONAL_APPROVAL: 'Pending Additional Approval',
  CLARIFICATION_REQUESTED: 'Clarification Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  CANCELLATION_REQUESTED: 'Cancellation Requested',
  CANCELLED: 'Cancelled',
}

// ---- Approval action labels ----
export const ACTION_LABELS: Record<ApprovalAction, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CLARIFICATION_REQUESTED: 'Clarification Requested',
  FORWARDED: 'Forwarded',
  WITHDRAWN: 'Withdrawn',
  CANCELLATION_APPROVED: 'Cancellation Approved',
  DELEGATED: 'Delegated',
}

// ---- Role labels ----
export const ROLE_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR_ADMIN: 'HR Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

// ---- Release Identifier ----
export const RELEASE_IDENTIFIER = 'ELMS360_V3_LIVE'

// ---- Dashboard routes by role ----
export const ROUTE_BY_ROLE: Record<RoleCode, string> = {
  SUPER_ADMIN: '/admin/dashboard',
  HR_ADMIN: '/hr/dashboard',
  MANAGER: '/manager/dashboard',
  EMPLOYEE: '/employee/dashboard',
}

// ---- Leave type icons (emoji fallbacks) ----
export const LEAVE_TYPE_ICONS: Record<string, string> = {
  PL: '🏖️',   // Privilege / Earned Leave
  SL: '🤒',   // Sick Leave
  CL: '🏠',   // Casual Leave
  ML: '🤱',   // Maternity Leave
  PaL: '👶',  // Paternity Leave
  BL: '💔',   // Bereavement Leave
  LWP: '📋',  // Leave Without Pay
  OL: '🔄',   // Optional Leave
  WFH: '💻',  // Work From Home
  DEFAULT: '📅',
}

// ---- Pagination ----
export const PAGE_SIZE = 20

// ---- File upload limits ----
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

// ---- Date formats ----
export const DATE_FORMAT = 'dd MMM yyyy'
export const DATETIME_FORMAT = 'dd MMM yyyy, hh:mm a'
export const ISO_DATE_FORMAT = 'yyyy-MM-dd'

// ---- Realtime channels ----
export const REALTIME_CHANNEL_PREFIX = 'private:employee'

// ---- Query keys ----
export const QUERY_KEYS = {
  currentUser: ['currentUser'],
  notifications: (employeeId: string) => ['notifications', employeeId],
  leaveBalance: (employeeId: string, year: number) => ['leaveBalance', employeeId, year],
  leaveRequests: (filters?: object) => ['leaveRequests', filters],
  employees: (filters?: object) => ['employees', filters],
  departments: (orgId: string) => ['departments', orgId],
  leaveTypes: (orgId: string) => ['leaveTypes', orgId],
} as const
