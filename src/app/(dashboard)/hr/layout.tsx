import * as React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { AppLayout } from '@/components/layout/app-layout'

export const dynamic = 'force-dynamic'

export default async function HRDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // If user is authenticated, check role authorization
  if (user) {
    const isHrOrAdmin = user.roles.some(
      (r) => r === 'HR_ADMIN' || r === 'SUPER_ADMIN'
    )
    if (!isHrOrAdmin) {
      redirect('/employee/dashboard')
    }
  }

  // Display user details or fallback to demo HR Admin
  const displayUser = user
    ? {
        name: user.fullName,
        email: user.email,
        role: 'HR Admin',
        avatarUrl: user.avatarUrl,
      }
    : {
        name: 'Priya Sharma',
        email: 'priya.sharma@abctech.com',
        role: 'HR Admin',
      }

  return (
    <AppLayout
      role="HR"
      title="HR Administration"
      user={displayUser}
      pendingApprovalsCount={8}
    >
      {children}
    </AppLayout>
  )
}
