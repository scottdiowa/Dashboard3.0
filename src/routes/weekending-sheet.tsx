import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Plus, Edit, Trash2, Download, FileText, Users, Calculator, Calendar } from 'lucide-react'

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
  food_cost: number
  variance_dollars: number
  food_variance_percentage: number
  labor: number
  credit_hours: number
  reason?: string
  new_hire_name?: string
  terminations?: string
  term_date?: string
  created_at: string
}

function WeekendingSheetPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WeekendingSheetRow | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [storeId, setStoreId] = useState<string | null>(null)

  // Get current week ending date (Saturday)
  const getCurrentWeekEnding = () => {
    const today = new Date()
    const saturday = startOfWeek(today, { weekStartsOn: 6 }) // Start week on Saturday
    return format(endOfWeek(saturday, { weekStartsOn: 6 }), 'yyyy-MM-dd')
  }

  // Get default form values
  const getDefaultFormValues = (): WeekendingSheetFormData => ({
    week_ending_date: getCurrentWeekEnding(),
    manager_name: 'Scott',
    breakfast_sales: 0,
    late_night_sales: 0,
    net_sales: 0,
    discounts: 0,
    cash: 0,
    food_cost: 0,
    variance_dollars: 0,
    food_variance_percentage: 0,
    labor: 0,
    credit_hours: 0,
    reason: '',
    new_hire_name: '',
    terminations: '',
    term_date: '',
  })

  // Helper function to ensure manager name is valid
  const getValidManagerName = (name: string): 'Scott' | 'Sophear' | 'Letoya' | 'Carissa' => {
    if (name === 'Scott' || name === 'Sophear' || name === 'Letoya' || name === 'Carissa') {
      return name
    }
    return 'Scott'
  }

  const form = useForm<WeekendingSheetFormData>({
    resolver: zodResolver(weekendingSheetSchema),
    defaultValues: getDefaultFormValues(),
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
      
      // Add detailed logging
      console.log('Attempting to insert data:', insertData)
      console.log('Store ID:', storeId)
      console.log('Payload:', payload)
      
      const { data, error } = await supabase.from('weekending_sheet').insert(insertData).select()
      
      if (error) {
        console.error('Supabase insert error:', error)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        console.error('Error message:', error.message)
        throw error
      }
      return data
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Weekending sheet saved successfully.' })
      setIsFormOpen(false)
      setEditingEntry(null)
      form.reset(getDefaultFormValues())
      // Invalidate all weekending-related queries
      console.log('🔄 Invalidating queries after weekending save...')
      queryClient.invalidateQueries({ queryKey: ['weekending_sheet', storeId] })
      queryClient.invalidateQueries({ predicate: (query) => {
        const shouldInvalidate = query.queryKey[0] === 'overview-weekending' || 
          query.queryKey[0] === 'overview-weekending-charts'
        if (shouldInvalidate) {
          console.log('🗑️ Invalidating query:', query.queryKey)
        }
        return shouldInvalidate
      }})
      console.log('✅ Query invalidation complete')
    },
    onError: (error: Error) => {
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
      // Invalidate all weekending-related queries
      console.log('🔄 Invalidating queries after weekending save...')
      queryClient.invalidateQueries({ queryKey: ['weekending_sheet', storeId] })
      queryClient.invalidateQueries({ predicate: (query) => {
        const shouldInvalidate = query.queryKey[0] === 'overview-weekending' || 
          query.queryKey[0] === 'overview-weekending-charts'
        if (shouldInvalidate) {
          console.log('🗑️ Invalidating query:', query.queryKey)
        }
        return shouldInvalidate
      }})
      console.log('✅ Query invalidation complete')
    },
    onError: (error: Error) => {
      toast({ title: 'Update failed', description: error?.message || 'Unable to update entry.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekending_sheet').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Weekending sheet entry removed.' })
      // Invalidate all weekending-related queries
      console.log('🔄 Invalidating queries after weekending save...')
      queryClient.invalidateQueries({ queryKey: ['weekending_sheet', storeId] })
      queryClient.invalidateQueries({ predicate: (query) => {
        const shouldInvalidate = query.queryKey[0] === 'overview-weekending' || 
          query.queryKey[0] === 'overview-weekending-charts'
        if (shouldInvalidate) {
          console.log('🗑️ Invalidating query:', query.queryKey)
        }
        return shouldInvalidate
      }})
      console.log('✅ Query invalidation complete')
    },
    onError: (error: Error) => {
      toast({ title: 'Delete failed', description: error?.message || 'Unable to delete entry.', variant: 'destructive' })
    }
  })

  const onSubmit = (data: WeekendingSheetFormData) => {
    // Preprocess data to ensure numeric fields are properly handled
    const processedData = {
      ...data,
      breakfast_sales: Number(data.breakfast_sales) || 0,
      late_night_sales: Number(data.late_night_sales) || 0,
      net_sales: Number(data.net_sales) || 0,
      discounts: Number(data.discounts) || 0,
      cash: Number(data.cash) || 0,
      food_cost: Number(data.food_cost) || 0,
      variance_dollars: Number(data.variance_dollars) || 0,
      food_variance_percentage: Number(data.food_variance_percentage) || 0,
      labor: Number(data.labor) || 0,
      credit_hours: Number(data.credit_hours) || 0,
      // Convert empty date strings to null for database compatibility
      term_date: data.term_date && data.term_date.trim() !== '' ? data.term_date : null,
    } as WeekendingSheetFormData & { term_date: string | null }

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, payload: processedData })
    } else {
      insertMutation.mutate(processedData)
    }
  }

  const onInvalidSubmit = (errors: Record<string, any>) => {
    console.error('Form validation failed:', errors)
    
    // Log specific field errors for debugging
    if (errors.discounts) console.error('Discounts error:', errors.discounts)
    if (errors.cash) console.error('Cash error:', errors.cash)
    if (errors.food_cost) console.error('Food cost error:', errors.food_cost)
    
    toast({
      title: 'Validation Error',
      description: 'Please check the form for errors and try again.',
      variant: 'destructive'
    })
  }

  // Resolve store_id for current user
  useEffect(() => {
    let isMounted = true
    
    const resolveStoreId = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser()
        const userId = auth.user?.id
        if (!userId || !isMounted) return

        console.log('Resolving store_id for user:', userId)

        const { data } = await supabase
          .from('users')
          .select('store_id')
          .eq('id', userId)
          .maybeSingle()

        console.log('User data from database:', data)
        console.log('Store ID resolved:', data?.store_id)

        if (isMounted) {
          setStoreId(data?.store_id ?? null)
        }
      } catch (error) {
        console.error('Error resolving store ID:', error)
        if (isMounted) {
          setStoreId(null)
        }
      }
    }

    resolveStoreId()
    
    return () => { 
      isMounted = false 
    }
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

  const handleEdit = (entry: WeekendingSheetRow) => {
    setEditingEntry(entry)
    form.reset({
      week_ending_date: entry.week_ending_date,
      manager_name: getValidManagerName(entry.manager_name),
      breakfast_sales: entry.breakfast_sales || 0,
      late_night_sales: entry.late_night_sales || 0,
      net_sales: entry.net_sales || 0,
      discounts: entry.discounts || 0,
      cash: entry.cash || 0,
      food_cost: entry.food_cost || 0,
      variance_dollars: entry.variance_dollars || 0,
      food_variance_percentage: entry.food_variance_percentage || 0,
      labor: entry.labor || 0,
      credit_hours: entry.credit_hours || 0,
      reason: entry.reason || '',
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
      'Food Cost',
      'Variance Dollars',
      'Food Variance %',
      'Labor',
      'Credit Hours',
      'Reason',
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
        entry.food_cost,
        entry.variance_dollars,
        entry.food_variance_percentage,
        entry.labor,
        entry.credit_hours,
        entry.reason || '',
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
              form.reset(getDefaultFormValues())
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
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Week Ending</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Manager</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Food Variance</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Labor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weekendingEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(entry.week_ending_date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {entry.manager_name}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(entry.net_sales)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.food_variance_percentage > 0 
                            ? 'bg-red-100 text-red-800' 
                            : entry.food_variance_percentage < 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatPercentage(entry.food_variance_percentage)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(entry.labor)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
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

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {weekendingEntries.map((entry) => (
                <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{formatDate(entry.week_ending_date)}</h3>
                      <p className="text-xs text-gray-500">Week Ending</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Manager</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.manager_name}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Net Sales</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(entry.net_sales)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Food Variance</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.food_variance_percentage > 0 
                          ? 'bg-red-100 text-red-800' 
                          : entry.food_variance_percentage < 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formatPercentage(entry.food_variance_percentage)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Labor</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(entry.labor)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-wendys-red/10 rounded-lg">
                  <FileText className="h-5 w-5 text-wendys-red" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-wendys-charcoal">
                  {editingEntry ? 'Edit Weekending Entry' : 'Add Weekending Entry'}
                </h2>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingEntry(null)
                  form.reset()
                }}
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
              >
                <span className="text-xl">×</span>
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
              {/* Form-level errors */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                      <ul className="text-sm text-red-700 mt-2 space-y-1">
                        {Object.entries(form.formState.errors).map(([field, error]) => (
                          <li key={field} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                            {error?.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Week Ending Date */}
                  <div className="lg:col-span-2 space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Week Ending Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-12 border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-wendys-red/20"
                        >
                          <Calendar className="mr-3 h-5 w-5 text-gray-500" />
                          <span className={form.watch('week_ending_date') ? 'text-gray-900' : 'text-gray-500'}>
                            {form.watch('week_ending_date') ? formatDate(form.watch('week_ending_date')) : 'Select week ending date'}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 shadow-lg">
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
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.week_ending_date.message}
                      </div>
                    )}
                  </div>


                  {/* Reason */}
                  <div className="lg:col-span-2 space-y-3">
                    <Label htmlFor="reason" className="text-sm font-medium text-gray-700">Reason (Optional)</Label>
                    <Input
                      id="reason"
                      placeholder="Add any notes or reason for this entry..."
                      className="h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                      {...form.register('reason')}
                    />
                    {form.formState.errors.reason && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.reason.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales & Financial Section */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Calculator className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Sales & Financial Data</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Breakfast Sales */}
                  <div className="space-y-3">
                    <Label htmlFor="breakfast_sales" className="text-sm font-medium text-gray-700">Breakfast Sales (DP1) *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="breakfast_sales"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('breakfast_sales')}
                      />
                    </div>
                    {form.formState.errors.breakfast_sales && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.breakfast_sales.message}
                      </div>
                    )}
                  </div>

                  {/* Late Night Sales */}
                  <div className="space-y-3">
                    <Label htmlFor="late_night_sales" className="text-sm font-medium text-gray-700">Late Night Sales (DP6) *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="late_night_sales"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('late_night_sales')}
                      />
                    </div>
                    {form.formState.errors.late_night_sales && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.late_night_sales.message}
                      </div>
                    )}
                  </div>

                  {/* Net Sales */}
                  <div className="space-y-3">
                    <Label htmlFor="net_sales" className="text-sm font-medium text-gray-700">Net Sales *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="net_sales"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('net_sales')}
                      />
                    </div>
                    {form.formState.errors.net_sales && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.net_sales.message}
                      </div>
                    )}
                  </div>

                  {/* Discounts */}
                  <div className="space-y-3">
                    <Label htmlFor="discounts" className="text-sm font-medium text-gray-700">Discounts (Can be negative)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="discounts"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('discounts')}
                      />
                    </div>
                    {form.formState.errors.discounts && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.discounts.message}
                      </div>
                    )}
                  </div>

                  {/* Cash */}
                  <div className="space-y-3">
                    <Label htmlFor="cash" className="text-sm font-medium text-gray-700">Cash (Can be negative)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="cash"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('cash')}
                      />
                    </div>
                    {form.formState.errors.cash && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.cash.message}
                      </div>
                    )}
                  </div>


                  {/* Food Cost */}
                  <div className="space-y-3">
                    <Label htmlFor="food_cost" className="text-sm font-medium text-gray-700">Food Cost (Can be negative)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="food_cost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('food_cost')}
                      />
                    </div>
                    {form.formState.errors.food_cost && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.food_cost.message}
                      </div>
                    )}
                  </div>

                  {/* Variance Dollars */}
                  <div className="space-y-3">
                    <Label htmlFor="variance_dollars" className="text-sm font-medium text-gray-700">Variance Dollars (Can be negative)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="variance_dollars"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('variance_dollars')}
                      />
                    </div>
                    {form.formState.errors.variance_dollars && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.variance_dollars.message}
                      </div>
                    )}
                  </div>

                  {/* Food Variance Percentage */}
                  <div className="space-y-3">
                    <Label htmlFor="food_variance_percentage" className="text-sm font-medium text-gray-700">Food Variance % (Can be negative)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                      <Input
                        id="food_variance_percentage"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        className="pr-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('food_variance_percentage')}
                      />
                    </div>
                    {form.formState.errors.food_variance_percentage && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.food_variance_percentage.message}
                      </div>
                    )}
                  </div>

                  {/* Labor */}
                  <div className="space-y-3">
                    <Label htmlFor="labor" className="text-sm font-medium text-gray-700">Labor *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="labor"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('labor')}
                      />
                    </div>
                    {form.formState.errors.labor && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.labor.message}
                      </div>
                    )}
                  </div>

                  {/* Credit Hours */}
                  <div className="space-y-3">
                    <Label htmlFor="credit_hours" className="text-sm font-medium text-gray-700">Credit Hours *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">hrs</span>
                      </div>
                      <Input
                        id="credit_hours"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        className="pr-12 h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                        {...form.register('credit_hours')}
                      />
                    </div>
                    {form.formState.errors.credit_hours && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.credit_hours.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personnel Section */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Personnel</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* New Hire Name */}
                  <div className="space-y-3">
                    <Label htmlFor="new_hire_name" className="text-sm font-medium text-gray-700">New Hire Name (Optional)</Label>
                    <Input
                      id="new_hire_name"
                      placeholder="Enter new hire's name..."
                      className="h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                      {...form.register('new_hire_name')}
                    />
                    {form.formState.errors.new_hire_name && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.new_hire_name.message}
                      </div>
                    )}
                  </div>

                  {/* Terminations */}
                  <div className="space-y-3">
                    <Label htmlFor="terminations" className="text-sm font-medium text-gray-700">Terminations (Optional)</Label>
                    <Input
                      id="terminations"
                      placeholder="Enter termination details..."
                      className="h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                      {...form.register('terminations')}
                    />
                    {form.formState.errors.terminations && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.terminations.message}
                      </div>
                    )}
                  </div>

                  {/* Term Date */}
                  <div className="lg:col-span-2 space-y-3">
                    <Label htmlFor="term_date" className="text-sm font-medium text-gray-700">Termination Date (Optional)</Label>
                    <Input
                      id="term_date"
                      type="date"
                      className="h-12 border-gray-300 focus:ring-2 focus:ring-wendys-red/20 focus:border-wendys-red"
                      {...form.register('term_date')}
                    />
                    {form.formState.errors.term_date && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {form.formState.errors.term_date.message}
                      </div>
                    )}
                  </div>
                </div>
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
