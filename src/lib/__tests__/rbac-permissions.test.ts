import { describe, it } from 'node:test'
import assert from 'node:assert'

export type RoleCode = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE'

export interface UserContext {
  userId: string
  employeeId: string
  organizationId: string
  roles: RoleCode[]
}

export function canAccessRoute(roles: RoleCode[], path: string): boolean {
  if (path.startsWith('/admin')) {
    return roles.includes('SUPER_ADMIN')
  }
  if (path.startsWith('/hr')) {
    return roles.includes('HR_ADMIN') || roles.includes('SUPER_ADMIN')
  }
  if (path.startsWith('/manager')) {
    return (
      roles.includes('MANAGER') ||
      roles.includes('HR_ADMIN') ||
      roles.includes('SUPER_ADMIN')
    )
  }
  if (path.startsWith('/employee')) {
    // Any authenticated employee
    return roles.length > 0
  }
  // Public routes
  return true
}

export function canViewLeaveRequest(params: {
  user: UserContext
  requestOwnerEmployeeId: string
  requestOrganizationId: string
  directReportEmployeeIds: string[]
}): boolean {
  const { user, requestOwnerEmployeeId, requestOrganizationId, directReportEmployeeIds } = params

  // 1. Cross-organization isolation (Multi-tenant security)
  if (user.organizationId !== requestOrganizationId) {
    return false
  }

  // 2. Super admin and HR admin can view any request in their organization
  if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('HR_ADMIN')) {
    return true
  }

  // 3. Employee can view their own requests
  if (user.employeeId === requestOwnerEmployeeId) {
    return true
  }

  // 4. Manager can only view requests of their direct reports
  if (user.roles.includes('MANAGER')) {
    return directReportEmployeeIds.includes(requestOwnerEmployeeId)
  }

  return false
}

