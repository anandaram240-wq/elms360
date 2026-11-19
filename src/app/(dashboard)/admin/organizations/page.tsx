'use client'

import * as React from 'react'
import { useEffect, useState, useTransition } from 'react'
import { getAdminOrganizations, updateAdminOrganization, type AdminOrganization } from '@/app/actions/admin/admin-actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Building2, Globe, Calendar, Clock, ShieldCheck, Loader2, Save } from 'lucide-react'

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<AdminOrganization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [fiscalYearStart, setFiscalYearStart] = useState<string>('4')
  const [weeklyOffPattern, setWeeklyOffPattern] = useState<'SAT_SUN' | 'SUN_ONLY' | 'FRI_SAT'>('SAT_SUN')
  const [isActive, setIsActive] = useState(true)
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false)
  const [enforceHierarchy, setEnforceHierarchy] = useState(true)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    setIsLoading(true)
    try {
      const orgs = await getAdminOrganizations()
      setOrganizations(orgs)
      if (orgs.length > 0) {
        populateOrg(orgs[0])
      }
    } catch (err) {
      toast.error('Failed to load organizations')
    } finally {
      setIsLoading(false)
    }
  }

  const populateOrg = (org: AdminOrganization) => {
    setSelectedOrg(org)
    setName(org.name)
    setSlug(org.slug)
    setTimezone(org.timezone)
    setFiscalYearStart(String(org.fiscalYearStart || 4))
    setIsActive(org.isActive)

    const offDays = org.weeklyOffDays || [0, 6]
    if (offDays.includes(0) && offDays.includes(6)) setWeeklyOffPattern('SAT_SUN')
    else if (offDays.includes(5) && offDays.includes(6)) setWeeklyOffPattern('FRI_SAT')
    else setWeeklyOffPattern('SUN_ONLY')

    const settings = org.settings || {}
    setAllowNegativeBalance(Boolean(settings.allowNegativeBalanceLeave))
    setEnforceHierarchy(settings.enforceLeaveApprovalHierarchy !== false)
  }

  const handleSave = () => {
    if (!selectedOrg) return

    let weeklyOffDays = [0, 6]
    if (weeklyOffPattern === 'SUN_ONLY') weeklyOffDays = [0]
    if (weeklyOffPattern === 'FRI_SAT') weeklyOffDays = [5, 6]

    startTransition(async () => {
      const res = await updateAdminOrganization(selectedOrg.id, {
        name,
        timezone,
        fiscalYearStart: Number(fiscalYearStart),
        weeklyOffDays,
        isActive,
        settings: {
          ...selectedOrg.settings,
          allowNegativeBalanceLeave: allowNegativeBalance,
          enforceLeaveApprovalHierarchy: enforceHierarchy,
        },
      })

      if (res.success) {
        toast.success('Organization settings updated successfully')
        loadOrganizations()
      } else {
        toast.error(res.error || 'Failed to update organization')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Organization Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Configure corporate tenant metadata, regional working calendar defaults, and global leave policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Overview Card */}
        <div className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-600/20">
                  {name.slice(0, 2).toUpperCase() || 'AB'}
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{name || 'Organization'}</CardTitle>
                  <CardDescription className="text-xs font-mono">slug: {slug}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Timezone
                </span>
                <span className="font-semibold">{timezone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Fiscal Year Start
                </span>
                <span className="font-semibold">
                  {fiscalYearStart === '1' && 'January'}
                  {fiscalYearStart === '4' && 'April (India FY)'}
                  {fiscalYearStart === '7' && 'July'}
                  {fiscalYearStart === '10' && 'October'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Weekend Off
                </span>
                <span className="font-semibold">
                  {weeklyOffPattern === 'SAT_SUN' && 'Saturday & Sunday'}
                  {weeklyOffPattern === 'SUN_ONLY' && 'Sunday Only'}
                  {weeklyOffPattern === 'FRI_SAT' && 'Friday & Saturday'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Status
                </span>
                <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px]">
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Settings Form */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">General & Regional Settings</CardTitle>
            <CardDescription className="text-xs">
              Changes here apply to all employee leave calculations and auto-accrual schedules for this organization.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Name & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Organization Legal Name</Label>
                <Input
                  id="orgName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Technologies Pvt Ltd"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgSlug">Tenant Identifier (Slug)</Label>
                <Input
                  id="orgSlug"
                  value={slug}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900 font-mono text-xs"
                />
              </div>
            </div>

            {/* Timezone & Fiscal Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                    <SelectItem value="UTC">UTC (GMT +0:00)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST -5:00)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST +4:00)</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore (SGT +8:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Fiscal Year Cycle Start</Label>
                <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January (Calendar Year)</SelectItem>
                    <SelectItem value="4">April (Standard India Financial Year)</SelectItem>
                    <SelectItem value="7">July (US Fiscal / Educational)</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weekly Off Days */}
            <div className="space-y-1.5">
              <Label>Default Weekly Off Days</Label>
              <Select value={weeklyOffPattern} onValueChange={(v: any) => setWeeklyOffPattern(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select working week pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAT_SUN">5-Day Work Week (Saturday & Sunday Off)</SelectItem>
                  <SelectItem value="SUN_ONLY">6-Day Work Week (Sunday Off Only)</SelectItem>
                  <SelectItem value="FRI_SAT">Middle East Work Week (Friday & Saturday Off)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Policy Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enforce Approval Hierarchy</Label>
                  <p className="text-xs text-muted-foreground">
                    Requires direct manager sign-off prior to secondary departmental approval
                  </p>
                </div>
                <Switch checked={enforceHierarchy} onCheckedChange={setEnforceHierarchy} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Allow Negative Leave Balances</Label>
                  <p className="text-xs text-muted-foreground">
                    Allows employees to apply for unpaid leave advance when balance is exhausted
                  </p>
                </div>
                <Switch checked={allowNegativeBalance} onCheckedChange={setAllowNegativeBalance} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Tenant Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive organizations block all logins and API operations
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Organization Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
