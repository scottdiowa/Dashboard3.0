import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string'
    ? new Date(Number(date.slice(0,4)), Number(date.slice(5,7)) - 1, Number(date.slice(8,10)))
    : date
  return format(dateObj, 'MMM dd, yyyy')
}

export function formatTime(time: string): string {
  return format(parseISO(`2000-01-01T${time}`), 'h:mm a')
}

export function formatDateTime(date: string, time: string): string {
  const d = new Date(Number(date.slice(0,4)), Number(date.slice(5,7)) - 1, Number(date.slice(8,10)))
  return format(new Date(
    d.getFullYear(), d.getMonth(), d.getDate(),
    Number(time.slice(0,2)), Number(time.slice(3,5))
  ), 'MMM dd, yyyy h:mm a')
}

export function getDateRange(range: 'day' | 'week' | 'month', date: Date = new Date()) {
  switch (range) {
    case 'day':
      return { start: date, end: date }
    case 'week':
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) }
    default:
      return { start: date, end: date }
  }
}

export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end })
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'done':
      return 'bg-green-100 text-green-800'
    case 'no_show':
      return 'bg-red-100 text-red-800'
    case 'hired':
      return 'bg-purple-100 text-purple-800'
    case 'rejected':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getHiringProgress(hire: any): number {
  const steps = [
    hire.documents_received,
    hire.onboarding_sent_date,
    hire.onboarding_completed_date,
    hire.manager_reviewed_date,
    hire.entered_in_system_date,
    hire.fingerprint_scheduled_date,
    hire.first_day
  ]
  
  const completedSteps = steps.filter(step => step && step !== null).length
  return Math.round((completedSteps / steps.length) * 100)
}

export function generateMockData() {
  // This function will be used when VITE_USE_MOCK_DATA is true
  return {
    omegaDaily: [],
    interviews: [],
    smgEntries: [],
    hires: []
  }
}
