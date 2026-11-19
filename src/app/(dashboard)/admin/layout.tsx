import * as React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { AppLayout } from '@/components/layout/app-layout'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Verify role authorization
  if (user) {
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN')
    if (!isSuperAdmin) {
      redirect('/employee/dashboard')
    }
  }

  // Display user details or fallback to demo Super Admin
  const displayUser = user
    ? {
        name: user.fullName,
        email: user.email,
        role: 'Super Administrator',
        avatarUrl: user.avatarUrl,
      }
    : {
        name: 'Vikram Malhotra',
        email: 'admin@abctech.com',
        role: 'Super Administrator',
      }

  return (
    <AppLayout
      role="ADMIN"
      title="System Administration"
      user={displayUser}
      pendingApprovalsCount={0}
    >
      {children}
    </AppLayout>
  )
}
