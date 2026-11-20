'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  MailOpen,
  ArrowRight,
  Filter,
  Inbox,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useMyNotifications,
  useUnreadNotificationCount,
} from '@/hooks/queries/use-employee-queries'
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/app/actions/employee/notification-actions'

export default function ManagerNotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all')
  const { data: notifications = [], isLoading, refetch } = useMyNotifications(filter)
  const { data: unreadCount = 0, refetch: refetchCount } = useUnreadNotificationCount()

  // Pagination in memory (15 per page)
  const [page, setPage] = React.useState(1)
  const pageSize = 15

  const totalPages = Math.ceil(notifications.length / pageSize) || 1
  const displayedNotifications = React.useMemo(() => {
    const from = (page - 1) * pageSize
    return notifications.slice(from, from + pageSize)
  }, [notifications, page])

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const res = await markNotificationAsRead(id)
      if (res.success) {
        refetch()
        refetchCount()
      }
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead()
      if (res.success) {
        toast.success('All notifications marked as read')
        refetch()
        refetchCount()
      }
    } catch {
      toast.error('Failed to update notifications')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await deleteNotification(id)
      if (res.success) {
        toast.success('Notification removed')
        refetch()
        refetchCount()
      }
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id)
    }
    if (n.leaveRequestId) {
      router.push(`/manager/approvals/${n.leaveRequestId}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-[#2563EB]" />
            Manager Notifications
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Realtime updates for team leave applications, clarification replies, and approval escalations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F1F3F5] text-xs h-9 font-semibold gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-[#2563EB]" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setFilter('all')
              setPage(1)
            }}
            className={`text-xs h-8 px-3 rounded-lg font-semibold ${
              filter === 'all'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F3F5]'
            }`}
          >
            All Updates
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {notifications.length}
            </span>
          </Button>

          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setFilter('unread')
              setPage(1)
            }}
            className={`text-xs h-8 px-3 rounded-lg font-semibold ${
              filter === 'unread'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F3F5]'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#DC2626] text-white font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <Card className="border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-[#64748B] space-y-2">
              <div className="animate-spin h-6 w-6 border-2 border-[#2563EB] border-t-transparent rounded-full mx-auto" />
              <p>Fetching notifications from PostgreSQL...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-[#F1F3F5] text-[#94A3B8] flex items-center justify-center mx-auto">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-[#111827]">All Caught Up</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'You have read all your manager notifications.'
                  : 'No notification records exist in your activity feed.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F3F5]">
              {displayedNotifications.map((n) => {
                const isLeaveSub = n.type.includes('SUBMITTED') || n.type.includes('FORWARDED')
                const isApproved = n.type.includes('APPROVED')
                const isRejected = n.type.includes('REJECTED')

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer group ${
                      !n.isRead ? 'bg-[#F0F7FF]/50 hover:bg-[#EFF6FF]' : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          !n.isRead
                            ? isLeaveSub
                              ? 'bg-[#EFF6FF] text-[#2563EB]'
                              : isApproved
                              ? 'bg-[#DCFCE7] text-[#166534]'
                              : isRejected
                              ? 'bg-[#FEE2E2] text-[#991B1B]'
                              : 'bg-[#EFF6FF] text-[#2563EB]'
                            : 'bg-[#F1F3F5] text-[#64748B]'
                        }`}
                      >
                        {isLeaveSub ? (
                          <UserCheck className="h-4 w-4" />
                        ) : isApproved ? (
                          <Check className="h-4 w-4" />
                        ) : isRejected ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              !n.isRead ? 'text-[#111827]' : 'text-[#334155]'
                            }`}
                          >
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="h-2 w-2 rounded-full bg-[#2563EB] shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-[#94A3B8]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(n.createdAt), 'MMM d, yyyy · h:mm a')}
                          </span>
                          {n.leaveRequestId && (
                            <span className="text-[#2563EB] font-medium group-hover:underline flex items-center gap-0.5">
                              Open in approvals <ArrowRight className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          title="Mark as read"
                          className="h-8 w-8 text-[#64748B] hover:text-[#111827] rounded-lg"
                        >
                          <MailOpen className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(n.id, e)}
                        title="Delete notification"
                        className="h-8 w-8 text-[#64748B] hover:text-[#DC2626] rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
