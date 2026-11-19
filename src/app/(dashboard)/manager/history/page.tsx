'use client'

import * as React from 'react'
import Papa from 'papaparse'
import {
  getApprovalHistory,
  getDirectReportsDirectory,
} from '@/app/actions/manager/approval-actions'
import { PageHeader } from '@/components/shared/page-header'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  History,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ManagerApprovalHistoryPage() {
  const [historyList, setHistoryList] = React.useState<any[]>([])
  const [employees, setEmployees] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [actionFilter, setActionFilter] = React.useState<string>('ALL')
  const [employeeFilter, setEmployeeFilter] = React.useState<string>('ALL')
  const [startDate, setStartDate] = React.useState<string>('')
  const [endDate, setEndDate] = React.useState<string>('')
  const [search, setSearch] = React.useState<string>('')

  const fetchHistory = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [hist, emps] = await Promise.all([
        getApprovalHistory({
          action: actionFilter,
          employeeId: employeeFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getDirectReportsDirectory(),
      ])
      setHistoryList(hist)
      setEmployees(emps)
    } catch (err) {
      console.error('Failed to load approval history:', err)
      toast.error('Failed to load approval history')
    } finally {
      setIsLoading(false)
    }
  }, [actionFilter, employeeFilter, startDate, endDate])

  React.useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Client search filter
  const filteredList = React.useMemo(() => {
    if (!search.trim()) return historyList
    const s = search.toLowerCase()
    return historyList.filter(
      (item) =>
        item.employeeName.toLowerCase().includes(s) ||
        item.employeeCode.toLowerCase().includes(s) ||
        item.requestNumber.toLowerCase().includes(s) ||
        (item.comments && item.comments.toLowerCase().includes(s))
    )
  }, [historyList, search])

  // CSV Export
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      toast.info('No data available to export')
      return
    }

    const csvData = filteredList.map((item) => ({
      Date: new Date(item.actedAt).toLocaleString(),
      'Request Number': item.requestNumber,
      'Employee Code': item.employeeCode,
      'Employee Name': item.employeeName,
      Department: item.departmentName,
      'Leave Type': item.leaveTypeName,
      'Start Date': item.startDate,
      'End Date': item.endDate,
      'Total Days': item.totalDays,
      'Action Taken': item.action,
      Comments: item.comments,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Approval_History_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Approval history exported to CSV')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval History"
        description="Complete log of all approval decisions and comments recorded by your account."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5"
            disabled={filteredList.length === 0}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, request #, notes..."
                className="pl-8 text-sm h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Action Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CLARIFICATION_REQUESTED">Clarification</SelectItem>
                </SelectContent>
              </Select>

              {/* Employee Filter */}
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-44 h-9 text-xs">
                  <SelectValue placeholder="All Team Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Team Members</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 text-xs">
                <Input
                  type="date"
                  className="h-9 w-36 text-xs"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="From"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  className="h-9 w-36 text-xs"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Comments / Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1 text-primary" />
                      Loading approval history...
                    </TableCell>
                  </TableRow>
                ) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-1 text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No records found</p>
                      <p className="text-xs">No approval actions match your filter criteria.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <span className="font-medium text-foreground block">
                          {new Date(item.actedAt).toLocaleDateString()}
                        </span>
                        <span className="text-[11px]">
                          {new Date(item.actedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-foreground">{item.employeeName}</div>
                        <div className="text-[11px] text-muted-foreground">{item.employeeCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-foreground">#{item.requestNumber}</span>
                        <p className="text-[11px] text-muted-foreground">
                          {item.startDate} &rarr; {item.endDate} ({item.totalDays}d)
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: `${item.leaveTypeColor}15`,
                            color: item.leaveTypeColor,
                            borderColor: `${item.leaveTypeColor}30`,
                          }}
                          className="text-[10px] border"
                        >
                          {item.leaveTypeName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.action === 'APPROVED'
                              ? 'success'
                              : item.action === 'REJECTED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {item.action === 'APPROVED' ? (
                            <CheckCircle className="h-3 w-3 mr-1 inline" />
                          ) : item.action === 'REJECTED' ? (
                            <XCircle className="h-3 w-3 mr-1 inline" />
                          ) : (
                            <HelpCircle className="h-3 w-3 mr-1 inline" />
                          )}
                          {item.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-sm">
                        {item.comments ? (
                          <span className="italic text-foreground">&ldquo;{item.comments}&rdquo;</span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 border-t text-xs text-muted-foreground text-right">
            Showing {filteredList.length} action{filteredList.length === 1 ? '' : 's'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
