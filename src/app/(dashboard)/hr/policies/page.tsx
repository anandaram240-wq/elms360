'use client'

import * as React from 'react'
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Edit2,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useElmsStore } from '@/lib/store/elms-store'

export default function HrPoliciesPage() {
  const {
    state,
    updateLeaveQuota,
    setWeeklyOffSchedule,
    addHoliday,
    deleteHoliday,
  } = useElmsStore()

  // State for Quota Edit Modal
  const [editType, setEditType] = React.useState<{ id: string; name: string; quota: number } | null>(null)
  const [newQuota, setNewQuota] = React.useState<number>(0)

  // State for Add Holiday Modal
  const [isAddHolidayOpen, setIsAddHolidayOpen] = React.useState(false)
  const [holidayName, setHolidayName] = React.useState('')
  const [holidayDate, setHolidayDate] = React.useState('')
  const [holidayType, setHolidayType] = React.useState('PUBLIC')

  const isMonFri = state.weeklyOffDays.includes(6) // 6 = Saturday

  const handleToggleWorkweek = (type: 'MON_FRI' | 'MON_SAT') => {
    if (type === 'MON_FRI') {
      setWeeklyOffSchedule([0, 6]) // Sunday and Saturday off
      toast.success('Company schedule set to Monday–Friday (Saturday & Sunday are weekly off).')
    } else {
      setWeeklyOffSchedule([0]) // Only Sunday off
      toast.success('Company schedule set to Monday–Saturday (Only Sunday is weekly off).')
    }
  }

  const handleSaveQuota = () => {
    if (!editType) return
    if (newQuota < 0 || newQuota > 365) {
      toast.error('Annual quota must be between 0 and 365 days')
      return
    }
    updateLeaveQuota(editType.id, Number(newQuota))
    toast.success(`Annual quota for ${editType.name} updated to ${newQuota} days.`)
    setEditType(null)
  }

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault()
    if (!holidayName.trim() || !holidayDate) {
      toast.error('Please enter both holiday name and valid date')
      return
    }
    addHoliday(holidayName.trim(), holidayDate, holidayType)
    toast.success(`Holiday "${holidayName}" added to company calendar.`)
    setIsAddHolidayOpen(false)
    setHolidayName('')
    setHolidayDate('')
  }

  const handleDeleteHoliday = (id: string, name: string) => {
    deleteHoliday(id)
    toast.success(`Holiday "${name}" removed from calendar.`)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Policies & Company Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure annual leave entitlements, define company working schedule, and manage official holidays.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Leave Quotas & Work Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Workweek Schedule Card */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Company Workweek Schedule</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Defines weekly off days across the organization for duration math
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-blue-200 bg-blue-50 text-blue-700">
                  {isMonFri ? '5 Days / Week' : '6 Days / Week'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleWorkweek('MON_FRI')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isMonFri
                      ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-xs text-slate-900">Monday – Friday</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Saturday & Sunday are weekly offs (Standard)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleWorkweek('MON_SAT')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !isMonFri
                      ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-xs text-slate-900">Monday – Saturday</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Only Sunday is weekly off (Saturday is working)</p>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                ⚡ Any changes made here immediately adjust the live working-day calculation engine on the Apply Leave form.
              </p>
            </CardContent>
          </Card>

          {/* Annual Quotas Table */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">Annual Leave Type Quotas</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Annual entitlements credited to employees each fiscal year
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Leave Category</th>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Annual Quota</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {state.leaveTypes.map((lt) => (
                      <tr key={lt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lt.color }} />
                            <span>{lt.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">{lt.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                          {lt.annual_entitlement} days / year
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditType({ id: lt.id, name: lt.name, quota: lt.annual_entitlement })
                              setNewQuota(lt.annual_entitlement)
                            }}
                            className="h-7 px-2 text-blue-600 hover:bg-blue-50 text-xs gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit Quota
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Holiday Calendar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">2026 Company Holidays</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {state.holidays.length} observed holidays (automatically exempted)
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddHolidayOpen(true)}
                className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Holiday
              </Button>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                {state.holidays.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No holidays scheduled.</p>
                ) : (
                  state.holidays
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((h) => (
                      <div key={h.id} className="py-2.5 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-800">{h.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{h.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {h.type}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(h.id, h.name)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Quota Dialog */}
      {editType && (
        <Dialog open={Boolean(editType)} onOpenChange={() => setEditType(null)}>
          <DialogContent className="max-w-sm bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Edit {editType.name} Quota
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Set the annual entitlement for this leave category.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-2">
              <Label htmlFor="quotaInput" className="text-xs font-semibold text-slate-700">
                Annual Days Allotted <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="quotaInput"
                type="number"
                min={0}
                max={365}
                value={newQuota}
                onChange={(e) => setNewQuota(Number(e.target.value))}
                className="h-9 text-xs"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditType(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveQuota} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Save Quota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Holiday Dialog */}
      <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
        <DialogContent className="max-w-sm bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Add Company Holiday</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add a new official holiday to the company calendar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddHoliday} className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="hName" className="text-xs font-semibold text-slate-700">
                Holiday Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="hName"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g. Diwali, Independence Day"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hDate" className="text-xs font-semibold text-slate-700">
                Date (YYYY-MM-DD) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="hDate"
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hType" className="text-xs font-semibold text-slate-700">
                Holiday Type
              </Label>
              <Select value={holidayType} onValueChange={setHolidayType}>
                <SelectTrigger id="hType" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">National / Public Holiday</SelectItem>
                  <SelectItem value="OPTIONAL">Optional / Restricted</SelectItem>
                  <SelectItem value="COMPANY">Company Special Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddHolidayOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Add Holiday
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
