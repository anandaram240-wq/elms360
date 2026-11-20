'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  Plus,
  Upload,
  Edit2,
  Trash2,
  CalendarDays,
  Globe,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { getHolidayCalendars } from '@/app/actions/hr/hr-queries'
import {
  addHoliday,
  updateHoliday,
  deleteHoliday,
  importHolidaysCSV,
  createHolidayCalendar,
} from '@/app/actions/hr/hr-actions'

export default function HolidayCalendarsPage() {
  const [year, setYear] = React.useState(2026)
  const [calendars, setCalendars] = React.useState<any[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(true)

  // Modals
  const [holidayModalOpen, setHolidayModalOpen] = React.useState(false)
  const [editingHolidayId, setEditingHolidayId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    holidayDate: '',
    holidayType: 'NATIONAL' as 'NATIONAL' | 'OPTIONAL' | 'REGIONAL' | 'ORGANIZATION',
    isOptional: false,
    description: '',
  })

  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [csvContent, setCsvContent] = React.useState('')
  const [importResult, setImportResult] = React.useState<any | null>(null)

  const [createCalModalOpen, setCreateCalModalOpen] = React.useState(false)
  const [newCalName, setNewCalName] = React.useState('')
  const [newCalLocation, setNewCalLocation] = React.useState('')

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const loadCalendars = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getHolidayCalendars(year)
      setCalendars(data)
      if (data.length > 0 && !selectedCalendarId) {
        setSelectedCalendarId(data[0].id)
      }
    } finally {
      setIsLoading(false)
    }
  }, [year, selectedCalendarId])

  React.useEffect(() => {
    loadCalendars()
  }, [loadCalendars])

  const activeCalendar = calendars.find((c) => c.id === selectedCalendarId) || calendars[0]
  const holidays = activeCalendar?.holidays || []

  // Group holidays by month
  const holidaysByMonth = React.useMemo(() => {
    const months: Record<string, any[]> = {}
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]

    for (let i = 0; i < 12; i++) {
      months[monthNames[i]] = []
    }

    for (const h of holidays) {
      if (!h.holiday_date) continue
      const mIdx = new Date(h.holiday_date).getMonth()
      const mName = monthNames[mIdx]
      if (months[mName]) {
        months[mName].push(h)
      }
    }

    return months
  }, [holidays])

  const handleOpenAddHoliday = () => {
    setEditingHolidayId(null)
    setFormData({
      name: '',
      holidayDate: `${year}-01-01`,
      holidayType: 'NATIONAL',
      isOptional: false,
      description: '',
    })
    setHolidayModalOpen(true)
  }

  const handleOpenEditHoliday = (h: any) => {
    setEditingHolidayId(h.id)
    setFormData({
      name: h.name,
      holidayDate: h.holiday_date,
      holidayType: h.holiday_type || 'NATIONAL',
      isOptional: !!h.is_optional,
      description: h.description || '',
    })
    setHolidayModalOpen(true)
  }

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCalendar) return
    setIsSubmitting(true)
    try {
      if (editingHolidayId) {
        await updateHoliday(editingHolidayId, {
          name: formData.name,
          holidayDate: formData.holidayDate,
          holidayType: formData.holidayType,
          isOptional: formData.isOptional,
          description: formData.description,
        })
        toast.success(`Holiday "${formData.name}" updated successfully`)
      } else {
        await addHoliday(activeCalendar.id, {
          name: formData.name,
          holidayDate: formData.holidayDate,
          holidayType: formData.holidayType,
          isOptional: formData.isOptional,
          description: formData.description,
        })
        toast.success(`Holiday "${formData.name}" added successfully`)
      }
      setHolidayModalOpen(false)
      loadCalendars()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from this calendar?`)) return
    await deleteHoliday(id)
    toast.success(`Holiday "${name}" deleted`)
    loadCalendars()
  }

  const handleImportCSV = async () => {
    if (!activeCalendar || !csvContent.trim()) return
    setIsSubmitting(true)
    try {
      const res = await importHolidaysCSV(activeCalendar.id, csvContent)
      setImportResult(res)
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} holidays`)
        setImportModalOpen(false)
        setCsvContent('')
        loadCalendars()
      } else {
        toast.error('Failed to import holidays from CSV')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCalendar = async () => {
    if (!newCalName.trim()) return
    setIsSubmitting(true)
    try {
      const res = await createHolidayCalendar({
        name: newCalName,
        year,
        location: newCalLocation || undefined,
        isDefault: false,
      })
      if (res.success && res.data) {
        setSelectedCalendarId(res.data.id)
        setCreateCalModalOpen(false)
        setNewCalName('')
        setNewCalLocation('')
        toast.success(`Created calendar "${newCalName}"`)
        loadCalendars()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Holiday Calendars & Non-Working Days"
        description="Establish company-wide national holidays, optional regional observances, and location-specific festive days."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F1F3F5] h-9 text-xs font-semibold"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5 text-[#64748B]" /> Import CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateCalModalOpen(true)}
            className="border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F1F3F5] h-9 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 text-[#64748B]" /> New Calendar
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddHoliday}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Holiday
          </Button>
        </div>
      </PageHeader>

      {/* Selectors Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1">
            <span className="text-xs text-[#64748B] font-semibold">Calendar Year</span>
            <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
              <SelectTrigger className="w-32 bg-white border-[#E5E7EB] text-[#111827] font-medium h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
                <SelectItem value="2025" className="cursor-pointer hover:bg-[#F1F3F5]">2025</SelectItem>
                <SelectItem value="2026" className="cursor-pointer hover:bg-[#F1F3F5]">2026</SelectItem>
                <SelectItem value="2027" className="cursor-pointer hover:bg-[#F1F3F5]">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#64748B] font-semibold">Active Holiday Calendar</span>
            <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
              <SelectTrigger className="w-64 bg-white border-[#E5E7EB] text-[#111827] font-medium h-9 text-xs">
                <SelectValue placeholder="Select Calendar" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
                {calendars.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="cursor-pointer hover:bg-[#F1F3F5]">
                    {c.name} {c.is_default && '(Default)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <span>Total Holidays in {year}:</span>
          <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-xs border border-[#BFDBFE]">
            {holidays.length}
          </span>
        </div>
      </div>

      {/* Monthly Holidays Grouped View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(holidaysByMonth).map(([month, monthHolidays]) => (
          <Card
            key={month}
            className="border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden transition-all hover:border-[#D1D5DB]"
          >
            <CardHeader className="pb-3 pt-3.5 px-4 border-b border-[#F1F3F5] bg-[#FAFAFA] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#111827]">{month}</CardTitle>
              <Badge
                variant="outline"
                className={`text-[11px] font-semibold ${
                  monthHolidays.length > 0
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                    : 'bg-[#F1F3F5] text-[#64748B] border-[#E5E7EB]'
                }`}
              >
                {monthHolidays.length} {monthHolidays.length === 1 ? 'holiday' : 'holidays'}
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5">
              {monthHolidays.length > 0 ? (
                <div className="divide-y divide-[#F1F3F5] space-y-2">
                  {monthHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="pt-2 pb-1 flex items-start justify-between gap-3 text-xs first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111827] text-sm flex items-center gap-1.5 truncate">
                          {h.name}
                          {h.is_optional && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-medium border border-[#FDE68A]">
                              Optional
                            </span>
                          )}
                        </p>
                        <p className="text-[#475569] font-medium text-xs mt-1">
                          📅 {h.holiday_date} • <span className="text-[#64748B] capitalize">{h.holiday_type?.toLowerCase() || 'national'}</span>
                        </p>
                        {h.description && (
                          <p className="text-[#64748B] text-[11px] mt-0.5 line-clamp-1 italic">
                            {h.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-md"
                          onClick={() => handleOpenEditHoliday(h)}
                          title="Edit holiday"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-md"
                          onClick={() => handleDeleteHoliday(h.id, h.name)}
                          title="Delete holiday"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  <CalendarDays className="h-6 w-6 mx-auto mb-1 text-[#CBD5E1]" />
                  <span>No holidays in {month}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Holiday Modal */}
      <Dialog open={holidayModalOpen} onOpenChange={setHolidayModalOpen}>
        <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#111827]">
              {editingHolidayId ? 'Edit Holiday' : 'Add Holiday'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Calendar: {activeCalendar?.name} ({year})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleHolidaySubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="hName" className="text-xs font-semibold text-[#111827]">
                Holiday Name <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="hName"
                placeholder="e.g. Independence Day"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white border-[#E5E7EB] text-[#111827] h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hDate" className="text-xs font-semibold text-[#111827]">
                Holiday Date <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="hDate"
                type="date"
                value={formData.holidayDate}
                onChange={(e) => setFormData({ ...formData, holidayDate: e.target.value })}
                required
                className="bg-white border-[#E5E7EB] text-[#111827] h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hType" className="text-xs font-semibold text-[#111827]">
                Holiday Type
              </Label>
              <Select
                value={formData.holidayType}
                onValueChange={(val: any) => setFormData({ ...formData, holidayType: val })}
              >
                <SelectTrigger id="hType" className="bg-white border-[#E5E7EB] text-[#111827] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
                  <SelectItem value="NATIONAL">National Holiday</SelectItem>
                  <SelectItem value="REGIONAL">Regional Holiday</SelectItem>
                  <SelectItem value="OPTIONAL">Optional / Restricted</SelectItem>
                  <SelectItem value="ORGANIZATION">Organization Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]">
              <div>
                <p className="text-xs font-semibold text-[#111827]">Optional / Floating Holiday</p>
                <p className="text-[11px] text-[#64748B]">Employees choose from optional list based on quota</p>
              </div>
              <Switch
                checked={formData.isOptional}
                onCheckedChange={(checked) => setFormData({ ...formData, isOptional: checked })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hDesc" className="text-xs font-semibold text-[#111827]">
                Description / Notes (Optional)
              </Label>
              <Textarea
                id="hDesc"
                placeholder="Brief information about this observance..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="bg-white border-[#E5E7EB] text-[#111827] text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHolidayModalOpen(false)}
                className="border-[#E5E7EB] text-[#64748B] hover:text-[#111827]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
              >
                {isSubmitting ? 'Saving...' : editingHolidayId ? 'Update Holiday' : 'Add Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#111827]">Import Holidays via CSV</DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Add multiple holidays at once to {activeCalendar?.name}. Expected headers: Name, Date, Type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#334155] leading-relaxed">
              Name,Date,Type<br />
              New Year's Day,2026-01-01,NATIONAL<br />
              Republic Day,2026-01-26,NATIONAL<br />
              Independence Day,2026-08-15,NATIONAL
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="csvText" className="text-xs font-semibold text-[#111827]">
                Paste CSV Content
              </Label>
              <Textarea
                id="csvText"
                rows={6}
                placeholder="Paste CSV rows here..."
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="font-mono text-xs bg-white border-[#E5E7EB] text-[#111827]"
              />
            </div>

            {importResult && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  importResult.imported > 0
                    ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]'
                    : 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]'
                }`}
              >
                Imported: {importResult.imported} holidays
                {importResult.errors?.length > 0 && (
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                    {importResult.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(false)}
              className="border-[#E5E7EB] text-[#64748B] hover:text-[#111827]"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleImportCSV}
              disabled={isSubmitting || !csvContent.trim()}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            >
              {isSubmitting ? 'Importing...' : 'Start Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Calendar Modal */}
      <Dialog open={createCalModalOpen} onOpenChange={setCreateCalModalOpen}>
        <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#111827]">Create New Holiday Calendar</DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Define a regional or location-specific holiday schedule for {year}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="calName" className="text-xs font-semibold text-[#111827]">
                Calendar Name <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="calName"
                placeholder="e.g. Bangalore Branch Calendar"
                value={newCalName}
                onChange={(e) => setNewCalName(e.target.value)}
                className="bg-white border-[#E5E7EB] text-[#111827] h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="calLoc" className="text-xs font-semibold text-[#111827]">
                Location / Region (Optional)
              </Label>
              <Input
                id="calLoc"
                placeholder="e.g. Karnataka, India"
                value={newCalLocation}
                onChange={(e) => setNewCalLocation(e.target.value)}
                className="bg-white border-[#E5E7EB] text-[#111827] h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateCalModalOpen(false)}
              className="border-[#E5E7EB] text-[#64748B] hover:text-[#111827]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateCalendar}
              disabled={isSubmitting || !newCalName.trim()}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Calendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
