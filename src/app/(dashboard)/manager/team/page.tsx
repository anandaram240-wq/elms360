'use client'

import * as React from 'react'
import { getDirectReportsDirectory } from '@/app/actions/manager/approval-actions'
import { PageHeader } from '@/components/shared/page-header'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Users,
  Search,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  History,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'

export default function ManagerTeamPage() {
  const [employees, setEmployees] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [selectedEmployee, setSelectedEmployee] = React.useState<any | null>(null)

  const loadTeam = React.useCallback(async (query?: string) => {
    setIsLoading(true)
    try {
      const data = await getDirectReportsDirectory(query)
      setEmployees(data)
    } catch (err) {
      console.error('Failed to load direct reports:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTeam(search)
  }, [loadTeam, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Team"
        description="Direct reports directory, leave status, and available leave entitlements."
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1">
            {employees.length} Direct Report{employees.length === 1 ? '' : 's'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTeam(search)}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, employee code, designation..."
              className="pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Direct Reports Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading team directory...</p>
        </div>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
            <p className="font-medium text-foreground">No team members found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? 'Try clearing your search query.' : 'You currently do not have any assigned direct reports.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <Card
              key={emp.id}
              className="hover:shadow-md transition-shadow cursor-pointer border bg-card/60 hover:bg-card flex flex-col justify-between"
              onClick={() => setSelectedEmployee(emp)}
            >
              <CardContent className="p-5 space-y-4">
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border">
                      <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                        {emp.fullName
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-sm text-foreground hover:text-primary transition-colors">
                        {emp.fullName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{emp.designation}</p>
                      <span className="text-[11px] text-muted-foreground">{emp.employeeCode}</span>
                    </div>
                  </div>

                  {/* On leave status pill */}
                  {emp.isOnLeaveToday ? (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 text-[10px] gap-1 px-1.5 py-0.5">
                      <UserX className="h-3 w-3" /> On Leave
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] gap-1 px-1.5 py-0.5">
                      <UserCheck className="h-3 w-3" /> Active Today
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="text-xs space-y-1.5 pt-2 border-t text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 shrink-0" />
                    <span>{emp.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>

                {/* Leave Balance Summary */}
                <div className="space-y-1.5 pt-2 border-t">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Available Leave Balances
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {emp.balances.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No balance records</span>
                    ) : (
                      emp.balances.slice(0, 3).map((b: any) => (
                        <div
                          key={b.code}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-muted/60 border"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: b.color }}
                          />
                          <span className="font-semibold">{b.code}:</span>
                          <span>{b.available}d</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>

              {/* Bottom footer bar */}
              <div className="px-5 py-2.5 bg-muted/20 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Joined {emp.dateOfJoining}</span>
                <span className="text-primary font-medium flex items-center gap-1">
                  View History &rarr;
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Details & History Modal */}
      <Dialog open={Boolean(selectedEmployee)} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedEmployee && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarFallback className="font-bold bg-primary/10 text-primary">
                      {selectedEmployee.fullName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-lg">{selectedEmployee.fullName}</DialogTitle>
                    <DialogDescription className="text-xs">
                      {selectedEmployee.designation} &bull; {selectedEmployee.departmentName} &bull; Code:{' '}
                      {selectedEmployee.employeeCode}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Contact Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/30 text-xs">
                <div>
                  <span className="text-muted-foreground block">Email</span>
                  <span className="font-medium text-foreground">{selectedEmployee.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Date of Joining</span>
                  <span className="font-medium text-foreground">{selectedEmployee.dateOfJoining}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Employment Type</span>
                  <span className="font-medium text-foreground">{selectedEmployee.employmentType}</span>
                </div>
              </div>

              {/* Leave Balances Grid */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Leave Balances Summary ({new Date().getFullYear()})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedEmployee.balances.map((b: any) => (
                    <div key={b.code} className="p-2.5 rounded-lg border bg-card space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                          {b.leaveTypeName}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {b.code}
                        </Badge>
                      </div>
                      <div className="flex items-baseline justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="text-sm font-bold text-emerald-600">{b.available} days</span>
                      </div>
                      <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
                        <span>Used:</span>
                        <span>{b.used} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Leave Requests History */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Leave Request History
                </h4>
                {selectedEmployee.recentLeaves.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center border rounded-md">
                    No leave requests found for this employee.
                  </p>
                ) : (
                  <div className="divide-y rounded-md border text-xs">
                    {selectedEmployee.recentLeaves.map((req: any) => (
                      <div key={req.id} className="p-2.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">#{req.requestNumber}</span>
                            <Badge
                              style={{
                                backgroundColor: `${req.color}15`,
                                color: req.color,
                                borderColor: `${req.color}30`,
                              }}
                              className="text-[10px] border"
                            >
                              {req.leaveTypeName}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            {req.startDate} to {req.endDate} &bull; {req.totalDays} days
                          </p>
                          {req.reason && (
                            <p className="text-muted-foreground italic text-[11px] line-clamp-1">
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          )}
                        </div>
                        <LeaveStatusBadge status={req.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
