import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
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
    const admin = createAdminClient()
    const { count } = await admin
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('current_approver_id', user.employeeId)
      .in('status', [
        'PENDING_MANAGER_APPROVAL',
        'PENDING_HR_APPROVAL',
        'PENDING_ADDITIONAL_APPROVAL',
        'CLARIFICATION_REQUESTED',
      ])

    pendingCount = count || 0
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
