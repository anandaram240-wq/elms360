'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  Calendar as CalendarIcon,
  PieChart,
  Bell,
  User,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { signOut } from '@/app/actions/auth'
import { useUnreadNotificationCount, useMyNotifications } from '@/hooks/queries/use-employee-queries'

const employeeNavItems = [
  { title: 'Overview', href: '/employee/dashboard', icon: LayoutDashboard },
  { title: 'Apply Leave', href: '/employee/apply-leave', icon: CalendarPlus },
  { title: 'My Leaves', href: '/employee/my-leaves', icon: CalendarCheck },
  { title: 'Leave Balance', href: '/employee/leave-balance', icon: PieChart },
  { title: 'Leave Calendar', href: '/employee/leave-calendar', icon: CalendarIcon },
  { title: 'Notifications', href: '/employee/notifications', icon: Bell },
  { title: 'My Profile', href: '/employee/profile', icon: User },
]

export interface EmployeeLayoutClientProps {
  children: React.ReactNode
  user: {
    name: string
    email?: string
    avatarUrl?: string
    role: string
  }
}

export function EmployeeLayoutClient({ children, user }: EmployeeLayoutClientProps) {
  const router = useRouter()
  const { data: unreadCount = 0 } = useUnreadNotificationCount()
  const { data: notifs = [] } = useMyNotifications('all')

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Format notifications for the notification panel
  const formattedNotifications = notifs.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    isRead: n.isRead,
    type: (n.type.includes('APPROVED')
      ? 'success'
      : n.type.includes('REJECTED')
      ? 'error'
      : 'info') as 'info' | 'success' | 'warning' | 'error',
    linkUrl: n.leaveRequestId ? `/employee/my-leaves/${n.leaveRequestId}` : '/employee/notifications',
  }))

  return (
    <AppLayout
      role="EMPLOYEE"
      title="Employee Portal"
      navItems={employeeNavItems}
      user={user}
      unreadNotificationsCount={unreadCount}
      notifications={formattedNotifications}
      onNotificationClick={(notif) => {
        if (notif.linkUrl) {
          router.push(notif.linkUrl)
        }
      }}
      onSignOut={handleSignOut}
    >
      {children}
    </AppLayout>
  )
}
