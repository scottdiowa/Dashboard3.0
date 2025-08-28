import React from 'react'
import { Calendar, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from './button'
import { Calendar as CalendarComponent } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import { getDateRange } from '@/lib/chart-utils'

interface FilterChip {
  key: string
  label: string
  description?: string
}

interface FilterToolbarProps {
  selectedRange?: string
  selectedDate?: Date
  onRangeChange?: (range: string) => void
  onDateChange?: (date: Date | undefined) => void
  onClearFilters?: () => void
  className?: string
  compact?: boolean
}

const quickRanges: FilterChip[] = [
  { key: 'today', label: 'Today' },
  { key: 'wtd', label: 'WTD', description: 'Week to Date' },
  { key: 'mtd', label: 'MTD', description: 'Month to Date' },
  { key: 'last7', label: 'Last 7', description: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30', description: 'Last 30 Days' },
  { key: 'custom', label: 'Custom' },
]

export function FilterToolbar({
  selectedRange = 'last30',
  selectedDate,
  onRangeChange,
  onDateChange,
  onClearFilters,
  className,
  compact = false
}: FilterToolbarProps) {
  const hasActiveFilters = selectedRange !== 'last30' || selectedDate

  const handleRangeClick = (range: string) => {
    onRangeChange?.(range)
    if (range !== 'custom') {
      onDateChange?.(undefined)
    }
  }

  const getSelectedRangeLabel = () => {
    if (selectedRange === 'custom' && selectedDate) {
      return format(selectedDate, 'MMM dd, yyyy')
    }
    
    const range = quickRanges.find(r => r.key === selectedRange)
    return range?.label || 'Last 30'
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 bg-gray-50 rounded-lg border',
      compact && 'p-3',
      className
    )}>
      <div className="flex items-center gap-2 text-gray-600">
        <Filter className="h-4 w-4" />
        <span className={cn(
          'text-sm font-medium',
          compact && 'hidden sm:inline'
        )}>
          Filters:
        </span>
      </div>

      {/* Quick Range Chips */}
      <div className="flex flex-wrap gap-1">
        {quickRanges.map((range) => (
          <Button
            key={range.key}
            variant={selectedRange === range.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleRangeClick(range.key)}
            className={cn(
              'text-xs h-7 px-2',
              selectedRange === range.key
                ? 'bg-wendys-red text-white hover:bg-wendys-red/90'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              compact && 'text-[11px] h-6 px-1.5'
            )}
            title={range.description}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Picker */}
      {selectedRange === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'justify-start text-left font-normal h-7',
                !selectedDate && 'text-muted-foreground',
                compact && 'h-6 text-xs'
              )}
            >
              <Calendar className="mr-1 h-3 w-3" />
              {selectedDate ? format(selectedDate, 'MMM dd') : 'Pick date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Active Filter Summary */}
      {!compact && hasActiveFilters && (
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 border-l pl-3 ml-1">
          <span>Showing:</span>
          <span className="font-medium text-gray-700">
            {getSelectedRangeLabel()}
          </span>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className={cn(
            'text-xs text-gray-500 hover:text-gray-700 h-7 px-2',
            compact && 'h-6 px-1.5'
          )}
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}

// Hook for managing filter state with localStorage persistence
export function useFilters(storageKey: string, defaultRange = 'last30') {
  const [selectedRange, setSelectedRange] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`${storageKey}_range`) || defaultRange
    }
    return defaultRange
  })
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${storageKey}_date`)
      return stored ? new Date(stored) : undefined
    }
    return undefined
  })

  const handleRangeChange = React.useCallback((range: string) => {
    setSelectedRange(range)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}_range`, range)
    }
  }, [storageKey])

  const handleDateChange = React.useCallback((date: Date | undefined) => {
    setSelectedDate(date)
    if (typeof window !== 'undefined') {
      if (date) {
        localStorage.setItem(`${storageKey}_date`, date.toISOString())
      } else {
        localStorage.removeItem(`${storageKey}_date`)
      }
    }
  }, [storageKey])

  const clearFilters = React.useCallback(() => {
    setSelectedRange(defaultRange)
    setSelectedDate(undefined)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${storageKey}_range`)
      localStorage.removeItem(`${storageKey}_date`)
    }
  }, [storageKey, defaultRange])

  const getDateRangeFilter = React.useCallback(() => {
    if (selectedRange === 'custom' && selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      return { start: dateStr, end: dateStr }
    }
    
    if (selectedRange && selectedRange !== 'custom') {
      const range = getDateRange(selectedRange)
      return range.start ? { start: range.start, end: range.end } : null
    }
    
    return null
  }, [selectedRange, selectedDate])

  return {
    selectedRange,
    selectedDate,
    handleRangeChange,
    handleDateChange,
    clearFilters,
    getDateRangeFilter,
    getSelectedLabel: () => {
      if (selectedRange === 'custom' && selectedDate) {
        return format(selectedDate, 'MMM dd, yyyy')
      }
      const range = getDateRange(selectedRange)
      return range.label
    }
  }
}
