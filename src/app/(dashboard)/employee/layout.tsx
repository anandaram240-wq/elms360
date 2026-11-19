import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { EmployeeLayoutClient } from '@/components/layout/employee-layout-client'

export const dynamic = 'force-dynamic'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  const userData = {
    name: currentUser.fullName,
    email: currentUser.email,
    avatarUrl: currentUser.avatarUrl,
    role: currentUser.roles?.[0] || 'EMPLOYEE',
  }

  return <EmployeeLayoutClient user={userData}>{children}</EmployeeLayoutClient>
}
