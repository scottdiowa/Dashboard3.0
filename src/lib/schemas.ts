import { z } from "zod"

// Omega Daily form schema
export const omegaDailySchema = z.object({
  business_date: z.string().min(1, "Business date is required"),
  net_sales: z.coerce.number().min(0, "Net sales must be positive"),
  last_year_sales: z.coerce.number().min(0, "Last year sales must be positive"),
  labor_hours: z.coerce.number().min(0, "Labor hours must be positive"),
  ideal_labor_hours: z.coerce.number().min(0, "Ideal labor hours must be positive"),
  labor_percentage: z.coerce.number().min(0, "Labor percentage must be positive"),
  food_variance_cost: z.coerce.number(),
  waste_amount: z.coerce.number().min(0, "Waste amount must be positive"),
  breakfast_sales: z.coerce.number().min(0, "Breakfast sales must be positive"),
  night_sales: z.coerce.number().min(0, "Night sales must be positive"),
})

export type OmegaDailyFormData = z.infer<typeof omegaDailySchema>

// SMG Daily Schema
export const smgDailySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  accuracy_decimal: z.number()
    .min(0, 'Accuracy must be 0 or greater'),
  zod_per_10k: z.number()
    .min(0, 'ZOD per 10k must be 0 or greater'),
  cc_complaints: z.number()
    .min(0, 'CC Complaints must be 0 or greater'),
  osat_decimal: z.number()
    .min(0, 'OSAT Score must be 0 or greater'),
  notes: z.string().optional()
})

export type SmgDailyFormData = z.infer<typeof smgDailySchema>

// Interview form schema
export const interviewSchema = z.object({
  candidate_name: z.string().min(1, "Candidate name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  position: z.string().optional(),
  interview_date: z.string().min(1, "Interview date is required"),
  interview_time: z.string().min(1, "Interview time is required"),
  status: z.enum(['SCHEDULED', 'DONE', 'NO_SHOW', 'HIRED', 'REJECTED']),
  notes: z.string().optional(),
})

export type InterviewFormData = z.infer<typeof interviewSchema>

// SMG Entry form schema
export const smgEntrySchema = z.object({
  entry_date: z.string().min(1, "Entry date is required"),
  accuracy_of_order: z.coerce.number().min(0).max(5).optional(),
  zone_of_defection: z.coerce.number().min(0).max(5).optional(),
  customer_computers: z.coerce.number().min(0).max(5).optional(),
  taste_of_food: z.coerce.number().min(0).max(5).optional(),
  osat: z.coerce.number().min(0).max(5).optional(),
})

export type SmgEntryFormData = z.infer<typeof smgEntrySchema>

// Hiring process schema
export const hiringSchema = z.object({
  documents_received: z.boolean().default(false),
  documents_folder: z.string().optional(),
  onboarding_sent_date: z.string().optional(),
  onboarding_completed_date: z.string().optional(),
  manager_reviewed_date: z.string().optional(),
  entered_in_system_date: z.string().optional(),
  fingerprint_scheduled_date: z.string().optional(),
  first_day: z.string().optional(),
  notes: z.string().optional(),
})

export type HiringFormData = z.infer<typeof hiringSchema>

// Login form schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginFormData = z.infer<typeof loginSchema>
