import { z } from 'zod'

export const leaveApplicationSchema = z
  .object({
    leaveTypeId: z.string().min(1, 'Please select a leave type'),
    startDate: z.string().min(1, 'Please select a start date'),
    endDate: z.string().min(1, 'Please select an end date'),
    dayType: z.enum(['FULL_DAY', 'HALF_DAY_AM', 'HALF_DAY_PM', 'PARTIAL']).default('FULL_DAY'),
    partialHours: z.number().min(0.5).max(8).optional(),
    reason: z
      .string()
      .min(20, 'Reason must be at least 20 characters long')
      .max(1000, 'Reason cannot exceed 1000 characters'),
    handoverNotes: z.string().max(1000, 'Handover notes cannot exceed 1000 characters').optional(),
    emergencyContact: z.string().max(100, 'Emergency contact is too long').optional(),
    contactDuringLeave: z.string().max(100, 'Contact information is too long').optional(),
    confirmAccuracy: z.boolean().refine((val) => val === true, {
      message: 'You must confirm that the information provided is accurate',
    }),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end >= start
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  )

export type LeaveApplicationFormValues = z.infer<typeof leaveApplicationSchema>
