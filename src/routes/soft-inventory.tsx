import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { softInventoryVarianceSchema, type SoftInventoryVarianceFormData } from '@/lib/schemas'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChartCard } from '@/components/ui/chart-card'
import { FilterToolbar, useFilters } from '@/components/ui/filter-toolbar'
import { OverviewKpiCard } from '@/components/overview/OverviewKpiCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'

export const Route = createFileRoute('/soft-inventory')({
  component: SoftInventoryPage,
})

// Define food items with their display names and database field names
const FOOD_ITEMS = [
  { key: 'bacon_variance', label: 'Bacon', color: '#ef4444' },
  { key: 'beef_4oz_variance', label: 'Beef 4oz', color: '#dc2626' },
  { key: 'beef_small_variance', label: 'Beef Small', color: '#b91c1c' },
  { key: 'chicken_breaded_variance', label: 'Chicken Breaded', color: '#16a34a' },
  { key: 'chicken_diced_variance', label: 'Chicken Diced', color: '#15803d' },
  { key: 'chicken_nuggets_variance', label: 'Chicken Nuggets', color: '#ca8a04' },
  { key: 'chicken_nuggets_spicy_variance', label: 'Chicken Nuggets Spicy', color: '#a16207' },
  { key: 'chicken_patty_3_1_variance', label: 'Chicken Patty 3.1', color: '#059669' },
  { key: 'chicken_breaded_spicy_variance', label: 'Chicken Breaded Spicy', color: '#047857' },
  { key: 'chicken_strips_variance', label: 'Chicken Strips', color: '#0891b2' },
  { key: 'sausage_patty_variance', label: 'Sausage Patty', color: '#7c2d12' },
]

