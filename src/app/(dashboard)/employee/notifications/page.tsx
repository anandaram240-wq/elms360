'use client'

import * as React from 'react'
import Link from 'next/link'
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

export default function NotificationsPage() {
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

  // Mark single as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const res = await markNotificationAsRead(id)
      if (res.success) {
        refetch()
        refetchCount()
      }
    } catch (err: any) {
      toast.error('Failed to mark notification as read')
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead()
      if (res.success) {
        toast.success('All notifications marked as read')
        refetch()
        refetchCount()
      }
    } catch (err: any) {
      toast.error('Failed to update notifications')
    }
  }

  // Delete notification
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await deleteNotification(id)
      if (res.success) {
        toast.success('Notification removed')
        refetch()
        refetchCount()
      }
    } catch (err: any) {
      toast.error('Failed to delete notification')
    }
  }

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id)
    }
    if (n.leaveRequestId) {
      router.push(`/employee/my-leaves/${n.leaveRequestId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Realtime alerts on leave approvals, pending reviews, and policy updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-2 text-xs"
            >
              <CheckCheck className="h-4 w-4 text-primary" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setFilter('all'); setPage(1); }}
            className="text-xs"
          >
            All Notifications
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setFilter('unread'); setPage(1); }}
            className="text-xs gap-1.5"
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {displayedNotifications.length} of {notifications.length}
        </p>
      </div>

      {/* Notifications List */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Inbox className="h-10 w-10 text-muted-foreground/60 mx-auto" />
              <p className="text-base font-semibold text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'You are all caught up! No unread notifications.'
                  : 'You do not have any notifications yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start justify-between p-4 transition-colors cursor-pointer hover:bg-muted/40 ${
                    !n.isRead ? 'bg-primary/5 dark:bg-primary/10' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-4">
                    {/* Unread dot */}
                    <div className="pt-1 shrink-0">
                      <span
                        className={`block h-2 w-2 rounded-full ${
                          !n.isRead ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!n.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                          {n.title}
                        </p>
                        {n.leaveRequestId && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Request Attached
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground/75 font-mono pt-1">
                        {format(parseISO(n.createdAt), 'EEEE, MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete notification"
                      onClick={(e) => handleDelete(n.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
