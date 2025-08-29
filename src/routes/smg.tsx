import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SortableTable } from '@/components/ui/sortable-table'
import { ChartCard } from '@/components/ui/chart-card'
import { useToast } from '@/hooks/use-toast'
import { smgDailySchema, type SmgDailyFormData } from '@/lib/schemas'
import { supabase } from '@/lib/supabase'
import { chartFormatters, chartColors, chartDefaults } from '@/lib/chart-utils'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const Route = createFileRoute('/smg')({ component: SmgPage })

interface SmgDailyRow {
  id: string
  date: string
  accuracy_decimal: number
  zod_per_10k: number
  cc_complaints: number
  osat_decimal: number
  notes?: string
  created_at: string
}

function SmgPage() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<SmgDailyFormData>({
    resolver: zodResolver(smgDailySchema),
    defaultValues: {
      date: '',
      accuracy_decimal: 0,
      zod_per_10k: 0,
      cc_complaints: 0,
      osat_decimal: 0,
      notes: ''
    }
  })

  // Resolve store_id for current user (align with omega-daily pattern)
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
      if (error) return
      setStoreId(data?.store_id ?? null)
    })()
    return () => { active = false }
  }, [])

  // Fetch manual SMG entries for the table
  const { data: smgDailyEntries = [], isLoading, error } = useQuery<SmgDailyRow[]>({
    queryKey: ['smg_daily', storeId],
    queryFn: async () => {
      if (!storeId) return []

      const { data, error } = await supabase
        .from('smg_daily')
        .select('*')
        .eq('store_id', storeId)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Fallback: fetch imported SMG entries if no manual entries exist
  const { data: smgImportEntries = [] } = useQuery<any[]>({
    queryKey: ['smg_entries_import', storeId],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('smg_entries')
        .select('*')
        .eq('store_id', storeId)
        .order('entry_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Choose manual data if present, otherwise map imported data into the manual shape
  const smgEntries: SmgDailyRow[] = useMemo(() => {
    if (smgDailyEntries.length > 0) return smgDailyEntries
    if (!smgImportEntries.length) return []
    return smgImportEntries.map((r: any) => ({
      id: r.id,
      date: r.entry_date,
      accuracy_decimal: Number(r.accuracy_of_order) || 0,
      zod_per_10k: Number(r.zone_of_defection) || 0,
      cc_complaints: Number(r.customer_computers) || 0,
      osat_decimal: Number(r.osat) || 0,
      notes: '',
      created_at: r.created_at,
    }))
  }, [smgDailyEntries, smgImportEntries])

  // Create mutation for saving SMG entries
  const createMutation = useMutation({
    mutationFn: async (data: SmgDailyFormData) => {
      if (!storeId) throw new Error('Store not connected')

      const { error } = await supabase
        .from('smg_daily')
        .insert({
          store_id: storeId,
          date: data.date,
          accuracy_decimal: data.accuracy_decimal,
          zod_per_10k: data.zod_per_10k,
          cc_complaints: data.cc_complaints,
          osat_decimal: data.osat_decimal,
          notes: data.notes || null
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smg_daily', storeId] })
      form.reset()
      setSelectedDate(undefined)
      toast({
        title: "Success",
        description: "SMG entry saved successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save SMG entry.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: SmgDailyFormData) => {
    createMutation.mutate(data)
  }

  // Table columns configuration
  const parseLocalDate = (iso: string) => {
    const y = Number(iso.slice(0,4)); const m = Number(iso.slice(5,7)); const d = Number(iso.slice(8,10))
    return new Date(y, (m || 1) - 1, d || 1)
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => format(parseLocalDate(value), 'MMM dd, yyyy')
    },
    {
      key: 'accuracy_decimal',
      label: 'Accuracy of Order',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'zod_per_10k',
      label: 'ZOD per 10k',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'cc_complaints',
      label: 'CC Complaints',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'osat_decimal',
      label: 'OSAT Score',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'notes',
      label: 'Notes',
      sortable: false,
      render: (value: string) => (
        <div className="max-w-32 truncate" title={value}>
          {value || '-'}
        </div>
      )
    }
  ]

  // Chart data processing for OSAT trend
  const chartData = useMemo(() => {
    if (!smgEntries.length) return []

          return smgEntries
        .slice() // Create a copy to avoid mutating original
        .reverse() // Reverse to show oldest to newest for chart
        .map((entry) => ({
          date: chartFormatters.dateShort(entry.date),
          osat: entry.osat_decimal,
        }))
  }, [smgEntries])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-wendys-charcoal">SMG Manual Entry</h1>
          <p className="text-gray-600">
            Record your daily service metrics and customer satisfaction scores
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          Error loading data: {error.message}
        </div>
      )}

      {/* Entry Form */}
      <div className="wendys-card">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-5 w-5 text-wendys-red" />
          <h3 className="text-lg font-semibold text-wendys-charcoal">Add New Entry</h3>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Field */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      if (date) {
                        form.setValue('date', format(date, 'yyyy-MM-dd'))
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.date && (
                <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
              )}
            </div>

            {/* Accuracy of Order */}
            <div className="space-y-2">
              <Label htmlFor="accuracy_decimal">Accuracy of Order *</Label>
              <Input
                id="accuracy_decimal"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter decimal value"
                {...form.register('accuracy_decimal', { valueAsNumber: true })}
              />
              {form.formState.errors.accuracy_decimal && (
                <p className="text-sm text-red-600">{form.formState.errors.accuracy_decimal.message}</p>
              )}
            </div>

            {/* ZOD per 10k */}
            <div className="space-y-2">
              <Label htmlFor="zod_per_10k">ZOD per 10k *</Label>
              <Input
                id="zod_per_10k"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter decimal value"
                {...form.register('zod_per_10k', { valueAsNumber: true })}
              />
              {form.formState.errors.zod_per_10k && (
                <p className="text-sm text-red-600">{form.formState.errors.zod_per_10k.message}</p>
              )}
            </div>

            {/* CC Complaints */}
            <div className="space-y-2">
              <Label htmlFor="cc_complaints">CC Complaints *</Label>
              <Input
                id="cc_complaints"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter decimal value"
                {...form.register('cc_complaints', { valueAsNumber: true })}
              />
              {form.formState.errors.cc_complaints && (
                <p className="text-sm text-red-600">{form.formState.errors.cc_complaints.message}</p>
              )}
            </div>

            {/* OSAT Score */}
            <div className="space-y-2">
              <Label htmlFor="osat_decimal">OSAT Score *</Label>
              <Input
                id="osat_decimal"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter decimal value"
                {...form.register('osat_decimal', { valueAsNumber: true })}
              />
              {form.formState.errors.osat_decimal && (
                <p className="text-sm text-red-600">{form.formState.errors.osat_decimal.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-wendys-red focus:border-wendys-red"
                placeholder="Optional notes..."
                {...form.register('notes')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || !storeId}
              className="bg-wendys-red hover:bg-wendys-red/90"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </div>

      {/* OSAT Trend Chart */}
      <ChartCard
        title="OSAT Score Trend"
        subtitle={`${smgEntries.length} entries`}
        loading={isLoading}
        error={error?.message}
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid {...chartDefaults.cartesianGrid} />
              <XAxis 
                dataKey="date" 
                {...chartDefaults.xAxis}
              />
              <YAxis 
                {...chartDefaults.yAxis}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip 
                {...chartDefaults.tooltip}
                formatter={(value: any) => [value.toFixed(2), 'OSAT Score']}
              />
              <Line 
                type="monotone" 
                dataKey="osat" 
                stroke={chartColors.sales} 
                strokeWidth={3}
                dot={{ fill: chartColors.sales, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartColors.salesSecondary, strokeWidth: 2 }}
                name="OSAT Score"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <p>No chart data available</p>
              <p className="text-sm mt-1">Add some entries to see OSAT trends</p>
            </div>
          </div>
        )}
      </ChartCard>

      {/* Data Table */}
      <div className="wendys-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-wendys-charcoal">Previous Entries</h3>
          <div className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${smgEntries.length} entries`}
          </div>
        </div>

        {!storeId ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              <p className="text-lg font-medium">Store not connected</p>
              <p className="text-sm mt-2">Please go to Setup to link your account to a store first.</p>
            </div>
          </div>
        ) : (
          <SortableTable
            columns={columns}
            data={smgEntries}
            loading={isLoading}
            emptyMessage="No SMG entries found. Add your first entry above."
          />
        )}
      </div>
    </div>
  )
}