import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { ROUTE_BY_ROLE } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user && user.roles && user.roles.length > 0) {
    const role = user.roles[0]
    redirect(ROUTE_BY_ROLE[role] || '/employee/dashboard')
  }
  redirect('/login')
}
