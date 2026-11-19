'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { getAdminPermissions, type AdminPermissionItem } from '@/app/actions/admin/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Key, ShieldCheck, Lock, Loader2 } from 'lucide-react'

const MODULE_COLORS: Record<string, string> = {
  Leave: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200',
  Approval: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200',
  Employee: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200',
  Policy: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200',
  System: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200',
}

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminPermissions()
      setPermissions(data)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTab = activeTab === 'ALL' || p.module === activeTab
    return matchesSearch && matchesTab
  })

  const modules = ['ALL', 'Leave', 'Approval', 'Employee', 'Policy', 'System']

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Permissions Matrix</h1>
        <p className="text-muted-foreground mt-1">
          Catalog of all granular authorization scopes enforced across server actions, API endpoints, and database RLS.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Filter by scope, code, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-3 sm:flex">
              {modules.map((m) => (
                <TabsTrigger key={m} value={m} className="text-xs">
                  {m === 'ALL' ? 'All Scopes' : m}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Permissions List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredPermissions.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground text-sm">
          No permissions found matching your criteria.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPermissions.map((perm) => (
            <Card key={perm.id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Key className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${MODULE_COLORS[perm.module] || ''}`}>
                    {perm.module} Module
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-2">{perm.name}</CardTitle>
                <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50 px-2 py-0.5 rounded w-fit">
                  {perm.code}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {perm.description || 'System capability enforcement scope.'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
