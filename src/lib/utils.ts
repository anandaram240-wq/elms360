import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInDays, isDate } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toDate(date: string | Date): Date {
  if (isDate(date)) return date as Date
  return parseISO(date as string)
}

export function formatDate(date: string | Date, formatStr = 'dd MMM yyyy'): string {
  try {
    return format(toDate(date), formatStr)
  } catch {
    return String(date)
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    return format(toDate(date), 'dd MMM yyyy, hh:mm a')
  } catch {
    return String(date)
  }
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
    PENDING_MANAGER_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
    PENDING_HR_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
    PENDING_ADDITIONAL_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
    CLARIFICATION_REQUESTED: 'bg-blue-100 text-blue-700 border-blue-200',
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    WITHDRAWN: 'bg-gray-100 text-gray-700 border-gray-200',
    CANCELLATION_REQUESTED: 'bg-orange-100 text-orange-700 border-orange-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return colorMap[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_MANAGER_APPROVAL: 'Pending Manager',
    PENDING_HR_APPROVAL: 'Pending HR',
    PENDING_ADDITIONAL_APPROVAL: 'Pending Approval',
    CLARIFICATION_REQUESTED: 'Clarification Needed',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
    CANCELLATION_REQUESTED: 'Cancellation Requested',
    CANCELLED: 'Cancelled',
  }
  return labelMap[status] ?? status
}

export function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    HR_ADMIN: 'HR Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  }
  return roleMap[role] ?? role
}

export function formatDays(days: number): string {
  if (days === 1) return '1 day'
  if (Number.isInteger(days)) return `${days} days`
  return `${days.toFixed(1)} days`
}

export function calculateFiscalYear(date?: Date): number {
  const d = date ?? new Date()
  // April-March fiscal year (India standard)
  if (d.getMonth() < 3) {
    return d.getFullYear() - 1
  }
  return d.getFullYear()
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

export function getDaysDiff(start: string | Date, end: string | Date): number {
  return differenceInDays(toDate(end), toDate(start)) + 1
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
