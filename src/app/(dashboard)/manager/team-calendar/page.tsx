'use client'

import * as React from 'react'
import {
  getTeamLeaveCalendar,
  getDirectReportsDirectory,
  type TeamCalendarEntry,
} from '@/app/actions/manager/approval-actions'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Filter,
  RefreshCw,
  Sun,
  Clock,
  Sparkles,
} from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns'

export default function TeamCalendarPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date())
  const [viewMode, setViewMode] = React.useState<'MONTH' | 'WEEK'>('MONTH')
  const [leaves, setLeaves] = React.useState<TeamCalendarEntry[]>([])
  const [employees, setEmployees] = React.useState<any[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>('ALL')
  const [selectedLeaveType, setSelectedLeaveType] = React.useState<string>('ALL')
  const [isLoading, setIsLoading] = React.useState(true)

  // Calculate interval based on month/week view
  const startDate = React.useMemo(() => {
    if (viewMode === 'MONTH') {
      return format(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    }
    return format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }, [currentDate, viewMode])

  const endDate = React.useMemo(() => {
    if (viewMode === 'MONTH') {
      return format(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    }
    return format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }, [currentDate, viewMode])

  const fetchCalendar = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [calData, empData] = await Promise.all([
        getTeamLeaveCalendar({ startDate, endDate }),
        getDirectReportsDirectory(),
      ])
      setLeaves(calData)
      setEmployees(empData)
    } catch (err) {
      console.error('Failed to load team calendar:', err)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  React.useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate((d) => subMonths(d, 1))
    } else {
      setCurrentDate((d) => subWeeks(d, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate((d) => addMonths(d, 1))
    } else {
      setCurrentDate((d) => addWeeks(d, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Filter leaves
  const filteredLeaves = React.useMemo(() => {
    return leaves.filter((l) => {
      if (selectedEmployeeId !== 'ALL' && l.employeeId !== selectedEmployeeId) {
        return false
      }
      if (selectedLeaveType !== 'ALL' && l.leaveTypeName !== selectedLeaveType) {
        return false
      }
      return true
    })
  }, [leaves, selectedEmployeeId, selectedLeaveType])

  // Generate calendar days for month grid
  const daysInGrid = React.useMemo(() => {
    if (viewMode === 'MONTH') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    }
  }, [currentDate, viewMode])

  // Unique leave types for filter
  const leaveTypes = Array.from(new Set(leaves.map((l) => l.leaveTypeName)))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Leave Calendar"
        description="Visualize team schedule, approved leaves, and planned absences."
      >
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1">
            <Button
              size="sm"
              variant={viewMode === 'MONTH' ? 'default' : 'ghost'}
              className="text-xs h-7 px-3"
              onClick={() => setViewMode('MONTH')}
            >
              Month View
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'WEEK' ? 'default' : 'ghost'}
              className="text-xs h-7 px-3"
              onClick={() => setViewMode('WEEK')}
            >
              Week View
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCalendar()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Control bar: Month Navigation + Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Month / Period Navigation */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-bold text-foreground min-w-44 text-center">
                {viewMode === 'MONTH'
                  ? format(currentDate, 'MMMM yyyy')
                  : `Week of ${format(daysInGrid[0] || currentDate, 'MMM d, yyyy')}`}
              </h2>
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={handleToday}>
                Today
              </Button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Employee filter */}
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="All Team Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Team Members</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Leave Type filter */}
              <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="All Leave Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Leave Types</SelectItem>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {lt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid View */}
      <Card>
        <CardContent className="p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b text-center text-xs font-semibold text-muted-foreground bg-muted/40 py-2.5">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-rose-600/70">Sat</div>
            <div className="text-rose-600/70">Sun</div>
          </div>

          {/* Days Grid */}
          <div
            className={`grid grid-cols-7 divide-x divide-y ${
              viewMode === 'MONTH' ? 'auto-rows-[110px]' : 'auto-rows-[200px]'
            }`}
          >
            {daysInGrid.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const isCurMonth = isSameMonth(day, currentDate)
              const isCurDay = isToday(day)

              // Find leaves on this day
              const dayLeaves = filteredLeaves.filter(
                (l) => l.startDate <= dayStr && l.endDate >= dayStr
              )

              return (
                <div
                  key={dayStr}
                  className={`p-1.5 flex flex-col justify-between overflow-hidden transition-colors ${
                    !isCurMonth ? 'bg-muted/15 text-muted-foreground/50' : 'bg-card'
                  } ${isCurDay ? 'bg-primary/5 ring-1 ring-inset ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                        isCurDay
                          ? 'bg-primary text-primary-foreground font-bold'
                          : !isCurMonth
                          ? 'text-muted-foreground/60'
                          : 'text-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {dayLeaves.length} {dayLeaves.length === 1 ? 'leave' : 'leaves'}
                      </span>
                    )}
                  </div>

                  {/* Leave Items on this day */}
                  <div className="space-y-1 overflow-y-auto max-h-[80px] my-1 pr-0.5">
                    {dayLeaves.map((l) => (
                      <div
                        key={l.id + dayStr}
                        style={{
                          backgroundColor: `${l.leaveTypeColor}20`,
                          borderColor: `${l.leaveTypeColor}50`,
                          color: l.leaveTypeColor,
                        }}
                        className="px-1.5 py-0.5 rounded border text-[10px] font-semibold truncate flex items-center justify-between"
                        title={`${l.employeeName} (${l.leaveTypeName}) - ${l.status}`}
                      >
                        <span className="truncate">{l.employeeName}</span>
                        <span className="shrink-0 text-[9px] opacity-80">
                          {l.leaveTypeName.slice(0, 2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[9px] text-muted-foreground/60 text-right">
                    {format(day, 'EEE')}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="font-semibold text-foreground">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary/20 ring-1 ring-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Privilege Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Sick Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Casual Leave</span>
        </div>
      </div>
    </div>
  )
}
