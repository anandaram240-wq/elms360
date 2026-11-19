import * as React from 'react'
import Link from 'next/link'
import { getAdminDashboardStats } from '@/app/actions/admin/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Key,
  Lock,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Database,
  Mail,
  Zap,
  RefreshCw,
  FileText,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardStats()
  const { stats, recentAuditLogs, systemServices } = data

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">System Governance</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              Super Admin Control
            </span>
          </div>
          <p className="text-sm text-[#475569] mt-1">
            Global governance, system health diagnostics, multi-tenant directory, and access policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="border-[#E5E7EB] text-xs h-9">
            <Link href="/admin/system-settings">
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Settings
            </Link>
          </Button>
          <Button size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 font-semibold" asChild>
            <Link href="/admin/security">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Security Suite
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Organizations */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organizations</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">100% active</span> across global tenancy
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Directory Users</CardTitle>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalEmployees} employee profiles mapped
            </p>
          </CardContent>
        </Card>

        {/* Security / RLS Status */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security & RLS</CardTitle>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Compliant</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.rlsCoveragePercent}% of tables protected with RLS
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemUptime}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL & GoTrue fully online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/admin/organizations" className="group block">
          <Card className="h-full border hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base font-semibold mt-2">Organizations</CardTitle>
              <CardDescription className="text-xs">
                Manage tenant profiles, fiscal year calendar configuration, weekly off patterns, and brand settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/users" className="group block">
          <Card className="h-full border hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base font-semibold mt-2">User Accounts & Roles</CardTitle>
              <CardDescription className="text-xs">
                Inspect user accounts, assign Super Admin/HR/Manager roles, toggle access, and trigger password resets.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/permissions" className="group block">
          <Card className="h-full border hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base font-semibold mt-2">Roles & Permissions</CardTitle>
              <CardDescription className="text-xs">
                Review granular permissions across Leave, Approvals, Policies, and Systems; manage role matrices.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout: Services Health + System Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Services Status */}
        <Card className="lg:col-span-1 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Infrastructure Health</CardTitle>
                <CardDescription className="text-xs">Core engine & integration status</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                100% Green
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemServices.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    {service.category === 'Database' && <Database className="w-3.5 h-3.5 text-blue-500" />}
                    {service.category === 'Auth' && <Lock className="w-3.5 h-3.5 text-indigo-500" />}
                    {service.category === 'Outbox' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                    {service.category === 'Email' && <Mail className="w-3.5 h-3.5 text-green-500" />}
                    {service.category === 'Storage' && <Server className="w-3.5 h-3.5 text-purple-500" />}
                    <span>{service.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Checked {service.lastChecked}</div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {service.latencyMs}ms
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">System Security & Audit Trail</CardTitle>
                <CardDescription className="text-xs">Tamper-evident logs of administrative actions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/hr/audit-logs" className="text-xs">
                  View Full Audit <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs tracking-tight bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {log.action}
                      </span>
                      <span className="text-xs text-muted-foreground">• {log.resourceType}</span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">{log.details}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">By {log.actorEmail}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.timestamp, 'dd MMM, HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
