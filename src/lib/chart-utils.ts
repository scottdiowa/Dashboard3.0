import { format } from 'date-fns'

// Shared chart formatters for consistency
export const chartFormatters = {
  currency: (value: number) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value),
  
  currencyDetailed: (value: number) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value),
  
  percent: (value: number, decimals = 1) => `${(value ?? 0).toFixed(decimals)}%`,
  
  hours: (value: number, decimals = 1) => `${(value ?? 0).toFixed(decimals)}h`,
  
  dateShort: (iso: string | Date) => {
    const dateObj = typeof iso === 'string' 
      ? new Date(Number(String(iso).slice(0,4)), Number(String(iso).slice(5,7)) - 1, Number(String(iso).slice(8,10)))
      : iso
    return format(dateObj, 'MMM d')
  },
  
  dateFull: (iso: string | Date) => {
    const dateObj = typeof iso === 'string' 
      ? new Date(Number(String(iso).slice(0,4)), Number(String(iso).slice(5,7)) - 1, Number(String(iso).slice(8,10)))
      : iso
    return format(dateObj, 'MMM dd, yyyy')
  },

  currencyCompact: (value: number) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    }
    return chartFormatters.currency(value)
  }
}

// Chart color palette - consistent across all charts
export const chartColors = {
  // Primary metrics
  sales: '#E2231A', // Wendy's red
  salesSecondary: '#B71C13',
  
  // Labor metrics
  labor: '#374151', // Gray-700
  laborIdeal: '#6B7280', // Gray-500
  laborOver: '#EF4444', // Red-500
  laborUnder: '#10B981', // Green-500
  
  // Variance metrics
  waste: '#EF4444', // Red-500
  foodVariance: '#F59E0B', // Amber-500
  
  // Success/positive
  positive: '#10B981', // Green-500
  
  // Warning/neutral
  warning: '#F59E0B', // Amber-500
  
  // Background/grid
  grid: '#F3F4F6', // Gray-100
  gridStroke: '#E5E7EB', // Gray-200
  
  // Text
  textPrimary: '#111827', // Gray-900
  textSecondary: '#6B7280', // Gray-500
}

// Default chart styling
export const chartDefaults = {
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: chartColors.gridStroke,
  },
  xAxis: {
    stroke: chartColors.textSecondary,
    fontSize: 12,
    tickMargin: 8,
  },
  yAxis: {
    stroke: chartColors.textSecondary,
    fontSize: 12,
    tickMargin: 8,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: 'white',
      border: `1px solid ${chartColors.gridStroke}`,
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
    },
    labelStyle: { 
      color: chartColors.textPrimary, 
      fontWeight: '600',
      marginBottom: '4px',
    },
  },
  legend: {
    iconType: 'rect' as const,
    wrapperStyle: {
      fontSize: '12px',
      color: chartColors.textSecondary,
    },
  },
}

// Quick date range calculations
export const getDateRange = (range: string, referenceDate: Date = new Date()) => {
  const today = new Date(referenceDate)
  
  switch (range) {
    case 'today':
      return {
        start: format(today, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
        label: 'Today'
      }
    case 'wtd': // Week to date
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
      return {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
        label: 'Week to Date'
      }
    case 'mtd': // Month to date
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        start: format(monthStart, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
        label: 'Month to Date'
      }
    case 'last7':
      const last7 = new Date(today)
      last7.setDate(today.getDate() - 6)
      return {
        start: format(last7, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
        label: 'Last 7 Days'
      }
    case 'last30':
      const last30 = new Date(today)
      last30.setDate(today.getDate() - 29)
      return {
        start: format(last30, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
        label: 'Last 30 Days'
      }
    default:
      return {
        start: '',
        end: '',
        label: 'All Time'
      }
  }
}
