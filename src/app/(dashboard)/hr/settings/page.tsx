'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Settings,
  Save,
  Building,
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getOrganizationSettings } from '@/app/actions/hr/hr-queries'
import { updateOrganizationSettings } from '@/app/actions/hr/hr-actions'

export default function HRSettingsPage() {
  const [isSaving, setIsSaving] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  const [settings, setSettings] = React.useState({
    leaveYearType: 'CALENDAR' as 'CALENDAR' | 'FISCAL',
    maxPendingPerEmployee: 3,
    allowConcurrentLeaves: false,
    overlapPolicy: 'WARN_AND_ALLOW' as 'BLOCK' | 'WARN_AND_ALLOW' | 'ALLOW',
    minTeamCoveragePercent: 60,
    requireHandoverNotes: true,
    autoApproveAfterDays: 7,
    enableEmailNotifications: true,
    enablePushNotifications: true,
    workingHoursPerDay: 8,
  })

  React.useEffect(() => {
    getOrganizationSettings().then((data: any) => {
      setSettings(data)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMsg(null)
    try {
      const res = await updateOrganizationSettings({
        leaveYearType: settings.leaveYearType,
        maxPendingPerEmployee: Number(settings.maxPendingPerEmployee),
        allowConcurrentLeaves: settings.allowConcurrentLeaves,
        overlapPolicy: settings.overlapPolicy,
        minTeamCoveragePercent: Number(settings.minTeamCoveragePercent),
        requireHandoverNotes: settings.requireHandoverNotes,
        autoApproveAfterDays: Number(settings.autoApproveAfterDays),
        enableEmailNotifications: settings.enableEmailNotifications,
        enablePushNotifications: settings.enablePushNotifications,
        workingHoursPerDay: Number(settings.workingHoursPerDay),
      })
      if (res.success) {
        setSuccessMsg('Organization settings updated successfully.')
        toast.success('Organization settings updated successfully')
      } else {
        toast.error(res.error || 'Failed to update settings')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Organization Leave Settings"
        description="Global parameters governing fiscal year boundaries, concurrency rules, team coverage buffers, and automated notification triggers."
      />

      {successMsg && (
        <div className="p-4 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Year & Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Leave Year & Working Hours
            </CardTitle>
            <CardDescription>Fiscal cycles and default day calculations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearType">Leave Year Cycle Type</Label>
              <Select
                value={settings.leaveYearType}
                onValueChange={(val: any) => setSettings({ ...settings, leaveYearType: val })}
              >
                <SelectTrigger id="yearType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALENDAR">Calendar Year (1 Jan - 31 Dec)</SelectItem>
                  <SelectItem value="FISCAL">Fiscal Year (1 Apr - 31 Mar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Standard Working Hours Per Day</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={settings.workingHoursPerDay}
                onChange={(e) =>
                  setSettings({ ...settings, workingHoursPerDay: Number(e.target.value) })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Policy & Approval Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Leave Request Constraints & Rules
            </CardTitle>
            <CardDescription>Guards to prevent scheduling conflicts and staffing shortages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPending">Max Pending Requests per Employee</Label>
                <Input
                  id="maxPending"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxPendingPerEmployee}
                  onChange={(e) =>
                    setSettings({ ...settings, maxPendingPerEmployee: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverage">Minimum Department Team Coverage %</Label>
                <Input
                  id="coverage"
                  type="number"
                  min="20"
                  max="100"
                  value={settings.minTeamCoveragePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, minTeamCoveragePercent: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoApprove">Auto-Approve Unanswered Requests After (Days)</Label>
                <Input
                  id="autoApprove"
                  type="number"
                  min="0"
                  max="30"
                  value={settings.autoApproveAfterDays}
                  onChange={(e) =>
                    setSettings({ ...settings, autoApproveAfterDays: Number(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">Set to 0 to disable automatic approval</p>
              </div>
            </div>

            <div className="space-y-4 pt-3 border-t">
              <div className="space-y-1.5">
                <Label htmlFor="overlapPolicy">Leave Overlap Submission Policy</Label>
                <Select
                  value={settings.overlapPolicy || 'WARN_AND_ALLOW'}
                  onValueChange={(val: any) =>
                    setSettings({
                      ...settings,
                      overlapPolicy: val,
                      allowConcurrentLeaves: val === 'ALLOW',
                    })
                  }
                >
                  <SelectTrigger id="overlapPolicy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WARN_AND_ALLOW">
                      WARN & ALLOW (Recommended) — Display conflict warning, allow submission for manager review
                    </SelectItem>
                    <SelectItem value="BLOCK">
                      BLOCK (Strict) — Hard block employees from submitting overlapping dates
                    </SelectItem>
                    <SelectItem value="ALLOW">
                      ALLOW (Permissive) — Silently permit concurrent applications
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls whether employees can submit leave requests that overlap on eligible working days.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>Mandatory Work Handover Notes</Label>
                  <p className="text-xs text-muted-foreground">
                    Require employee to designate replacement coverage on submission
                  </p>
                </div>
                <Switch
                  checked={settings.requireHandoverNotes}
                  onCheckedChange={(val) => setSettings({ ...settings, requireHandoverNotes: val })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Notification Dispatch Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Dispatch email notifications for leave submissions, approvals, and reminders
                </p>
              </div>
              <Switch
                checked={settings.enableEmailNotifications}
                onCheckedChange={(val) =>
                  setSettings({ ...settings, enableEmailNotifications: val })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>In-App & Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Enable browser notifications and top navbar alert badge counters
                </p>
              </div>
              <Switch
                checked={settings.enablePushNotifications}
                onCheckedChange={(val) =>
                  setSettings({ ...settings, enablePushNotifications: val })
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t p-4">
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? 'Saving Changes...' : 'Save Organization Settings'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
