'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  History,
  Download,
  Search,
  Filter,
  Eye,
  Shield,
  Clock,
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

export default function AdminAuditLogsPage() {
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
    link.setAttribute('download', `system_audit_trail_${new Date().toISOString().split('T')[0]}.csv`)
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
        <span className="font-mono text-xs text-[#64748B]">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      cell: (row) => (
        <div>
          <p className="font-semibold text-[#111827] text-xs">{row.actor_name || 'System / Batch'}</p>
          <p className="text-[11px] text-[#64748B]">{row.actor_email || 'automated'}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => {
        const isDelete = row.action.includes('DELETE') || row.action.includes('REJECT')
        const isCreate = row.action.includes('CREATE') || row.action.includes('APPROVE')
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold ${
              isDelete
                ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                : isCreate
                ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
            }`}
          >
            {row.action}
          </Badge>
        )
      },
    },
    {
      key: 'resource_type',
      header: 'Entity Scope',
      cell: (row) => (
        <span className="text-xs font-medium text-[#334155]">{row.resource_type}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Notes / Reason',
      cell: (row) => (
        <span className="text-xs text-[#64748B] italic line-clamp-1 max-w-xs">
          {row.reason || 'None provided'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspector',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF] font-semibold"
          onClick={() => {
            setSelectedLog(row)
            setDiffModalOpen(true)
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="System Audit Logs & Governance Trail"
        description="Immutable record of security mutations, policy adjustments, and enterprise administrative actions."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F1F3F5] h-9 text-xs font-semibold"
        >
          <Download className="h-3.5 w-3.5 mr-1.5 text-[#64748B]" /> Export CSV
        </Button>
      </PageHeader>

      {/* Filter Surface */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <span className="text-xs text-[#64748B] font-semibold">Action Filter</span>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-44 bg-white border-[#E5E7EB] text-[#111827] h-9 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CREATE">Created Records</SelectItem>
                <SelectItem value="UPDATE">Updated Records</SelectItem>
                <SelectItem value="DELETE">Deleted Records</SelectItem>
                <SelectItem value="APPROVE">Approval Decisions</SelectItem>
                <SelectItem value="REJECT">Rejection Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#64748B] font-semibold">Entity Filter</span>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger className="w-44 bg-white border-[#E5E7EB] text-[#111827] h-9 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
                <SelectItem value="ALL">All Resource Types</SelectItem>
                <SelectItem value="EMPLOYEE">Employees</SelectItem>
                <SelectItem value="LEAVE_REQUEST">Leave Requests</SelectItem>
                <SelectItem value="LEAVE_POLICY">Policies</SelectItem>
                <SelectItem value="HOLIDAY">Holidays</SelectItem>
                <SelectItem value="SECURITY">Security / Roles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-[#64748B]">
          Total Logged Events: <strong className="text-[#111827]">{total}</strong>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
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
      </div>

      {/* Log State Inspector Modal */}
      <Dialog open={diffModalOpen} onOpenChange={setDiffModalOpen}>
        <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#111827]">Audit Event Payload</DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Event ID: {selectedLog?.id} • Logged at {selectedLog?.created_at}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                <span className="text-[#64748B] block text-[11px]">Actor:</span>
                <span className="font-semibold text-[#111827]">{selectedLog?.actor_name || 'System'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                <span className="text-[#64748B] block text-[11px]">Action:</span>
                <span className="font-semibold text-[#111827]">{selectedLog?.action}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#111827]">Audit Metadata / State JSON</span>
              <pre className="p-3 rounded-lg bg-[#0F172A] text-[#E2E8F0] font-mono text-xs overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog?.metadata || selectedLog?.old_state || selectedLog?.new_state || selectedLog, null, 2)}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDiffModalOpen(false)}
              className="border-[#E5E7EB] text-[#64748B] hover:text-[#111827]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
