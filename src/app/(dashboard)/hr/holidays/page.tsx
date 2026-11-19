'use client'

import * as React from 'react'
import {
  Calendar as CalendarIcon,
  Plus,
  Upload,
  Edit,
  Trash2,
  CalendarDays,
  Globe,
  MapPin,
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
      } else {
        await addHoliday(activeCalendar.id, {
          name: formData.name,
          holidayDate: formData.holidayDate,
          holidayType: formData.holidayType,
          isOptional: formData.isOptional,
          description: formData.description,
        })
      }
      setHolidayModalOpen(false)
      loadCalendars()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to remove this holiday?')) return
    await deleteHoliday(id)
    loadCalendars()
  }

  const handleImportCSV = async () => {
    if (!activeCalendar || !csvContent.trim()) return
    setIsSubmitting(true)
    try {
      const res = await importHolidaysCSV(activeCalendar.id, csvContent)
      setImportResult(res)
      if (res.imported > 0) {
        loadCalendars()
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
        loadCalendars()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendars & Non-Working Days"
        description="Establish company-wide national holidays, optional regional observances, and location-specific festive days."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateCalModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Calendar
          </Button>
          <Button size="sm" onClick={handleOpenAddHoliday}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Holiday
          </Button>
        </div>
      </PageHeader>

      {/* Selectors Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Calendar Year</span>
            <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Active Holiday Calendar</span>
            <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.is_default && '(Default)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Total Holidays: <strong className="text-foreground">{holidays.length}</strong>
        </div>
      </div>

      {/* Monthly Holidays Grouped View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(holidaysByMonth).map(([month, monthHolidays]) => (
          <Card key={month} className={monthHolidays.length > 0 ? '' : 'opacity-60 bg-muted/20'}>
            <CardHeader className="pb-3 border-b bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">{month}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {monthHolidays.length} {monthHolidays.length === 1 ? 'day' : 'days'}
              </Badge>
            </CardHeader>
            <CardContent className="p-3">
              {monthHolidays.length > 0 ? (
                <div className="divide-y space-y-1">
                  {monthHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="pt-2 pb-1 flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          {h.name}
                          {h.is_optional && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                              Optional
                            </Badge>
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5">
                          {h.holiday_date} • {h.holiday_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenEditHoliday(h)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteHoliday(h.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-3 text-center">No holidays in {month}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Holiday Modal */}
      <Dialog open={holidayModalOpen} onOpenChange={setHolidayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHolidayId ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
            <DialogDescription>
              {activeCalendar?.name} ({year})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleHolidaySubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hName">Holiday Name *</Label>
              <Input
                id="hName"
                placeholder="e.g. Independence Day"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hDate">Holiday Date *</Label>
              <Input
                id="hDate"
                type="date"
                value={formData.holidayDate}
                onChange={(e) => setFormData({ ...formData, holidayDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hType">Holiday Classification</Label>
              <Select
                value={formData.holidayType}
                onValueChange={(val: any) => setFormData({ ...formData, holidayType: val })}
              >
                <SelectTrigger id="hType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">National Public Holiday</SelectItem>
                  <SelectItem value="REGIONAL">Regional Observance</SelectItem>
                  <SelectItem value="ORGANIZATION">Company Specific Foundation Day</SelectItem>
                  <SelectItem value="OPTIONAL">Optional / Restricted Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Mark as Optional Leave</Label>
                <p className="text-xs text-muted-foreground">Employees can choose whether to avail</p>
              </div>
              <Switch
                checked={formData.isOptional}
                onCheckedChange={(val) => setFormData({ ...formData, isOptional: val })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setHolidayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingHolidayId ? 'Update Holiday' : 'Add Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Holidays via CSV</DialogTitle>
            <DialogDescription>
              Provide holiday records with headers:{' '}
              <code className="text-xs bg-muted p-0.5 rounded">name,holiday_date,holiday_type,is_optional</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              className="h-44 font-mono text-xs"
              placeholder={`name,holiday_date,holiday_type,is_optional\nLabor Day,2026-05-01,NATIONAL,false\nGood Friday,2026-04-03,OPTIONAL,true`}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
            />
            {importResult && (
              <p className="text-xs font-semibold text-emerald-600">
                Imported {importResult.imported} holidays successfully.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportCSV} disabled={!csvContent.trim() || isSubmitting}>
              Import Holidays
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Calendar Modal */}
      <Dialog open={createCalModalOpen} onOpenChange={setCreateCalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Regional Holiday Calendar</DialogTitle>
            <DialogDescription>For branch offices or overseas locations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Calendar Name *</Label>
              <Input
                placeholder="e.g. UK London Office Calendar 2026"
                value={newCalName}
                onChange={(e) => setNewCalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location / Region</Label>
              <Input
                placeholder="e.g. London, United Kingdom"
                value={newCalLocation}
                onChange={(e) => setNewCalLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCalendar} disabled={!newCalName.trim() || isSubmitting}>
              Create Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
