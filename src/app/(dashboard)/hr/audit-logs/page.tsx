'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  History,
  Download,
  Search,
  Filter,
  Eye,
  Code,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAuditLogs } from '@/app/actions/hr/hr-queries'

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<any[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [actionType, setActionType] = React.useState('ALL')
  const [resourceType, setResourceType] = React.useState('ALL')
  const [search, setSearch] = React.useState('')

  // Diff Modal
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null)
  const [diffModalOpen, setDiffModalOpen] = React.useState(false)

  const loadLogs = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAuditLogs({
        page,
        pageSize,
        actionType,
        resourceType,
      })
      setLogs(res.data)
      setTotal(res.total)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, actionType, resourceType])

  React.useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleExportCSV = () => {
    if (logs.length === 0) return
    const headers = ['Timestamp', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'Reason']
    const rows = logs.map((l) => [
      l.created_at,
      `"${l.actor_name || l.actor_email}"`,
      l.action,
      l.resource_type,
      l.resource_id || '',
      `"${l.reason || ''}"`,
    ])
    const csvStr = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${logs.length} audit records to CSV`)
  }

  const columns: ColumnDef<any>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {row.created_at?.slice(0, 19)?.replace('T', ' ')}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      cell: (row) => (
        <div>
          <span className="font-medium text-foreground text-xs">{row.actor_name}</span>
          <p className="text-[11px] text-muted-foreground">{row.actor_email}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs font-semibold">
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      cell: (row) => (
        <div>
          <span className="text-xs font-medium text-foreground">{row.resource_type}</span>
          {row.resource_id && (
            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
              {row.resource_id}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Details',
      cell: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {row.reason || 'Standard operational update'}
        </span>
      ),
    },
    {
      key: 'diff',
      header: '',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 gap-1 text-primary"
          onClick={() => {
            setSelectedLog(row)
            setDiffModalOpen(true)
          }}
        >
          <Code className="h-3.5 w-3.5" /> View Diff
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Audit Trail"
        description="Tamper-evident record of all administrative decisions, policy updates, employee profile modifications, and system overrides."
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1.5" /> Export Audit Log (CSV)
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-card p-4 rounded-lg border">
        {/* Action Type */}
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger>
            <SelectValue placeholder="All Action Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Action Types</SelectItem>
            <SelectItem value="HR_APPROVE_LEAVE">HR Approve Leave</SelectItem>
            <SelectItem value="HR_REJECT_LEAVE">HR Reject Leave</SelectItem>
            <SelectItem value="ADMIN_OVERRIDE_LEAVE_STATUS">Admin Override</SelectItem>
            <SelectItem value="UPDATE_LEAVE_POLICY">Update Leave Policy</SelectItem>
            <SelectItem value="ADJUST_LEAVE_BALANCE">Adjust Leave Balance</SelectItem>
            <SelectItem value="CREATE_EMPLOYEE">Create Employee</SelectItem>
            <SelectItem value="TRANSFER_DEPARTMENT">Transfer Department</SelectItem>
            <SelectItem value="CHANGE_MANAGER">Change Manager</SelectItem>
          </SelectContent>
        </Select>

        {/* Resource Type */}
        <Select value={resourceType} onValueChange={setResourceType}>
          <SelectTrigger>
            <SelectValue placeholder="All Resources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Resources</SelectItem>
            <SelectItem value="leave_requests">Leave Requests</SelectItem>
            <SelectItem value="leave_policies">Leave Policies</SelectItem>
            <SelectItem value="leave_balances">Leave Balances</SelectItem>
            <SelectItem value="employees">Employees</SelectItem>
            <SelectItem value="departments">Departments</SelectItem>
            <SelectItem value="organization_settings">Org Settings</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={() => {
            setActionType('ALL')
            setResourceType('ALL')
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={logs}
        totalCount={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        emptyMessage="No audit log entries recorded matching filter criteria."
      />

      {/* State JSON Diff Modal */}
      <Dialog open={diffModalOpen} onOpenChange={setDiffModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Audit Entry: {selectedLog?.action}
            </DialogTitle>
            <DialogDescription>
              Logged at {selectedLog?.created_at} by {selectedLog?.actor_name || selectedLog?.actor_email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {selectedLog?.reason && (
              <div className="p-3 bg-muted rounded border">
                <span className="font-semibold text-foreground">Justification:</span>
                <p className="text-muted-foreground mt-0.5">{selectedLog.reason}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Previous State */}
              <div className="space-y-1.5">
                <p className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Previous State (Before)
                </p>
                <pre className="p-3 bg-red-50 dark:bg-red-950/20 text-red-950 dark:text-red-200 border border-red-200 dark:border-red-900 rounded font-mono overflow-x-auto max-h-60 text-[11px]">
                  {JSON.stringify(selectedLog?.previous_state || { status: 'None' }, null, 2)}
                </pre>
              </div>

              {/* New State */}
              <div className="space-y-1.5">
                <p className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  New State (After)
                </p>
                <pre className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900 rounded font-mono overflow-x-auto max-h-60 text-[11px]">
                  {JSON.stringify(selectedLog?.new_state || { status: 'Updated' }, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setDiffModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
