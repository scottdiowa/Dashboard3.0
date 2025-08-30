import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Plus, Edit, Trash2, Download, ChevronDown, ChevronUp, FileText, Users, Calculator, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils'
import { weekendingSheetSchema, type WeekendingSheetFormData } from '@/lib/schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/weekending-sheet')({
  component: WeekendingSheetPage,
})

type WeekendingSheetRow = {
  id: string
  store_id: string
  week_ending_date: string
  manager_name: string
  breakfast_sales: number
  late_night_sales: number
  net_sales: number
  discounts: number
  cash: number
  food_total: number
  food_cost: number
  variance_dollars: number
  food_variance_percentage: number
  labor: number
  credit_hours: number
  reason?: string
  onboarding: boolean
  crew_food_safety_quiz: number
  mgr_food_safety_quiz: number
  new_hire_name?: string
  terminations?: string
  term_date?: string
  created_at: string
}

function WeekendingSheetPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [welearnExpanded, setWelearnExpanded] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [storeId, setStoreId] = useState<string | null>(null)

  // Get current week ending date (Saturday)
  const getCurrentWeekEnding = () => {
    const today = new Date()
    const saturday = startOfWeek(today, { weekStartsOn: 6 }) // Start week on Saturday
    return format(endOfWeek(saturday, { weekStartsOn: 6 }), 'yyyy-MM-dd')
  }

  const form = useForm<WeekendingSheetFormData>({
    resolver: zodResolver(weekendingSheetSchema),
    defaultValues: {
      week_ending_date: getCurrentWeekEnding(),
      manager_name: 'Scott',
      breakfast_sales: 0,
      late_night_sales: 0,
      net_sales: 0,
      discounts: 0,
      cash: 0,
      food_total: 0,
      food_cost: 0,
      variance_dollars: 0,
      food_variance_percentage: 0,
      labor: 0,
      credit_hours: 0,
      reason: '',
      onboarding: false,
      crew_food_safety_quiz: 0,
      mgr_food_safety_quiz: 0,
      new_hire_name: '',
      terminations: '',
      term_date: '',
    },
  })

  const insertMutation = useMutation({
    mutationFn: async (payload: WeekendingSheetFormData) => {
      if (!storeId) {
        throw new Error('No store is linked to your account. See Setup to link one.')
      }
      
      const insertData = {
        store_id: storeId,
        ...payload,
      }
      
      const { data, error } = await supabase.from('weekending_sheet').insert(insertData).select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Weekending sheet saved successfully.' })
      setIsFormOpen(false)
      setEditingEntry(null)
      form.reset({
        week_ending_date: getCurrentWeekEnding(),
        manager_name: 'Scott',
        breakfast_sales: 0,
        late_night_sales: 0,
        net_sales: 0,
        discounts: 0,
        cash: 0,
        food_total: 0,
        food_cost: 0,
        variance_dollars: 0,
        food_variance_percentage: 0,
        labor: 0,
        credit_hours: 0,
        reason: '',
        onboarding: false,
        crew_food_safety_quiz: 0,
        mgr_food_safety_quiz: 0,
        new_hire_name: '',
        terminations: '',
        term_date: '',
      })
      queryClient.invalidateQueries({ queryKey: ['weekending_sheet', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Save failed', description: error?.message || 'Unable to save entry.', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: WeekendingSheetFormData }) => {
      if (!storeId) {
        throw new Error('No store is linked to your account. See Setup to link one.')
      }
      const { error } = await supabase.from('weekending_sheet').update({
        ...payload,
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Updated!', description: 'Weekending sheet updated successfully.' })
      setIsFormOpen(false)
      setEditingEntry(null)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['weekending_sheet', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekending_sheet').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Weekending sheet entry removed.' })
      queryClient.invalidateQueries({ queryKey: ['weekending_sheet', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    }
  })

  const onSubmit = (data: WeekendingSheetFormData) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, payload: data })
    } else {
      insertMutation.mutate(data)
    }
  }

  const onInvalidSubmit = (errors: any) => {
    console.error('Form validation failed:', errors)
    toast({
      title: 'Validation Error',
      description: 'Please check the form for errors and try again.',
      variant: 'destructive'
    })
  }

  // Resolve store_id for current user
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id
      if (!userId) return

      const { data } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userId)
        .maybeSingle()

      if (!active) return
      setStoreId(data?.store_id ?? null)
    })()
    return () => { active = false }
  }, [])

  // Load weekending sheet entries
  const { data: weekendingEntries = [], isLoading, error } = useQuery<WeekendingSheetRow[]>({
    queryKey: ['weekending_sheet', storeId],
    queryFn: async () => {
      if (!storeId) return []
      
      const { data, error } = await supabase
        .from('weekending_sheet')
        .select('*')
        .eq('store_id', storeId)
        .order('week_ending_date', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as WeekendingSheetRow[]
    },
    enabled: !!storeId,
  })

  const handleEdit = (entry: any) => {
    setEditingEntry(entry)
    form.reset({
      week_ending_date: entry.week_ending_date,
      manager_name: entry.manager_name,
      breakfast_sales: entry.breakfast_sales || 0,
      late_night_sales: entry.late_night_sales || 0,
      net_sales: entry.net_sales || 0,
      discounts: entry.discounts || 0,
      cash: entry.cash || 0,
      food_total: entry.food_total || 0,
      food_cost: entry.food_cost || 0,
      variance_dollars: entry.variance_dollars || 0,
      food_variance_percentage: entry.food_variance_percentage || 0,
      labor: entry.labor || 0,
      credit_hours: entry.credit_hours || 0,
      reason: entry.reason || '',
      onboarding: entry.onboarding || false,
      crew_food_safety_quiz: entry.crew_food_safety_quiz || 0,
      mgr_food_safety_quiz: entry.mgr_food_safety_quiz || 0,
      new_hire_name: entry.new_hire_name || '',
      terminations: entry.terminations || '',
      term_date: entry.term_date || '',
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteMutation.mutate(id)
    }
  }

  const exportToCSV = () => {
    if (weekendingEntries.length === 0) {
      toast({ title: 'No data', description: 'No entries to export.', variant: 'destructive' })
      return
    }

    const headers = [
      'Week Ending Date',
      'Manager',
      'Breakfast Sales',
      'Late Night Sales',
      'Net Sales',
      'Discounts',
      'Cash',
      'Food Total',
      'Food Cost',
      'Variance Dollars',
      'Food Variance %',
      'Labor',
      'Credit Hours',
      'Reason',
      'Onboarding',
      'Crew Food Safety Quiz',
      'MGR Food Safety Quiz',
      'New Hire Name',
      'Terminations',
      'Term Date'
    ]

    const csvContent = [
      headers.join(','),
      ...weekendingEntries.map(entry => [
        entry.week_ending_date,
        entry.manager_name,
        entry.breakfast_sales,
        entry.late_night_sales,
        entry.net_sales,
        entry.discounts,
        entry.cash,
        entry.food_total,
        entry.food_cost,
        entry.variance_dollars,
        entry.food_variance_percentage,
        entry.labor,
        entry.credit_hours,
        entry.reason || '',
        entry.onboarding ? 'Yes' : 'No',
        entry.crew_food_safety_quiz,
        entry.mgr_food_safety_quiz,
        entry.new_hire_name || '',
        entry.terminations || '',
        entry.term_date || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weekending-sheet-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({ title: 'Exported!', description: 'CSV file downloaded successfully.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-wendys-charcoal">Weekending Sheet</h1>
          <p className="text-sm md:text-base text-gray-600">
            Weekly operational data and metrics tracking
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
          <Button 
            onClick={() => {
              setEditingEntry(null)
              form.reset({
                week_ending_date: getCurrentWeekEnding(),
                manager_name: 'Scott',
                breakfast_sales: 0,
                late_night_sales: 0,
                net_sales: 0,
                discounts: 0,
                cash: 0,
                food_total: 0,
                food_cost: 0,
                variance_dollars: 0,
                food_variance_percentage: 0,
                labor: 0,
                credit_hours: 0,
                reason: '',
                onboarding: false,
                crew_food_safety_quiz: 0,
                mgr_food_safety_quiz: 0,
                new_hire_name: '',
                terminations: '',
                term_date: '',
              })
              setIsFormOpen(true)
            }} 
            className="wendys-button w-full md:w-auto" 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Weekending Entry
          </Button>
          {weekendingEntries.length > 0 && (
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="w-full md:w-auto border-wendys-red text-wendys-red hover:bg-wendys-red hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="wendys-card">
        <div className="grid-auto">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-600">Total Entries</p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-wendys-charcoal">
              {weekendingEntries.length}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-600">Latest Week</p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-wendys-charcoal">
              {weekendingEntries.length > 0 ? formatDate(weekendingEntries[0].week_ending_date) : 'N/A'}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-600">Avg Net Sales</p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-wendys-charcoal">
              {weekendingEntries.length > 0 
                ? formatCurrency(weekendingEntries.reduce((sum, e) => sum + (e.net_sales || 0), 0) / weekendingEntries.length)
                : '$0'
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          Error loading data: {error.message}
        </div>
      )}

      {/* Data Table */}
      <div className="wendys-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-wendys-charcoal">Weekending Entries</h3>
          <div className="text-xs md:text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${weekendingEntries.length} entries`}
          </div>
        </div>

        {weekendingEntries?.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              {storeId ? (
                <div>
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm mt-2">
                    You haven't added any weekending entries yet.
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
              <Button onClick={() => setIsFormOpen(true)} className="wendys-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Entry
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week Ending</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Sales</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food Variance</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Labor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weekendingEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.week_ending_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {entry.manager_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.net_sales)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(entry.food_variance_percentage)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.labor)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-wendys-charcoal">
                {editingEntry ? 'Edit Weekending Entry' : 'Add Weekending Entry'}
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

            <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
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
              
              {/* Basic Information Section */}
              <div className="form-section">
                <h3 className="form-section-title">
                  <FileText className="mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Week Ending Date */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>Week Ending Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {form.watch('week_ending_date') ? formatDate(form.watch('week_ending_date')) : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={(() => {
                            const wed = form.watch('week_ending_date')
                            if (!wed) return undefined
                            const y = Number(wed.slice(0, 4))
                            const m = Number(wed.slice(5, 7))
                            const d = Number(wed.slice(8, 10))
                            return new Date(y, (m || 1) - 1, d || 1)
                          })()}
                          onSelect={(date) => {
                            const iso = date ? format(date, 'yyyy-MM-dd') : ''
                            form.setValue('week_ending_date', iso)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.week_ending_date && (
                      <p className="text-sm text-red-600">{form.formState.errors.week_ending_date.message}</p>
                    )}
                  </div>

                  {/* Manager Name */}
                  <div className="space-y-2">
                    <Label htmlFor="manager_name">Manager Name</Label>
                    <select
                      id="manager_name"
                      {...form.register('manager_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                    >
                      <option value="Scott">Scott</option>
                      <option value="Sophear">Sophear</option>
                      <option value="Letoya">Letoya</option>
                      <option value="Carissa">Carissa</option>
                    </select>
                    {form.formState.errors.manager_name && (
                      <p className="text-sm text-red-600">{form.formState.errors.manager_name.message}</p>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      placeholder="Optional notes or reason"
                      {...form.register('reason')}
                    />
                    {form.formState.errors.reason && (
                      <p className="text-sm text-red-600">{form.formState.errors.reason.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales & Financial Section */}
              <div className="form-section">
                <h3 className="form-section-title">
                  <Calculator className="mr-2" />
                  Sales & Financial Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Breakfast Sales */}
                  <div className="space-y-2">
                    <Label htmlFor="breakfast_sales">Breakfast Sales (DP1) ($)</Label>
                    <Input
                      id="breakfast_sales"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('breakfast_sales')}
                    />
                    {form.formState.errors.breakfast_sales && (
                      <p className="text-sm text-red-600">{form.formState.errors.breakfast_sales.message}</p>
                    )}
                  </div>

                  {/* Late Night Sales */}
                  <div className="space-y-2">
                    <Label htmlFor="late_night_sales">Late Night Sales (DP6) ($)</Label>
                    <Input
                      id="late_night_sales"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('late_night_sales')}
                    />
                    {form.formState.errors.late_night_sales && (
                      <p className="text-sm text-red-600">{form.formState.errors.late_night_sales.message}</p>
                    )}
                  </div>

                  {/* Net Sales */}
                  <div className="space-y-2">
                    <Label htmlFor="net_sales">Net Sales ($)</Label>
                    <Input
                      id="net_sales"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('net_sales')}
                    />
                    {form.formState.errors.net_sales && (
                      <p className="text-sm text-red-600">{form.formState.errors.net_sales.message}</p>
                    )}
                  </div>

                  {/* Discounts */}
                  <div className="space-y-2">
                    <Label htmlFor="discounts">Discounts ($)</Label>
                    <Input
                      id="discounts"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('discounts')}
                    />
                    {form.formState.errors.discounts && (
                      <p className="text-sm text-red-600">{form.formState.errors.discounts.message}</p>
                    )}
                  </div>

                  {/* Cash */}
                  <div className="space-y-2">
                    <Label htmlFor="cash">Cash ($)</Label>
                    <Input
                      id="cash"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('cash')}
                    />
                    {form.formState.errors.cash && (
                      <p className="text-sm text-red-600">{form.formState.errors.cash.message}</p>
                    )}
                  </div>

                  {/* Food Total */}
                  <div className="space-y-2">
                    <Label htmlFor="food_total">Food Total ($)</Label>
                    <Input
                      id="food_total"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('food_total')}
                    />
                    {form.formState.errors.food_total && (
                      <p className="text-sm text-red-600">{form.formState.errors.food_total.message}</p>
                    )}
                  </div>

                  {/* Food Cost */}
                  <div className="space-y-2">
                    <Label htmlFor="food_cost">Food Cost ($)</Label>
                    <Input
                      id="food_cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('food_cost')}
                    />
                    {form.formState.errors.food_cost && (
                      <p className="text-sm text-red-600">{form.formState.errors.food_cost.message}</p>
                    )}
                  </div>

                  {/* Variance Dollars */}
                  <div className="space-y-2">
                    <Label htmlFor="variance_dollars">Variance Dollars ($)</Label>
                    <Input
                      id="variance_dollars"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('variance_dollars')}
                    />
                    {form.formState.errors.variance_dollars && (
                      <p className="text-sm text-red-600">{form.formState.errors.variance_dollars.message}</p>
                    )}
                  </div>

                  {/* Food Variance Percentage */}
                  <div className="space-y-2">
                    <Label htmlFor="food_variance_percentage">Food Variance %</Label>
                    <Input
                      id="food_variance_percentage"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...form.register('food_variance_percentage')}
                    />
                    {form.formState.errors.food_variance_percentage && (
                      <p className="text-sm text-red-600">{form.formState.errors.food_variance_percentage.message}</p>
                    )}
                  </div>

                  {/* Labor */}
                  <div className="space-y-2">
                    <Label htmlFor="labor">Labor ($)</Label>
                    <Input
                      id="labor"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('labor')}
                    />
                    {form.formState.errors.labor && (
                      <p className="text-sm text-red-600">{form.formState.errors.labor.message}</p>
                    )}
                  </div>

                  {/* Credit Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="credit_hours">Credit Hours</Label>
                    <Input
                      id="credit_hours"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...form.register('credit_hours')}
                    />
                    {form.formState.errors.credit_hours && (
                      <p className="text-sm text-red-600">{form.formState.errors.credit_hours.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* WeLearn Section */}
              <div className="form-section">
                <button
                  type="button"
                  onClick={() => setWelearnExpanded(!welearnExpanded)}
                  className="form-section-title w-full text-left flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Users className="mr-2" />
                    WeLearn & Training
                  </div>
                  {welearnExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {welearnExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Onboarding */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="onboarding"
                          type="checkbox"
                          {...form.register('onboarding')}
                          className="h-4 w-4 text-wendys-red focus:ring-wendys-red border-gray-300 rounded"
                        />
                        <Label htmlFor="onboarding">Onboarding Completed</Label>
                      </div>
                    </div>

                    {/* Crew Food Safety Quiz */}
                    <div className="space-y-2">
                      <Label htmlFor="crew_food_safety_quiz">Crew Food Safety Quiz Score</Label>
                      <Input
                        id="crew_food_safety_quiz"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        {...form.register('crew_food_safety_quiz')}
                      />
                      {form.formState.errors.crew_food_safety_quiz && (
                        <p className="text-sm text-red-600">{form.formState.errors.crew_food_safety_quiz.message}</p>
                      )}
                    </div>

                    {/* MGR Food Safety Quiz */}
                    <div className="space-y-2">
                      <Label htmlFor="mgr_food_safety_quiz">MGR Food Safety Quiz Score</Label>
                      <Input
                        id="mgr_food_safety_quiz"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        {...form.register('mgr_food_safety_quiz')}
                      />
                      {form.formState.errors.mgr_food_safety_quiz && (
                        <p className="text-sm text-red-600">{form.formState.errors.mgr_food_safety_quiz.message}</p>
                      )}
                    </div>

                    {/* New Hire Name */}
                    <div className="space-y-2">
                      <Label htmlFor="new_hire_name">New Hire Name</Label>
                      <Input
                        id="new_hire_name"
                        placeholder="Optional"
                        {...form.register('new_hire_name')}
                      />
                      {form.formState.errors.new_hire_name && (
                        <p className="text-sm text-red-600">{form.formState.errors.new_hire_name.message}</p>
                      )}
                    </div>

                    {/* Terminations */}
                    <div className="space-y-2">
                      <Label htmlFor="terminations">Terminations</Label>
                      <Input
                        id="terminations"
                        placeholder="Optional"
                        {...form.register('terminations')}
                      />
                      {form.formState.errors.terminations && (
                        <p className="text-sm text-red-600">{form.formState.errors.terminations.message}</p>
                      )}
                    </div>

                    {/* Term Date */}
                    <div className="space-y-2">
                      <Label htmlFor="term_date">Termination Date</Label>
                      <Input
                        id="term_date"
                        type="date"
                        {...form.register('term_date')}
                      />
                      {form.formState.errors.term_date && (
                        <p className="text-sm text-red-600">{form.formState.errors.term_date.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!storeId && (
                <div className="text-sm text-red-600">
                  Your account isn't linked to a store yet. Open Setup and link your user to a store, then try again.
                </div>
              )}
              
              <div className="flex flex-col-reverse space-y-2 space-y-reverse md:flex-row md:space-y-0 md:space-x-3 pt-4">
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
                <Button 
                  type="submit" 
                  className="wendys-button w-full md:w-auto" 
                  disabled={insertMutation.isPending || updateMutation.isPending || !storeId}
                >
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
