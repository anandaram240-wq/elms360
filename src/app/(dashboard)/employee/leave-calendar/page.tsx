'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  isWithinInterval,
  addDays,
} from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useMyLeaveRequests,
  useCompanyHolidays,
} from '@/hooks/queries/use-employee-queries'

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date())
  const [viewMode, setViewMode] = React.useState<'month' | 'week'>('month')

  // Fetch employee's leave requests
  const { data: requestData, isLoading: loadingRequests } = useMyLeaveRequests({
    page: 1,
    pageSize: 100,
  })

  // Fetch holidays for the displayed year
  const { data: holidays = [], isLoading: loadingHolidays } = useCompanyHolidays(
    currentDate.getFullYear()
  )

  const requests = requestData?.data || []

  // Month navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate((d) => subMonths(d, 1))
    } else {
      setCurrentDate((d) => subWeeks(d, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate((d) => addMonths(d, 1))
    } else {
      setCurrentDate((d) => addWeeks(d, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Days interval to render
  const days = React.useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      const startDate = startOfWeek(monthStart)
      const endDate = endOfWeek(monthEnd)
      return eachDayOfInterval({ start: startDate, end: endDate })
    } else {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }
  }, [currentDate, viewMode])

  // Find leaves and holidays for a given date
  const getEventsForDay = (date: Date) => {
    const formatted = format(date, 'yyyy-MM-dd')

    // Find holiday
    const holiday = holidays.find((h) => h.date === formatted)

    // Find matching leave requests
    const matchingLeaves = requests.filter((r) => {
      if (['REJECTED', 'WITHDRAWN', 'CANCELLED'].includes(r.status)) return false
      const start = parseISO(r.startDate)
      const end = parseISO(r.endDate)
      return isWithinInterval(date, { start, end })
    })

    return { holiday, leaves: matchingLeaves }
  }

  // Download ICS File for approved leaves
  const handleDownloadICS = () => {
    const approved = requests.filter((r) => r.status === 'APPROVED')
    if (approved.length === 0) {
      alert('No approved leaves available to export.')
      return
    }

    const events = approved.map((l) => {
      const startClean = l.startDate.replace(/-/g, '')
      const endPlusOne = format(addDays(parseISO(l.endDate), 1), 'yyyyMMdd')
      return [
        'BEGIN:VEVENT',
        `UID:${l.id}@elms360.com`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART;VALUE=DATE:${startClean}`,
        `DTEND;VALUE=DATE:${endPlusOne}`,
        `SUMMARY:${l.leaveTypeName} (ELMS 360)`,
        `DESCRIPTION:${l.reason.replace(/\n/g, ' ')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n')
    })

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ELMS 360//Employee Leave Calendar//EN',
      'CALSCALE:GREGORIAN',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `approved-leaves-${format(new Date(), 'yyyyMMdd')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            My Leave Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual month & week schedule of your approved time-off, pending requests, and company holidays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week View
            </button>
          </div>

          {/* Download ICS */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadICS}
            className="gap-2 text-xs"
          >
            <Download className="h-4 w-4" />
            Export ICS
          </Button>

          <Button asChild size="sm" className="gap-2 bg-primary text-primary-foreground font-medium text-xs">
            <Link href="/employee/apply-leave">
              <CalendarPlus className="h-4 w-4" />
              Apply Leave
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMMM d, yyyy")}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleToday} className="text-xs">
              Today
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrev} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold py-2.5 text-muted-foreground">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              const { holiday, leaves } = getEventsForDay(day)

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] p-2 transition-colors flex flex-col justify-between ${
                    !isCurrentMonth ? 'bg-muted/15 text-muted-foreground/60' : 'bg-card'
                  } ${isWeekend ? 'bg-muted/5' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full ${
                        isCurrentDay
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {holiday && (
                      <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 px-1.5 py-0.5 rounded truncate max-w-[70px]">
                        Holiday
                      </span>
                    )}
                  </div>

                  {/* Day Events */}
                  <div className="space-y-1 mt-1 flex-1">
                    {/* Holiday badge */}
                    {holiday && (
                      <div className="p-1 rounded bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-[10px] text-purple-800 dark:text-purple-300 font-medium truncate">
                        🎉 {holiday.name}
                      </div>
                    )}

                    {/* Leaves */}
                    {leaves.map((leave) => {
                      const isApproved = leave.status === 'APPROVED'

                      return (
                        <Link
                          key={leave.id}
                          href={`/employee/my-leaves/${leave.id}`}
                          className="block"
                        >
                          <div
                            className={`p-1 rounded text-[11px] font-medium truncate cursor-pointer transition-opacity hover:opacity-80 ${
                              isApproved
                                ? 'text-white shadow-xs'
                                : 'bg-amber-100 border border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                            style={
                              isApproved
                                ? { backgroundColor: leave.leaveTypeColor || '#10b981' }
                                : undefined
                            }
                          >
                            <span className="truncate">
                              {isApproved ? '✓ ' : '⏳ '}
                              {leave.leaveTypeName}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl border bg-card text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
          <span className="text-muted-foreground">Approved Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-dashed border-amber-500 bg-amber-100 inline-block" />
          <span className="text-muted-foreground">Pending Approval</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple-500 inline-block" />
          <span className="text-muted-foreground">Company Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-muted/60 inline-block" />
          <span className="text-muted-foreground">Weekend</span>
        </div>
      </div>
    </div>
  )
}