export function canApproveRequest(params: {
  approver: UserContext
  requestOwnerEmployeeId: string
  assignedApproverId: string
  currentStatus: string
}): { allowed: boolean; reason?: string } {
  const { approver, requestOwnerEmployeeId, assignedApproverId, currentStatus } = params

  // Separation of duties: Cannot approve your own leave request
  if (approver.employeeId === requestOwnerEmployeeId) {
    return { allowed: false, reason: 'Separation of duties violation: cannot approve your own leave request' }
  }

  if (currentStatus === 'PENDING_MANAGER_APPROVAL') {
    if (approver.employeeId !== assignedApproverId && !approver.roles.includes('SUPER_ADMIN')) {
      return { allowed: false, reason: 'You are not the assigned manager for this approval step' }
    }
    return { allowed: true }
  }

  if (currentStatus === 'PENDING_HR_APPROVAL') {
    if (!approver.roles.includes('HR_ADMIN') && !approver.roles.includes('SUPER_ADMIN')) {
      return { allowed: false, reason: 'Requires HR_ADMIN or SUPER_ADMIN role' }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: `Request is not pending approval (status: ${currentStatus})` }
}

describe('RBAC, Data Privacy and Security Unit Tests', () => {
  const employeeUser: UserContext = {
    userId: 'user-emp-001',
    employeeId: 'emp-001',
    organizationId: 'org-abc',
    roles: ['EMPLOYEE'],
  }

  const managerUser: UserContext = {
    userId: 'user-mgr-001',
    employeeId: 'mgr-001',
    organizationId: 'org-abc',
    roles: ['MANAGER', 'EMPLOYEE'],
  }

  const hrUser: UserContext = {
    userId: 'user-hr-001',
    employeeId: 'hr-001',
    organizationId: 'org-abc',
    roles: ['HR_ADMIN', 'EMPLOYEE'],
  }

  const superAdminUser: UserContext = {
    userId: 'user-admin-001',
    employeeId: 'admin-001',
    organizationId: 'org-abc',
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  }

  describe('Route Access Control', () => {
    it('restricts /admin routes to SUPER_ADMIN only', () => {
      assert.strictEqual(canAccessRoute(employeeUser.roles, '/admin/dashboard'), false)
      assert.strictEqual(canAccessRoute(managerUser.roles, '/admin/dashboard'), false)
      assert.strictEqual(canAccessRoute(hrUser.roles, '/admin/dashboard'), false)
      assert.strictEqual(canAccessRoute(superAdminUser.roles, '/admin/dashboard'), true)
    })

    it('restricts /hr routes to HR_ADMIN and SUPER_ADMIN', () => {
      assert.strictEqual(canAccessRoute(employeeUser.roles, '/hr/employees'), false)
      assert.strictEqual(canAccessRoute(managerUser.roles, '/hr/employees'), false)
      assert.strictEqual(canAccessRoute(hrUser.roles, '/hr/employees'), true)
      assert.strictEqual(canAccessRoute(superAdminUser.roles, '/hr/employees'), true)
    })

    it('restricts /manager routes to MANAGER, HR_ADMIN, or SUPER_ADMIN', () => {
      assert.strictEqual(canAccessRoute(employeeUser.roles, '/manager/approvals'), false)
      assert.strictEqual(canAccessRoute(managerUser.roles, '/manager/approvals'), true)
      assert.strictEqual(canAccessRoute(hrUser.roles, '/manager/approvals'), true)
      assert.strictEqual(canAccessRoute(superAdminUser.roles, '/manager/approvals'), true)
    })

    it('allows all authenticated employees into /employee routes', () => {
      assert.strictEqual(canAccessRoute(employeeUser.roles, '/employee/dashboard'), true)
      assert.strictEqual(canAccessRoute(managerUser.roles, '/employee/dashboard'), true)
    })
  })

  describe('Row Level Data Privacy and Access Scoping (Test 4 from prompt)', () => {
    it('denies employee access to another employee request via ID tampering', () => {
      const allowed = canViewLeaveRequest({
        user: employeeUser, // emp-001
        requestOwnerEmployeeId: 'emp-999', // Different employee
        requestOrganizationId: 'org-abc',
        directReportEmployeeIds: [],
      })
      assert.strictEqual(allowed, false)
    })

    it('permits employee access to their own leave request', () => {
      const allowed = canViewLeaveRequest({
        user: employeeUser,
        requestOwnerEmployeeId: 'emp-001',
        requestOrganizationId: 'org-abc',
        directReportEmployeeIds: [],
      })
      assert.strictEqual(allowed, true)
    })

    it('permits manager access to direct reports requests', () => {
      const allowed = canViewLeaveRequest({
        user: managerUser,
        requestOwnerEmployeeId: 'emp-001',
        requestOrganizationId: 'org-abc',
        directReportEmployeeIds: ['emp-001', 'emp-002'],
      })
      assert.strictEqual(allowed, true)
    })

    it('denies manager access to employees outside their direct reporting chain', () => {
      const allowed = canViewLeaveRequest({
        user: managerUser,
        requestOwnerEmployeeId: 'emp-050',
        requestOrganizationId: 'org-abc',
        directReportEmployeeIds: ['emp-001', 'emp-002'],
      })
      assert.strictEqual(allowed, false)
    })

    it('enforces strict cross-tenant organization isolation', () => {
      const allowed = canViewLeaveRequest({
        user: superAdminUser, // Super admin in org-abc
        requestOwnerEmployeeId: 'emp-other-org',
        requestOrganizationId: 'org-xyz', // Different org!
        directReportEmployeeIds: [],
      })
      assert.strictEqual(allowed, false)
    })
  })

  describe('Separation of Duties and Approval Authority', () => {
    it('prevents self-approval when manager applies for leave', () => {
      const res = canApproveRequest({
        approver: managerUser, // mgr-001
        requestOwnerEmployeeId: 'mgr-001', // Self-request
        assignedApproverId: 'mgr-001',
        currentStatus: 'PENDING_MANAGER_APPROVAL',
      })
      assert.strictEqual(res.allowed, false)
      assert.ok(res.reason?.includes('Separation of duties violation'))
    })

    it('denies approval when acting user is not the assigned manager', () => {
      const res = canApproveRequest({
        approver: managerUser, // mgr-001
        requestOwnerEmployeeId: 'emp-002',
        assignedApproverId: 'mgr-999', // Assigned to different manager
        currentStatus: 'PENDING_MANAGER_APPROVAL',
      })
      assert.strictEqual(res.allowed, false)
      assert.ok(res.reason?.includes('not the assigned manager'))
    })

    it('permits valid manager approval for assigned pending request', () => {
      const res = canApproveRequest({
        approver: managerUser,
        requestOwnerEmployeeId: 'emp-002',
        assignedApproverId: 'mgr-001',
        currentStatus: 'PENDING_MANAGER_APPROVAL',
      })
      assert.strictEqual(res.allowed, true)
    })
  })
})
