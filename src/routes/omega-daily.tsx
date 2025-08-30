import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Calendar, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils'
import { chartFormatters, chartColors, chartDefaults, getDateRange } from '@/lib/chart-utils'
import { ChartCard } from '@/components/ui/chart-card'
import { MobileResponsiveTable } from '@/components/ui/mobile-responsive-table'
import { FilterToolbar, useFilters } from '@/components/ui/filter-toolbar'
import { omegaDailySchema, type OmegaDailyFormData } from '@/lib/schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, ReferenceLine } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

export const Route = createFileRoute('/omega-daily')({
  component: OmegaDailyPage,
})

type OmegaDailyRow = {
  id: string
  store_id: string
  business_date: string
  net_sales: number
  last_year_sales: number
  labor_hours: number
  ideal_labor_hours: number
  labor_percentage: number
  food_variance_cost: number
  waste_amount: number
  breakfast_sales: number
  night_sales: number
}

function OmegaDailyPage() {

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [storeId, setStoreId] = useState<string | null>(null)

  // Use the new filter hook with persistence
  const filters = useFilters('omega-daily', 'last30')

  // Sample data generator
  const generateSampleData = async () => {
    if (!storeId) {
      toast({
        title: 'Store not linked',
        description: 'Please link your account to a store first.',
        variant: 'destructive'
      })
      return
    }

    try {
      const sampleEntries = []
      const today = new Date()

      // Generate 10 days of sample data
      for (let i = 9; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        sampleEntries.push({
          store_id: storeId,
          business_date: format(date, 'yyyy-MM-dd'),
          net_sales: Math.floor(Math.random() * 5000) + 8000, // $8K-13K
          last_year_sales: Math.floor(Math.random() * 4000) + 7000, // $7K-11K
          labor_hours: Math.floor(Math.random() * 40) + 60, // 60-100 hours
          ideal_labor_hours: Math.floor(Math.random() * 30) + 50, // 50-80 hours
          labor_percentage: Math.floor(Math.random() * 10) + 15, // 15-25%
          food_variance_cost: Math.floor(Math.random() * 200) - 100, // -$100 to +$100
          waste_amount: Math.floor(Math.random() * 100) + 50, // $50-150
          breakfast_sales: Math.floor(Math.random() * 1000) + 500, // $500-1500
          night_sales: Math.floor(Math.random() * 1500) + 1000, // $1000-2500
        })
      }

      const { error } = await supabase
        .from('omega_daily')
        .insert(sampleEntries)

      if (error) throw error

      toast({
        title: 'Sample data added!',
        description: '10 days of sample OMEGA entries have been created.',
      })

      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['omega_daily', 'last30', storeId] })

    } catch (error: any) {
      toast({
        title: 'Error adding sample data',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Manual refresh function
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['omega_daily', storeId] })
    toast({
      title: 'Refreshing data...',
      description: 'Reloading your OMEGA entries.',
    })
  }

  const form = useForm<OmegaDailyFormData>({
    resolver: zodResolver(omegaDailySchema),
    defaultValues: {
      business_date: format(new Date(), 'yyyy-MM-dd'),
      net_sales: 0,
      last_year_sales: 0,
      labor_hours: 0,
      ideal_labor_hours: 0,
      labor_percentage: 0,
      food_variance_cost: 0,
      waste_amount: 0,
      breakfast_sales: 0,
      night_sales: 0,
    },
  })

  const insertMutation = useMutation<
    OmegaDailyRow[] | null,
    any,
    OmegaDailyFormData,
    { optimisticId: string; touchedCaches: Array<{ queryKey: QueryKey; previousData: OmegaDailyRow[] | undefined }> }
  >({
    // Optimistic update before the API request
    onMutate: async (payload: OmegaDailyFormData) => {
      if (!storeId) {
        throw new Error('No store is linked to your account. See Setup to link one.')
      }

      await queryClient.cancelQueries({ queryKey: ['omega_daily'] })

      const optimisticId = `temp-${Date.now()}`
      const optimisticEntry: OmegaDailyRow = {
        id: optimisticId,
        store_id: storeId,
        business_date: payload.business_date,
        net_sales: payload.net_sales,
        last_year_sales: payload.last_year_sales,
        labor_hours: payload.labor_hours,
        ideal_labor_hours: payload.ideal_labor_hours,
        labor_percentage: payload.labor_percentage,
        food_variance_cost: payload.food_variance_cost,
        waste_amount: payload.waste_amount,
        breakfast_sales: payload.breakfast_sales,
        night_sales: payload.night_sales,
      }

      // Update all omega_daily caches that might include this entry
      const touchedCaches: Array<{ queryKey: QueryKey; previousData: OmegaDailyRow[] | undefined }> = []
      const queries = queryClient.getQueriesData<OmegaDailyRow[]>({ queryKey: ['omega_daily'] })
      for (const [key, previousData] of queries) {
        // Key format: ['omega_daily', storeId, start?, end?]
        const k = key as unknown[]
        const keyIncludesStore = k.includes(storeId)
        if (!keyIncludesStore) continue

        // If date range is present on the key, ensure the new date is within range
        let withinRange = true
        const start = typeof k[2] === 'string' ? String(k[2]) : undefined
        const end = typeof k[3] === 'string' ? String(k[3]) : undefined
        if (start && end) {
          withinRange = payload.business_date >= start && payload.business_date <= end
        }
        if (!withinRange) continue

        const next = [optimisticEntry, ...(previousData || [])]
        next.sort((a, b) => (a.business_date > b.business_date ? -1 : a.business_date < b.business_date ? 1 : 0))

        touchedCaches.push({ queryKey: key, previousData })
        queryClient.setQueryData<OmegaDailyRow[]>(key, next)
      }

      return { optimisticId, touchedCaches }
    },
    mutationFn: async (payload: OmegaDailyFormData) => {
      console.log('🔄 Starting insertMutation with payload:', payload)
      console.log('🏪 Store ID:', storeId)
      
      if (!storeId) {
        console.error('❌ No store ID found')
        throw new Error('No store is linked to your account. See Setup to link one.')
      }
      
      const insertData = {
        store_id: storeId,
        business_date: payload.business_date, // 'YYYY-MM-DD'
        net_sales: payload.net_sales,
        last_year_sales: payload.last_year_sales,
        labor_hours: payload.labor_hours,
        ideal_labor_hours: payload.ideal_labor_hours,
        labor_percentage: payload.labor_percentage,
        food_variance_cost: payload.food_variance_cost,
        waste_amount: payload.waste_amount,
        breakfast_sales: payload.breakfast_sales,
        night_sales: payload.night_sales,
      }
      
      console.log('📤 Inserting data:', insertData)
      
      const { data, error } = await supabase.from('omega_daily').insert(insertData).select()
      
      console.log('📥 Supabase response - data:', data, 'error:', error)
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('✅ Insert successful:', data)
      return data
    },
    onError: (error: any, _payload, context) => {
      // Roll back optimistic updates
      if (context?.touchedCaches) {
        for (const { queryKey, previousData } of context.touchedCaches) {
          queryClient.setQueryData<OmegaDailyRow[]>(queryKey, previousData || [])
        }
      }
      console.error('💥 Insert mutation failed (rolled back):', error)
      toast({ title: 'Save failed', description: error?.message || 'Unable to save entry.', variant: 'destructive' })
    },
    onSuccess: (data, _variables, context) => {
      console.log('🎉 Insert mutation succeeded with data:', data)
      toast({ title: 'Success!', description: 'Daily metrics saved successfully.' })
      // Reconcile the optimistic row with the real row (replace temp id)
      const saved = Array.isArray(data) && data[0] ? data[0] as unknown as OmegaDailyRow : undefined
      if (saved && context?.touchedCaches && context.optimisticId) {
        for (const { queryKey } of context.touchedCaches) {
          const current = (queryClient.getQueryData<OmegaDailyRow[]>(queryKey) ?? []) as OmegaDailyRow[]
          const replaced = current.map((row: OmegaDailyRow) => row.id === context.optimisticId ? saved : row)
          queryClient.setQueryData<OmegaDailyRow[]>(queryKey, replaced)
        }
      }
      setIsFormOpen(false)
      setEditingEntry(null)
      form.reset()
      // Optionally refresh to ensure all views are consistent
      // queryClient.invalidateQueries({ queryKey: ['omega_daily'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: OmegaDailyFormData }) => {
      if (!storeId) {
        throw new Error('No store is linked to your account. See Setup to link one.')
      }
      const { error } = await supabase.from('omega_daily').update({
        business_date: payload.business_date,
        net_sales: payload.net_sales,
        last_year_sales: payload.last_year_sales,
        labor_hours: payload.labor_hours,
        ideal_labor_hours: payload.ideal_labor_hours,
        labor_percentage: payload.labor_percentage,
        food_variance_cost: payload.food_variance_cost,
        waste_amount: payload.waste_amount,
        breakfast_sales: payload.breakfast_sales,
        night_sales: payload.night_sales,
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Updated!', description: 'Daily metrics updated successfully.' })
      setIsFormOpen(false)
      setEditingEntry(null)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['omega_daily', 'last30', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    }
  })

  const onSubmit = (data: OmegaDailyFormData) => {
    console.log('🚀 onSubmit called with data:', data)
    console.log('📋 Form errors:', form.formState.errors)
    console.log('🏪 Store ID:', storeId)
    console.log('✏️ Editing entry:', editingEntry)
    console.log('🔄 Insert mutation pending:', insertMutation.isPending)
    console.log('🔄 Update mutation pending:', updateMutation.isPending)
    
    if (editingEntry) {
      console.log('📝 Calling updateMutation...')
      updateMutation.mutate({ id: editingEntry.id, payload: data })
    } else {
      console.log('➕ Calling insertMutation...')
      insertMutation.mutate(data)
    }
  }

  // Add error handler for form validation failures
  const onInvalidSubmit = (errors: any) => {
    console.error('❌ Form validation failed with errors:', errors)
    toast({
      title: 'Validation Error',
      description: 'Please check the form for errors and try again.',
      variant: 'destructive'
    })
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('omega_daily').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Daily metrics entry removed.' })
      queryClient.invalidateQueries({ queryKey: ['omega_daily', 'last30', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    }
  })
  // Resolve store_id for current user
  useEffect(() => {
    let active = true
    ;(async () => {
      console.log('🔐 Checking user authentication...')
      const { data: auth, error: authError } = await supabase.auth.getUser()
      console.log('👤 Auth data:', auth, 'Auth error:', authError)
      
      const userId = auth.user?.id
      if (!userId) {
        console.log('❌ No user ID found - user not authenticated')
        return
      }

      console.log('🔍 Looking up store for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userId)
        .maybeSingle()

      console.log('🏪 Store lookup result - data:', data, 'error:', error)

      if (!active) return

      if (error) {
        console.error('❌ Store lookup error:', error)
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to your store. Please check your setup.',
          variant: 'destructive'
        })
        return
      }

      setStoreId(data?.store_id ?? null)
      console.log('✅ Store ID set to:', data?.store_id ?? null)

      if (!data?.store_id) {
        console.log('⚠️ No store linked to user account')
        toast({
          title: 'Store Not Linked',
          description: 'Your account isn\'t linked to a store yet. Please go to Setup to link your account.',
          variant: 'destructive'
        })
      }
    })()
    return () => { active = false }
  }, [])

  // Get date range from filter hook
  const dateRangeFilter = filters.getDateRangeFilter()

  // Load filtered entries (scoped to store and date filter if available)
  const { data: omegaEntries = [], isLoading, error } = useQuery<OmegaDailyRow[]>({
    queryKey: ['omega_daily', storeId, dateRangeFilter?.start, dateRangeFilter?.end],
    queryFn: async () => {
      if (!storeId) {
        return []
      }
      
      let query = supabase
        .from('omega_daily')
        .select('*')
        .eq('store_id', storeId)

      if (dateRangeFilter) {
        query = query
          .gte('business_date', dateRangeFilter.start)
          .lte('business_date', dateRangeFilter.end)
      }

      const { data, error } = await query
        .order('business_date', { ascending: false })
        .limit(100) // Limit to prevent too much data

      if (error) {
        throw error
      }

      return data as OmegaDailyRow[]
    },
    enabled: !!storeId, // Only run when we have a store ID
  })

  // Load chart data (always last 30 days, independent of filters)
  const { data: chartData = [] } = useQuery<OmegaDailyRow[]>({
    queryKey: ['omega_daily_charts', storeId],
    queryFn: async () => {
      if (!storeId) return []

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const startDate = format(thirtyDaysAgo, 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('omega_daily')
        .select('*')
        .eq('store_id', storeId)
        .gte('business_date', startDate)
        .order('business_date', { ascending: true })

      if (error) {
        throw error
      }

      return data as OmegaDailyRow[]
    },
    enabled: !!storeId,
  })

  // Load Month-to-Date data for KPI cards
  const { data: mtdData = [] } = useQuery<OmegaDailyRow[]>({
    queryKey: ['omega_daily_mtd', storeId],
    queryFn: async () => {
      if (!storeId) return []

      const { start, end } = getDateRange('mtd')
      const { data, error } = await supabase
        .from('omega_daily')
        .select('*')
        .eq('store_id', storeId)
        .gte('business_date', start)
        .lte('business_date', end)
        .order('business_date', { ascending: true })

      if (error) {
        throw error
      }

      return data as OmegaDailyRow[]
    },
    enabled: !!storeId,
  })


  // Helper: apply a specific date filter via toolbar state
  const applyDateFilter = (isoDate?: string) => {
    if (!isoDate) return
    filters.handleRangeChange('custom')
    // Parse yyyy-MM-dd as a local date to avoid UTC drift
    const y = Number(isoDate.slice(0, 4))
    const m = Number(isoDate.slice(5, 7))
    const d = Number(isoDate.slice(8, 10))
    filters.handleDateChange(new Date(y, (m || 1) - 1, d || 1))
  }
  // Chart data always uses last 30 days, independent of filters
  const chartDataCompSales = useMemo(() => {
    if (!chartData.length) return []

    return chartData.map((r) => ({
      date: chartFormatters.dateShort(r.business_date),
      dateFull: chartFormatters.dateFull(r.business_date),
      isoDate: typeof r.business_date === 'string' ? r.business_date : (r.business_date as unknown as string),
      comp_net_sales_percentage: r.last_year_sales ? ((r.net_sales - r.last_year_sales) / r.last_year_sales) * 100 : 0,
    }))
  }, [chartData])

  const chartDataWasteFood = useMemo(() => {
    if (!chartData.length) return []

    return chartData.map((r) => ({
      date: chartFormatters.dateShort(r.business_date),
      dateFull: chartFormatters.dateFull(r.business_date),
      isoDate: typeof r.business_date === 'string' ? r.business_date : (r.business_date as unknown as string),
      waste_percentage: r.net_sales ? (r.waste_amount / r.net_sales) * 100 : 0,
      food_variance_percentage: r.net_sales ? -(r.food_variance_cost / r.net_sales) * 100 : 0,
    }))
  }, [chartData])

  const handleEdit = (entry: any) => {
    setEditingEntry(entry)
    
    // Convert all values explicitly, handling strings from database
    const formData = {
      business_date: entry.business_date || format(new Date(), 'yyyy-MM-dd'),
      net_sales: entry.net_sales != null ? Number(entry.net_sales) : 0,
      last_year_sales: entry.last_year_sales != null ? Number(entry.last_year_sales) : 0,
      labor_hours: entry.labor_hours != null ? Number(entry.labor_hours) : 0,
      ideal_labor_hours: entry.ideal_labor_hours != null ? Number(entry.ideal_labor_hours) : 0,
      labor_percentage: entry.labor_percentage != null ? Number(entry.labor_percentage) : 0,
      food_variance_cost: entry.food_variance_cost != null ? Number(entry.food_variance_cost) : 0,
      waste_amount: entry.waste_amount != null ? Number(entry.waste_amount) : 0,
      breakfast_sales: entry.breakfast_sales != null ? Number(entry.breakfast_sales) : 0,
      night_sales: entry.night_sales != null ? Number(entry.night_sales) : 0,
    }
    
    form.reset(formData)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  // Calculate computed values for form preview
  const watchValues = form.watch()
  const compNetSalesPercentage = watchValues.last_year_sales > 0
    ? ((watchValues.net_sales - watchValues.last_year_sales) / watchValues.last_year_sales) * 100
    : 0
  const laborHoursDiff = watchValues.labor_hours - watchValues.ideal_labor_hours
  const foodVariancePercentage = watchValues.net_sales > 0 ? (watchValues.food_variance_cost / watchValues.net_sales) * 100 : 0
  const wastePercentage = watchValues.net_sales > 0 ? (watchValues.waste_amount / watchValues.net_sales) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-wendys-charcoal">Omega Daily</h1>
          <p className="text-sm md:text-base text-gray-600">
            Daily business metrics and performance tracking
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
          <Button onClick={() => {
            setEditingEntry(null)
            form.reset({
              business_date: format(new Date(), 'yyyy-MM-dd'),
              net_sales: 0,
              last_year_sales: 0,
              labor_hours: 0,
              ideal_labor_hours: 0,
              labor_percentage: 0,
              food_variance_cost: 0,
              waste_amount: 0,
              breakfast_sales: 0,
              night_sales: 0,
            })
            setIsFormOpen(true)
          }} className="wendys-button w-full md:w-auto" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Daily Entry
          </Button>
          {storeId && (
            <div className="flex space-x-2 md:space-x-0 md:flex-col md:space-y-2">
              <Button
                onClick={generateSampleData}
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none border-wendys-red text-wendys-red hover:bg-wendys-red hover:text-white"
              >
                Sample Data
              </Button>
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none border-gray-400 text-gray-600 hover:bg-gray-100"
              >
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics (Month-to-Date) */}
      <div className="wendys-card">
        {(() => {
          const mtdNetSales = mtdData.reduce((sum, e) => sum + (Number(e.net_sales) || 0), 0)
          const mtdLaborPct = mtdData.length > 0
            ? (mtdData.reduce((sum, e) => sum + (Number(e.labor_percentage) || 0), 0) / mtdData.length)
            : 0
          const totalWaste = mtdData.reduce((sum, e) => sum + (Number(e.waste_amount) || 0), 0)
          const mtdWastePct = mtdNetSales > 0 ? (totalWaste / mtdNetSales) * 100 : 0

          return (
            <div className="grid-auto">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">MTD Net Sales</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-wendys-charcoal">{formatCurrency(mtdNetSales)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">MTD Labor %</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-wendys-charcoal">{formatPercentage(mtdLaborPct)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">MTD Waste %</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-wendys-charcoal">{formatPercentage(mtdWastePct)}</p>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        selectedRange={filters.selectedRange}
        selectedDate={filters.selectedDate}
        onRangeChange={filters.handleRangeChange}
        onDateChange={filters.handleDateChange}
        onClearFilters={filters.clearFilters}
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          Error loading data: {error.message}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid-auto">
        {/* Comp Net Sales Chart */}
        <ChartCard
          title="Comp Net Sales Trend"
          subtitle="Last 30 days"
          loading={!chartData.length && !error}
          error={error?.message}
        >
          {chartDataCompSales.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartDataCompSales}>
                <CartesianGrid {...chartDefaults.cartesianGrid} />
                <XAxis dataKey="date" {...chartDefaults.xAxis} />
                <YAxis {...chartDefaults.yAxis} tickFormatter={(value) => chartFormatters.percent(value)} />
                <Tooltip
                  {...chartDefaults.tooltip}
                  formatter={(value) => [chartFormatters.percent(value as number, 1), 'Comp Sales %']}
                  labelFormatter={(label, payload: any) => (payload && payload[0] && payload[0].payload?.dateFull) || label}
                />
                <Line
                  type="monotone"
                  dataKey="comp_net_sales_percentage"
                  stroke={chartColors.sales}
                  strokeWidth={2}
                  dot={{ fill: chartColors.sales, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: chartColors.salesSecondary, strokeWidth: 2 }}
                  onClick={(d: any) => applyDateFilter(d?.payload?.isoDate)}
                />
            </LineChart>
          </ResponsiveContainer>
          </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No chart data available</p>
                <p className="text-sm mt-1">Add some entries to see trends</p>
        </div>
            </div>
          )}
        </ChartCard>

        {/* Waste Percentage Chart */}
        <ChartCard
          title="Waste Percentage"
          subtitle="Last 30 days"
          loading={!chartData.length && !error}
          error={error?.message}
        >
          {chartDataWasteFood.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartDataWasteFood}>
                <CartesianGrid {...chartDefaults.cartesianGrid} />
                <XAxis dataKey="date" {...chartDefaults.xAxis} />
                <YAxis {...chartDefaults.yAxis} tickFormatter={(value) => chartFormatters.percent(value)} />
                <Tooltip 
                  {...chartDefaults.tooltip}
                  formatter={(value) => [chartFormatters.percent(value as number, 2), 'Waste %']}
                  labelFormatter={(label, payload: any) => (payload && payload[0] && payload[0].payload?.dateFull) || label}
                />
                <ReferenceLine y={0.5} stroke={chartColors.textSecondary} strokeDasharray="4 4" label={{ value: 'Goal 0.5%', position: 'right', fill: chartColors.textSecondary, fontSize: 12 }} />
                <Bar dataKey="waste_percentage" fill={chartColors.waste} opacity={0.7} onClick={(d: any) => applyDateFilter(d?.payload?.isoDate)} />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No chart data available</p>
                <p className="text-sm mt-1">Add some entries to see trends</p>
        </div>
            </div>
          )}
        </ChartCard>

        {/* Food Variance Percentage Chart */}
        <ChartCard
          title="Food Variance"
          subtitle="Last 30 days"
          loading={!chartData.length && !error}
          error={error?.message}
        >
          {chartDataWasteFood.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataWasteFood}>
                <CartesianGrid {...chartDefaults.cartesianGrid} />
                <XAxis dataKey="date" {...chartDefaults.xAxis} />
                <YAxis {...chartDefaults.yAxis} tickFormatter={(value) => chartFormatters.percent(value)} />
                <Tooltip
                  {...chartDefaults.tooltip}
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  formatter={(_value, _name, props) => {
                    // Show the actual food variance percentage (not inverted) in tooltip
                    const originalValue = props?.payload?.food_variance_percentage !== undefined ? -props.payload.food_variance_percentage : 0
                    return [chartFormatters.percent(originalValue, 2), 'Food Variance %']
                  }}
                  labelFormatter={(label, payload: any) => (payload && payload[0] && payload[0].payload?.dateFull) || label}
                />
                <ReferenceLine y={0} stroke={chartColors.textSecondary} strokeDasharray="4 4" label={{ value: 'Target 0%', position: 'right', fill: chartColors.textSecondary, fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="food_variance_percentage" 
                  stroke={chartColors.foodVariance} 
                  strokeWidth={2}
                  dot={{ fill: chartColors.foodVariance, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: chartColors.warning, strokeWidth: 2 }}
                  onClick={(d: any) => applyDateFilter(d?.payload?.isoDate)}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No chart data available</p>
                <p className="text-sm mt-1">Add some entries to see trends</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Data Table - Mobile Responsive */}
      <div className="wendys-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-wendys-charcoal">
            {filters.selectedRange === 'last30' ? 'All Entries' : 'Filtered Entries'}
        </h3>
          <div className="text-xs md:text-sm text-gray-600 flex items-center">
            {isLoading ? 'Loading...' : `${omegaEntries.length} entries`}
            {filters.selectedRange !== 'last30' && 
              ` for ${filters.getSelectedLabel()}`
            }
            {(filters.selectedRange !== 'last30' || filters.selectedDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={filters.clearFilters}
                className="ml-3 text-xs text-gray-600 hover:text-gray-900"
              >
                Show All
              </Button>
            )}
          </div>
        </div>



        {omegaEntries?.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              {storeId ? (
                <div>
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm mt-2">
                    {filters.selectedRange === 'last30'
                      ? "You haven't added any daily entries yet."
                      : `No entries found for the selected filter. Try changing the filter or adding a new entry.`
                    }
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium">Store not connected</p>
                  <p className="text-sm mt-2">Please go to Setup to link your account to a store first.</p>
                </div>
              )}
            </div>
            {storeId && (
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                <Button onClick={() => setIsFormOpen(true)} className="wendys-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
                <Button
                  onClick={generateSampleData}
                  variant="outline"
                  className="border-wendys-red text-wendys-red hover:bg-wendys-red hover:text-white"
                >
                  Generate Sample Data
                </Button>
              </div>
            )}
          </div>
        ) : (
        <MobileResponsiveTable
          columns={[
            { key: 'business_date', label: 'Date', render: (value) => formatDate(value) },
            { key: 'net_sales', label: 'Net Sales', render: (value) => formatCurrency(value) },
            { key: 'comp_sales', label: 'Comp Sales', render: (_: any, row: any) => {
              const comp_net_sales = (row.net_sales ?? 0) - (row.last_year_sales ?? 0)
              return (
                <span className={`flex items-center ${comp_net_sales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comp_net_sales >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {formatCurrency(Math.abs(comp_net_sales))}
                </span>
              )
            }},
            { key: 'labor_hours', label: 'Labor Hours', render: (value) => `${value}h` },
            { key: 'labor_percentage', label: 'Labor %', render: (value) => formatPercentage(value) },
            { key: 'food_variance', label: 'Food Variance', render: (_: any, row: any) => {
              const food_variance_percentage = row.net_sales ? (row.food_variance_cost / row.net_sales) * 100 : 0
              return formatPercentage(food_variance_percentage)
            }},
            { key: 'waste', label: 'Waste', render: (_: any, row: any) => {
              const waste_percentage = row.net_sales ? (row.waste_amount / row.net_sales) * 100 : 0
              return formatPercentage(waste_percentage)
            }},
            { key: 'actions', label: 'Actions', render: (_: any, row: any) => (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(row)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    applyDateFilter(row.business_date)
                    toast({ title: 'Details', description: 'Detailed view coming soon.' })
                  }}
                  className="h-8 w-8 p-0"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(row.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )},
          ]}
          data={omegaEntries}
          mobileCardRender={(row: any) => {
            const comp_net_sales = (row.net_sales ?? 0) - (row.last_year_sales ?? 0)
            const food_variance_percentage = row.net_sales ? (row.food_variance_cost / row.net_sales) * 100 : 0
            const waste_percentage = row.net_sales ? (row.waste_amount / row.net_sales) * 100 : 0
            return (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{formatDate(row.business_date)}</span>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(row)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(row.id)}
                      className="h-8 w-8 p-0 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Net Sales:</span>
                    <div className="font-medium">{formatCurrency(row.net_sales)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Comp Sales:</span>
                    <div className={`font-medium flex items-center ${comp_net_sales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comp_net_sales >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {formatCurrency(Math.abs(comp_net_sales))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Labor:</span>
                    <div className="font-medium">{row.labor_hours}h ({formatPercentage(row.labor_percentage)})</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Food Variance:</span>
                    <div className="font-medium">{formatPercentage(food_variance_percentage)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Waste:</span>
                    <div className="font-medium">{formatPercentage(waste_percentage)}</div>
                  </div>
                </div>
              </div>
            )
          }}
          emptyMessage="No entries found"
          loading={isLoading}
        />
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-wendys-charcoal">
                {editingEntry ? 'Edit Daily Entry' : 'Add Daily Entry'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingEntry(null)
                  form.reset()
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4">
              {/* Form-level errors */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">Please fix the following errors:</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field}>• {error?.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Field */}
                <div className="md:col-span-2 space-y-2">
                  <Label>Business Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {form.watch('business_date') ? formatDate(form.watch('business_date')) : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={(() => {
                          const bd = form.watch('business_date')
                          if (!bd) return undefined
                          const y = Number(bd.slice(0, 4))
                          const m = Number(bd.slice(5, 7))
                          const d = Number(bd.slice(8, 10))
                          return new Date(y, (m || 1) - 1, d || 1)
                        })()}
                        onSelect={(date) => {
                          const iso = date ? format(date, 'yyyy-MM-dd') : ''
                          form.setValue('business_date', iso)
                          if (iso) {
                            const existing = omegaEntries.find(e => e.business_date === iso)
                            if (existing) {
                              setEditingEntry(existing)
                              form.reset({
                                business_date: existing.business_date,
                                net_sales: existing.net_sales != null ? Number(existing.net_sales) : 0,
                                last_year_sales: existing.last_year_sales != null ? Number(existing.last_year_sales) : 0,
                                labor_hours: existing.labor_hours != null ? Number(existing.labor_hours) : 0,
                                ideal_labor_hours: existing.ideal_labor_hours != null ? Number(existing.ideal_labor_hours) : 0,
                                labor_percentage: existing.labor_percentage != null ? Number(existing.labor_percentage) : 0,
                                food_variance_cost: existing.food_variance_cost != null ? Number(existing.food_variance_cost) : 0,
                                waste_amount: existing.waste_amount != null ? Number(existing.waste_amount) : 0,
                                breakfast_sales: existing.breakfast_sales != null ? Number(existing.breakfast_sales) : 0,
                                night_sales: existing.night_sales != null ? Number(existing.night_sales) : 0,
                              })
                              toast({ title: 'Loaded existing entry', description: `Loaded data for ${formatDate(existing.business_date)} to edit.` })
                            } else {
                              setEditingEntry(null)
                              form.reset({
                                business_date: iso,
                                net_sales: 0,
                                last_year_sales: 0,
                                labor_hours: 0,
                                ideal_labor_hours: 0,
                                labor_percentage: 0,
                                food_variance_cost: 0,
                                waste_amount: 0,
                                breakfast_sales: 0,
                                night_sales: 0,
                              })
                            }
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.business_date && (
                    <p className="text-sm text-red-600">{form.formState.errors.business_date.message}</p>
                  )}
                </div>

                {/* Net Sales */}
                <div className="space-y-2">
                  <Label htmlFor="net_sales">Net Sales ($)</Label>
                  <Input
                    id="net_sales"
                    type="number"
                    step="0.01"
                    {...form.register('net_sales')}
                  />
                  {form.formState.errors.net_sales && (
                    <p className="text-sm text-red-600">{form.formState.errors.net_sales.message}</p>
                  )}
                </div>

                {/* Last Year Sales */}
                <div className="space-y-2">
                  <Label htmlFor="last_year_sales">Last Year Sales ($)</Label>
                  <Input
                    id="last_year_sales"
                    type="number"
                    step="0.01"
                    {...form.register('last_year_sales')}
                  />
                  {form.formState.errors.last_year_sales && (
                    <p className="text-sm text-red-600">{form.formState.errors.last_year_sales.message}</p>
                  )}
                </div>

                {/* Comp Net Sales Percentage (Computed) */}
                <div className="space-y-2">
                  <Label htmlFor="comp_net_sales">Comp Net Sales (%)</Label>
                  <Input
                    id="comp_net_sales"
                    value={formatPercentage(compNetSalesPercentage)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Labor Hours */}
                <div className="space-y-2">
                  <Label htmlFor="labor_hours">Labor Hours</Label>
                  <Input
                    id="labor_hours"
                    type="number"
                    step="0.1"
                    {...form.register('labor_hours')}
                  />
                  {form.formState.errors.labor_hours && (
                    <p className="text-sm text-red-600">{form.formState.errors.labor_hours.message}</p>
                  )}
                </div>

                {/* Ideal Labor Hours */}
                <div className="space-y-2">
                  <Label htmlFor="ideal_labor_hours">Ideal Labor Hours</Label>
                  <Input
                    id="ideal_labor_hours"
                    type="number"
                    step="0.1"
                    {...form.register('ideal_labor_hours')}
                  />
                  {form.formState.errors.ideal_labor_hours && (
                    <p className="text-sm text-red-600">{form.formState.errors.ideal_labor_hours.message}</p>
                  )}
                </div>

                {/* Labor Hours Diff (Computed) */}
                <div className="space-y-2">
                  <Label htmlFor="labor_hours_diff">Labor Hours +/-</Label>
                  <Input
                    id="labor_hours_diff"
                    value={`${laborHoursDiff >= 0 ? '+' : ''}${laborHoursDiff.toFixed(1)}h`}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Labor Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="labor_percentage">Labor Percentage (%)</Label>
                  <Input
                    id="labor_percentage"
                    type="number"
                    step="0.1"
                    {...form.register('labor_percentage')}
                  />
                  {form.formState.errors.labor_percentage && (
                    <p className="text-sm text-red-600">{form.formState.errors.labor_percentage.message}</p>
                  )}
                </div>

                {/* Food Variance Cost */}
                <div className="space-y-2">
                  <Label htmlFor="food_variance_cost">Food Variance Cost ($)</Label>
                  <Input
                    id="food_variance_cost"
                    type="number"
                    step="0.01"
                    {...form.register('food_variance_cost')}
                  />
                  {form.formState.errors.food_variance_cost && (
                    <p className="text-sm text-red-600">{form.formState.errors.food_variance_cost.message}</p>
                  )}
                </div>

                {/* Food Variance Percentage (Computed) */}
                <div className="space-y-2">
                  <Label htmlFor="food_variance_percentage">Food Variance %</Label>
                  <Input
                    id="food_variance_percentage"
                    value={formatPercentage(foodVariancePercentage)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Waste Amount */}
                <div className="space-y-2">
                  <Label htmlFor="waste_amount">Waste Amount ($)</Label>
                  <Input
                    id="waste_amount"
                    type="number"
                    step="0.01"
                    {...form.register('waste_amount')}
                  />
                  {form.formState.errors.waste_amount && (
                    <p className="text-sm text-red-600">{form.formState.errors.waste_amount.message}</p>
                  )}
                </div>

                {/* Waste Percentage (Computed) */}
                <div className="space-y-2">
                  <Label htmlFor="waste_percentage">Waste %</Label>
                  <Input
                    id="waste_percentage"
                    value={formatPercentage(wastePercentage)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Breakfast Sales */}
                <div className="space-y-2">
                  <Label htmlFor="breakfast_sales">Breakfast Sales ($)</Label>
                  <Input
                    id="breakfast_sales"
                    type="number"
                    step="0.01"
                    {...form.register('breakfast_sales')}
                  />
                  {form.formState.errors.breakfast_sales && (
                    <p className="text-sm text-red-600">{form.formState.errors.breakfast_sales.message}</p>
                  )}
                </div>

                {/* Night Sales */}
                <div className="space-y-2">
                  <Label htmlFor="night_sales">Night Sales ($)</Label>
                  <Input
                    id="night_sales"
                    type="number"
                    step="0.01"
                    {...form.register('night_sales')}
                  />
                  {form.formState.errors.night_sales && (
                    <p className="text-sm text-red-600">{form.formState.errors.night_sales.message}</p>
                  )}
                </div>
              </div>

              {!storeId && (
                <div className="text-sm text-red-600">
                  Your account isn’t linked to a store yet. Open Setup and link your user to a store, then try again.
                </div>
              )}
              <div className="flex flex-col-reverse space-y-2 space-y-reverse md:flex-row md:space-y-0 md:space-x-3 pt-4 md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingEntry(null)
                    form.reset()
                  }}
                  className="w-full md:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="wendys-button w-full md:w-auto" disabled={insertMutation.isPending || updateMutation.isPending || !storeId}>
                  {editingEntry ? 'Update Entry' : 'Save Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}