function SoftInventoryPage() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Use the filter hook with persistence
  const filters = useFilters('soft-inventory', 'today')

  // Resolve store_id for current user
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id
      if (!userId) return
      const { data, error } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userId)
        .maybeSingle()
      if (!active) return
      if (error) {
        console.error('Error fetching store ID:', error)
        return
      }
      setStoreId(data?.store_id ?? null)
    })()
    return () => { active = false }
  }, [])

  // Get date range from filter hook
  const dateRangeFilter = filters.getDateRangeFilter()

  // Fetch soft inventory variance data
  const { data: varianceData = [], isLoading, error } = useQuery({
    queryKey: ['soft-inventory-variance', storeId, dateRangeFilter?.start, dateRangeFilter?.end],
    queryFn: async () => {
      if (!storeId) return []

      let query = supabase
        .from('soft_inventory_variance')
        .select('*')
        .eq('store_id', storeId)
        
      if (dateRangeFilter) {
        query = query
          .gte('business_date', dateRangeFilter.start)
          .lte('business_date', dateRangeFilter.end)
      }
      
      const { data, error } = await query
        .order('business_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Fetch data for charts (last 30 days)
  const { data: chartData = [] } = useQuery({
    queryKey: ['soft-inventory-charts', storeId],
    queryFn: async () => {
      if (!storeId) return []

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const startDate = thirtyDaysAgo.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('soft_inventory_variance')
        .select('*')
        .eq('store_id', storeId)
        .gte('business_date', startDate)
        .order('business_date', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Form setup
  const form = useForm<SoftInventoryVarianceFormData>({
    resolver: zodResolver(softInventoryVarianceSchema),
    defaultValues: {
      business_date: format(new Date(), 'yyyy-MM-dd'),
      bacon_variance: 0,
      beef_4oz_variance: 0,
      beef_small_variance: 0,
      chicken_breaded_variance: 0,
      chicken_diced_variance: 0,
      chicken_nuggets_variance: 0,
      chicken_nuggets_spicy_variance: 0,
      chicken_patty_3_1_variance: 0,
      chicken_breaded_spicy_variance: 0,
      chicken_strips_variance: 0,
      sausage_patty_variance: 0,
      notes: ''
    }
  })

  // Mutation for creating/updating entries
  const mutation = useMutation({
    mutationFn: async (data: SoftInventoryVarianceFormData) => {
      if (!storeId) throw new Error('Store ID not available')

      const entryData = {
        store_id: storeId,
        business_date: data.business_date,
        bacon_variance: data.bacon_variance,
        beef_4oz_variance: data.beef_4oz_variance,
        beef_small_variance: data.beef_small_variance,
        chicken_breaded_variance: data.chicken_breaded_variance,
        chicken_diced_variance: data.chicken_diced_variance,
        chicken_nuggets_variance: data.chicken_nuggets_variance,
        chicken_nuggets_spicy_variance: data.chicken_nuggets_spicy_variance,
        chicken_patty_3_1_variance: data.chicken_patty_3_1_variance,
        chicken_breaded_spicy_variance: data.chicken_breaded_spicy_variance,
        chicken_strips_variance: data.chicken_strips_variance,
        sausage_patty_variance: data.sausage_patty_variance,
        notes: data.notes || null
      }

      if (editingEntry) {
        const { error } = await supabase
          .from('soft_inventory_variance')
          .update(entryData)
          .eq('id', editingEntry)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('soft_inventory_variance')
          .insert(entryData)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soft-inventory-variance'] })
      queryClient.invalidateQueries({ queryKey: ['soft-inventory-charts'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
      setEditingEntry(null)
      setIsAddingNew(false)
      form.reset()
      toast({
        title: "Success",
        description: editingEntry ? "Variance entry updated successfully" : "Variance entry added successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save variance entry",
        variant: "destructive"
      })
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('soft_inventory_variance')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soft-inventory-variance'] })
      queryClient.invalidateQueries({ queryKey: ['soft-inventory-charts'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
      toast({
        title: "Success",
        description: "Variance entry deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete variance entry",
        variant: "destructive"
      })
    }
  })

  // Calculate aggregated metrics for each food item
  const aggregatedData = useMemo(() => {
    if (varianceData.length === 0) {
      return FOOD_ITEMS.reduce((acc, item) => ({
        ...acc,
        [item.key]: {
          totalEntries: 0,
          averageVariance: 0,
          averageAbsVariance: 0,
          positiveVariance: 0,
          negativeVariance: 0,
          bestVariance: 0,
          worstVariance: 0,
          worstAbsVariance: 0
        }
      }), {} as Record<string, {
        totalEntries: number;
        averageVariance: number;
        averageAbsVariance: number;
        positiveVariance: number;
        negativeVariance: number;
        bestVariance: number;
        worstVariance: number;
        worstAbsVariance: number;
      }>)
    }

    return FOOD_ITEMS.reduce((acc, item) => {
      const variances = varianceData.map(entry => entry[item.key as keyof typeof entry] as number)
      const positiveVariances = variances.filter(v => v > 0)
      const negativeVariances = variances.filter(v => v < 0)
      const absVariances = variances.map(v => Math.abs(v))

      acc[item.key] = {
        totalEntries: varianceData.length,
        averageVariance: variances.reduce((sum, v) => sum + v, 0) / variances.length,
        averageAbsVariance: absVariances.reduce((sum, v) => sum + v, 0) / absVariances.length,
        positiveVariance: positiveVariances.length,
        negativeVariance: negativeVariances.length,
        bestVariance: Math.min(...absVariances), // Closest to zero is best
        worstVariance: Math.max(...absVariances), // Farthest from zero is worst
        worstAbsVariance: Math.max(...absVariances)
      }
      return acc
    }, {} as Record<string, {
      totalEntries: number;
      averageVariance: number;
      averageAbsVariance: number;
      positiveVariance: number;
      negativeVariance: number;
      bestVariance: number;
      worstVariance: number;
      worstAbsVariance: number;
    }>)
  }, [varianceData])

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    if (varianceData.length === 0) {
      return {
        totalEntries: 0,
        averageVariance: 0,
        averageAbsVariance: 0,
        positiveVariance: 0,
        negativeVariance: 0
      }
    }

    const allVariances = varianceData.flatMap(entry => 
      FOOD_ITEMS.map(item => entry[item.key as keyof typeof entry] as number)
    )
    const positiveVariances = allVariances.filter(v => v > 0)
    const negativeVariances = allVariances.filter(v => v < 0)
    const absVariances = allVariances.map(v => Math.abs(v))

    return {
      totalEntries: varianceData.length,
      averageVariance: allVariances.reduce((sum, v) => sum + v, 0) / allVariances.length,
      averageAbsVariance: absVariances.reduce((sum, v) => sum + v, 0) / absVariances.length,
      positiveVariance: positiveVariances.length,
      negativeVariance: negativeVariances.length
    }
  }, [varianceData])

  // Prepare chart data
  const chartEntries = useMemo(() => {
    return chartData.map(entry => ({
      date: entry.business_date,
      formattedDate: format(new Date(entry.business_date), 'MMM dd'),
      ...FOOD_ITEMS.reduce((acc, item) => {
        const value = entry[item.key as keyof typeof entry] as number
        acc[item.label] = Math.abs(value) // Use absolute values for better visualization
        acc[`${item.label}_original`] = value // Keep original for tooltip
        return acc
      }, {} as Record<string, number>)
    }))
  }, [chartData])

  const handleEdit = (entry: any) => {
    setEditingEntry(entry.id)
    setIsAddingNew(false)
    form.reset({
      business_date: entry.business_date,
      bacon_variance: entry.bacon_variance || 0,
      beef_4oz_variance: entry.beef_4oz_variance || 0,
      beef_small_variance: entry.beef_small_variance || 0,
      chicken_breaded_variance: entry.chicken_breaded_variance || 0,
      chicken_diced_variance: entry.chicken_diced_variance || 0,
      chicken_nuggets_variance: entry.chicken_nuggets_variance || 0,
      chicken_nuggets_spicy_variance: entry.chicken_nuggets_spicy_variance || 0,
      chicken_patty_3_1_variance: entry.chicken_patty_3_1_variance || 0,
      chicken_breaded_spicy_variance: entry.chicken_breaded_spicy_variance || 0,
      chicken_strips_variance: entry.chicken_strips_variance || 0,
      sausage_patty_variance: entry.sausage_patty_variance || 0,
      notes: entry.notes || ''
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this variance entry?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCancel = () => {
    setEditingEntry(null)
    setIsAddingNew(false)
    form.reset({
      business_date: format(new Date(), 'yyyy-MM-dd'),
      bacon_variance: 0,
      beef_4oz_variance: 0,
      beef_small_variance: 0,
      chicken_breaded_variance: 0,
      chicken_diced_variance: 0,
      chicken_nuggets_variance: 0,
      chicken_nuggets_spicy_variance: 0,
      chicken_patty_3_1_variance: 0,
      chicken_breaded_spicy_variance: 0,
      chicken_strips_variance: 0,
      sausage_patty_variance: 0,
      notes: ''
    })
  }

  const onSubmit = (data: SoftInventoryVarianceFormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-wendys-charcoal">Soft Inventory Analysis</h1>
          <p className="text-gray-600">
            Track daily variance percentages for specific food items
            {isLoading && <span className="ml-2 text-sm">(Loading...)</span>}
          </p>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              Error loading data: {error.message}
            </div>
          )}
        </div>

        {/* Filter Toolbar */}
        <FilterToolbar
          selectedRange={filters.selectedRange}
          selectedDate={filters.selectedDate}
          onRangeChange={filters.handleRangeChange}
          onDateChange={filters.handleDateChange}
          onClearFilters={filters.clearFilters}
          compact
        />
      </div>

      {/* Add/Edit Form */}
      <div className="wendys-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-wendys-charcoal">
            {isAddingNew ? 'Add New Variance Entry' : editingEntry ? 'Edit Variance Entry' : 'Variance Entry Form'}
          </h3>
          {!isAddingNew && !editingEntry && (
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-wendys-red hover:bg-wendys-dark-red text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>

        {(isAddingNew || editingEntry) && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_date">Business Date</Label>
                <Input
                  id="business_date"
                  type="date"
                  {...form.register('business_date')}
                  className={form.formState.errors.business_date ? 'border-red-500' : ''}
                />
                {form.formState.errors.business_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.business_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Food Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FOOD_ITEMS.map((item) => (
                <div key={item.key}>
                  <Label htmlFor={item.key} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </Label>
                  <Input
                    id={item.key}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register(item.key as keyof SoftInventoryVarianceFormData, {
                      setValueAs: (value) => value === '' ? 0 : parseFloat(value)
                    })}
                    className={form.formState.errors[item.key as keyof typeof form.formState.errors] ? 'border-red-500' : ''}
                  />
                  {form.formState.errors[item.key as keyof typeof form.formState.errors] && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors[item.key as keyof typeof form.formState.errors]?.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Enter positive for overage, negative for shortage (e.g., -66.38)
                  </p>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this variance..."
                {...form.register('notes')}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-wendys-red hover:bg-wendys-dark-red text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {mutation.isPending ? 'Saving...' : editingEntry ? 'Update' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={mutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Overall KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewKpiCard
          title="Total Entries"
          value={overallMetrics.totalEntries}
          format="number"
          icon={Package}
          trend="neutral"
        />

        <OverviewKpiCard
          title="Average Variance"
          value={overallMetrics.averageAbsVariance}
          format="percentage"
          icon={BarChart3}
          trend="neutral"
          subtitle="Lower is better"
        />

        <OverviewKpiCard
          title="Positive Variances"
          value={overallMetrics.positiveVariance}
          format="number"
          icon={TrendingUp}
          trend="neutral"
          suffix="count"
        />

        <OverviewKpiCard
          title="Negative Variances"
          value={overallMetrics.negativeVariance}
          format="number"
          icon={TrendingDown}
          trend="neutral"
          suffix="count"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Variance Trend by Item"
          subtitle="Last 30 days - Higher values indicate worse performance"
          loading={!chartEntries.length && !error}
          error={error?.message}
        >
          {chartEntries.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartEntries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: 'Variance % (Higher = Worse)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => {
                      const originalValue = props.payload?.[`${name}_original`]
                      return [`${originalValue !== undefined ? originalValue : value}%`, name]
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                  {FOOD_ITEMS.map((item) => (
                    <Line 
                      key={item.key}
                      type="monotone" 
                      dataKey={item.label}
                      stroke={item.color}
                      strokeWidth={2.5}
                      dot={{ fill: item.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: item.color, strokeWidth: 2, fill: '#fff' }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              <div className="text-center">
                <p>No variance data available</p>
                <p className="text-sm mt-1">Add entries below to see trends</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Item Performance Summary"
          subtitle="Average variance by item"
          loading={!chartEntries.length && !error}
          error={error?.message}
        >
          {chartEntries.length > 0 ? (
            <div className="h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {FOOD_ITEMS.map((item) => {
                  const data = aggregatedData[item.key]
                  return (
                    <div key={item.key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm" style={{ color: item.color }}>
                          {item.label}
                        </span>
                        <span className={`text-sm font-bold ${
                          data.averageAbsVariance <= 5 ? 'text-green-600' : 
                          data.averageAbsVariance <= 15 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {data.averageAbsVariance.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Best: {data.bestVariance.toFixed(1)}%</span>
                        <span>Worst: {data.worstVariance.toFixed(1)}%</span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              data.averageAbsVariance <= 5 ? 'bg-green-500' : 
                              data.averageAbsVariance <= 15 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((data.averageAbsVariance / 30) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Avg. Abs. Variance (Lower = Better)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              <div className="text-center">
                <p>No variance data available</p>
                <p className="text-sm mt-1">Add entries below to see performance</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Data Table */}
      <div className="wendys-card">
        <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">Variance Entries</h3>
        
        {varianceData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No variance entries found</p>
            <p className="text-sm mt-1">Add your first entry using the form above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  {FOOD_ITEMS.map((item) => (
                    <th key={item.key} className="text-left py-3 px-4 font-medium text-gray-700">
                      {item.label}
                    </th>
                  ))}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Notes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {varianceData.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {format(new Date(entry.business_date), 'MMM dd, yyyy')}
                    </td>
                    {FOOD_ITEMS.map((item) => {
                      const value = entry[item.key as keyof typeof entry] as number
                      return (
                        <td key={item.key} className="py-3 px-4">
                          <span className={`font-medium ${
                            value > 0 
                              ? 'text-green-600' 
                              : value < 0 
                              ? 'text-red-600' 
                              : 'text-gray-600'
                          }`}>
                            {value > 0 ? '+' : ''}{value.toFixed(1)}%
                          </span>
                        </td>
                      )
                    })}
                    <td className="py-3 px-4 text-gray-600">
                      {entry.notes || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          disabled={deleteMutation.isPending}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}