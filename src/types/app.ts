// ============================================================
// APPLICATION-LEVEL TYPES
// ============================================================

// Role codes
export type RoleCode = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE'

// Leave request status
export type LeaveStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER_APPROVAL'
  | 'PENDING_HR_APPROVAL'
  | 'PENDING_ADDITIONAL_APPROVAL'
  | 'CLARIFICATION_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED'

// Day types
export type DayType = 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'PARTIAL'

// Employment types
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'

// Employment status
export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_NOTICE'

// Notification types
export type NotificationType =
  | 'LEAVE_SUBMITTED'
  | 'MANAGER_APPROVAL_REQUIRED'
  | 'MANAGER_APPROVED'
  | 'MANAGER_REJECTED'
  | 'HR_APPROVAL_REQUIRED'
  | 'HR_APPROVED'
  | 'HR_REJECTED'
  | 'CLARIFICATION_REQUESTED'
  | 'LEAVE_WITHDRAWN'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLATION_APPROVED'
  | 'UPCOMING_LEAVE_REMINDER'
  | 'POLICY_UPDATED'
  | 'BALANCE_ADJUSTED'
  | 'DELEGATION_ASSIGNED'
  | 'DELEGATION_EXPIRED'

// Approval action types
export type ApprovalAction =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLARIFICATION_REQUESTED'
  | 'FORWARDED'
  | 'WITHDRAWN'
  | 'CANCELLATION_APPROVED'
  | 'DELEGATED'

// Current user context (populated after auth)
export interface CurrentUser {
  id: string // auth.users.id
  email: string
  employeeId: string
  organizationId: string
  fullName: string
  avatarUrl?: string
  roles: RoleCode[]
  employeeCode: string
  departmentId?: string
  designation?: string
}

// Leave balance display type
export interface LeaveBalanceDisplay {
  leaveTypeId: string
  leaveTypeName: string
  leaveTypeCode: string
  color: string
  openingBalance: number
  accrued: number
  used: number
  pending: number
  adjusted: number
  carriedForward: number
  closingBalance: number
  availableBalance: number
}

// Leave request with related data
export interface LeaveRequestWithDetails {
  id: string
  requestNumber: string
  employeeId: string
  employeeName: string
  employeeCode: string
  departmentName?: string | null
  leaveTypeId: string
  leaveTypeName: string
  leaveTypeColor: string
  status: LeaveStatus
  startDate: string
  endDate: string
  totalDays: number
  dayType: DayType
  reason: string
  handoverNotes?: string | null
  currentApproverName?: string | null
  rejectionReason?: string | null
  clarificationMessage?: string | null
  appliedAt?: string | null
  createdAt: string
  updatedAt: string
  approvalHistory?: ApprovalActionWithActor[]
}

export interface ApprovalActionWithActor {
  id: string
  action: ApprovalAction
  actorName: string
  actorDesignation?: string
  comments?: string
  previousStatus?: string
  newStatus: string
  actedAt: string
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter params for leave requests
export interface LeaveRequestFilters {
  status?: LeaveStatus | LeaveStatus[]
  employeeId?: string
  departmentId?: string
  leaveTypeId?: string
  startDate?: string
  endDate?: string
  search?: string
}

// Dashboard summary cards
export interface DashboardStats {
  pendingApprovals?: number
  approvedLeaves?: number
  rejectedLeaves?: number
  totalEmployees?: number
  onLeaveToday?: number
  pendingRequests?: number
}
