import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getMyPendingApprovals } from '@/app/actions/manager/approval-actions'
import { AppLayout } from '@/components/layout/app-layout'
import { ROUTE_BY_ROLE } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const isAuthorized = user.roles.some((r) =>
    ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(r)
  )

  if (!isAuthorized) {
    const primaryRole = user.roles[0] || 'EMPLOYEE'
    redirect(ROUTE_BY_ROLE[primaryRole] || '/employee/dashboard')
  }

  // Fetch pending approvals count for sidebar badge
  let pendingCount = 0
  if (user.employeeId) {
    try {
      const { total } = await getMyPendingApprovals({ pageSize: 1 })
      pendingCount = total || 0
    } catch {
      pendingCount = 0
    }
  }

  return (
    <AppLayout
      role="MANAGER"
      title="Manager Portal"
      user={{
        name: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.roles.includes('SUPER_ADMIN')
          ? 'Super Admin'
          : user.roles.includes('HR_ADMIN')
          ? 'HR Admin'
          : 'Manager',
      }}
      pendingApprovalsCount={pendingCount}
    >
      {children}
    </AppLayout>
  )
}
