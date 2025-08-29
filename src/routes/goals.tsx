import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilterToolbar, useFilters } from '@/components/ui/filter-toolbar'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

const goalsSchema = z.object({
  sales_target: z.coerce.number().min(0),
  labor_target_pct: z.coerce.number().min(0),
  waste_target_pct: z.coerce.number().min(0),
  food_variance_target_pct: z.coerce.number().min(0),
  team_notes: z.string().optional(),
})

type GoalsFormData = z.infer<typeof goalsSchema>

type GoalsRow = {
  id: string
  store_id: string
  scope: 'week' | 'month' | 'custom'
  period_start: string
  period_end: string
  sales_target: number
  labor_target_pct: number
  waste_target_pct: number
  food_variance_target_pct: number
  service_seconds_target: number
  team_notes: string | null
  created_at: string
}

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

export function GoalsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [storeId, setStoreId] = useState<string | null>(null)

  // Filters (reuse global FilterToolbar)
  const filters = useFilters('goals', 'wtd')
  const dateRange = filters.getDateRangeFilter()
  const period_start = dateRange?.start || format(new Date(), 'yyyy-MM-dd')
  const period_end = dateRange?.end || format(new Date(), 'yyyy-MM-dd')
  const scope: GoalsRow['scope'] = filters.selectedRange === 'mtd' ? 'month' : filters.selectedRange === 'wtd' ? 'week' : 'custom'

  const form = useForm<GoalsFormData>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      sales_target: 0,
      labor_target_pct: 25,
      waste_target_pct: 0.5,
      food_variance_target_pct: 0.5,
      team_notes: '',
    },
  })

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
      if (error) return
      setStoreId(data?.store_id ?? null)
    })()
    return () => { active = false }
  }, [])

  // Load existing goals for the selected period
  const { data: savedGoals } = useQuery<GoalsRow | null>({
    queryKey: ['goals_settings', storeId, period_start, period_end],
    queryFn: async () => {
      if (!storeId) return null
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('store_id', storeId)
        .eq('period_start', period_start)
        .eq('period_end', period_end)
        .maybeSingle()
      if (error && error.code !== 'PGRST116') throw error
      return (data as GoalsRow) || null
    },
    enabled: !!storeId,
  })

  useEffect(() => {
    if (savedGoals) {
      form.reset({
        sales_target: savedGoals.sales_target,
        labor_target_pct: savedGoals.labor_target_pct,
        waste_target_pct: savedGoals.waste_target_pct,
        food_variance_target_pct: savedGoals.food_variance_target_pct,
        team_notes: savedGoals.team_notes || '',
      })
    }
  }, [savedGoals])

  // Actuals from Omega Daily in the selected range
  const { data: omegaEntries = [] } = useQuery<OmegaDailyRow[]>({
    queryKey: ['omega_daily_for_goals', storeId, period_start, period_end],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('omega_daily')
        .select('*')
        .eq('store_id', storeId)
        .gte('business_date', period_start)
        .lte('business_date', period_end)
        .order('business_date', { ascending: true })
      if (error) throw error
      return data as OmegaDailyRow[]
    },
    enabled: !!storeId,
  })

  const actuals = useMemo(() => {
    const totalSales = omegaEntries.reduce((s, r) => s + (Number(r.net_sales) || 0), 0)
    const avgLaborPct = omegaEntries.length > 0
      ? omegaEntries.reduce((s, r) => s + (Number(r.labor_percentage) || 0), 0) / omegaEntries.length
      : 0
    const totalWaste = omegaEntries.reduce((s, r) => s + (Number(r.waste_amount) || 0), 0)
    const totalVariance = omegaEntries.reduce((s, r) => s + (Number(r.food_variance_cost) || 0), 0)
    const wastePct = totalSales > 0 ? (totalWaste / totalSales) * 100 : 0
    const foodVarPct = totalSales > 0 ? (totalVariance / totalSales) * 100 : 0
    return {
      totalSales,
      avgLaborPct,
      wastePct,
      foodVarPct,
    }
  }, [omegaEntries])

  const saveMutation = useMutation({
    mutationFn: async (payload: GoalsFormData) => {
      if (!storeId) throw new Error('No store is linked to your account. See Setup to link one.')
      const upsert = {
        store_id: storeId,
        scope,
        period_start,
        period_end,
        sales_target: payload.sales_target,
        labor_target_pct: payload.labor_target_pct,
        waste_target_pct: payload.waste_target_pct,
        food_variance_target_pct: payload.food_variance_target_pct,
        team_notes: payload.team_notes || null,
      }
      const { error } = await supabase
        .from('goals')
        .upsert(upsert, { onConflict: 'store_id,period_start,period_end' })
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Goals saved for selected period.' })
      queryClient.invalidateQueries({ queryKey: ['goals_settings', storeId, period_start, period_end] })
    },
    onError: (error: any) => {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    }
  })

  const handleReset = () => {
    form.reset({
      sales_target: 0,
      labor_target_pct: 25,
      waste_target_pct: 0.5,
      food_variance_target_pct: 0.5,
      team_notes: '',
    })
  }

  const statusChip = (ok: boolean, label: string) => (
    <span className={`px-2 py-1 rounded-full text-xs ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {label}
    </span>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wendys-charcoal">Goal Setting</h1>
          <p className="text-gray-600">Set targets and track progress against Omega Daily actuals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>Reset Goals</Button>
          <Button className="wendys-button" onClick={form.handleSubmit(values => saveMutation.mutate(values))} disabled={!storeId || saveMutation.isPending}>Save Goals</Button>
        </div>
      </div>

      {/* Filter toolbar for date/week selection */}
      <FilterToolbar
        selectedRange={filters.selectedRange}
        selectedDate={filters.selectedDate}
        onRangeChange={filters.handleRangeChange}
        onDateChange={filters.handleDateChange}
        onClearFilters={filters.clearFilters}
      />

      {/* 5 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Sales */}
        <div className="wendys-card">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-3">Sales</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Target</p>
                <Input type="number" step="0.01" {...form.register('sales_target')} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Actual</p>
                <p className="text-xl font-semibold">${actuals.totalSales.toLocaleString()}</p>
              </div>
            </div>
            <div>
              {statusChip(actuals.totalSales >= (form.watch('sales_target') || 0), actuals.totalSales >= (form.watch('sales_target') || 0) ? 'On Track' : 'Behind')}
            </div>
          </div>
        </div>

        {/* Labor */}
        <div className="wendys-card">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-3">Labor</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Target %</p>
                <Input type="number" step="0.1" {...form.register('labor_target_pct')} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Actual %</p>
                <p className="text-xl font-semibold">{actuals.avgLaborPct.toFixed(1)}%</p>
              </div>
            </div>
            <div>
              {statusChip(actuals.avgLaborPct <= (form.watch('labor_target_pct') || 0), actuals.avgLaborPct <= (form.watch('labor_target_pct') || 0) ? 'On Track' : 'High')}
            </div>
          </div>
        </div>

        {/* Waste & Food */}
        <div className="wendys-card">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-3">Waste & Food</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Waste Target %</p>
                <Input type="number" step="0.1" {...form.register('waste_target_pct')} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Waste Actual %</p>
                <p className="text-xl font-semibold">{actuals.wastePct.toFixed(2)}%</p>
              </div>
            </div>
            <div>
              {statusChip(actuals.wastePct <= (form.watch('waste_target_pct') || 0), actuals.wastePct <= (form.watch('waste_target_pct') || 0) ? 'On Track' : 'High')}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <p className="text-sm text-gray-600">Food Var Target %</p>
                <Input type="number" step="0.1" {...form.register('food_variance_target_pct')} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Food Var Actual %</p>
                <p className="text-xl font-semibold">{actuals.foodVarPct.toFixed(2)}%</p>
              </div>
            </div>
            <div>
              {statusChip(actuals.foodVarPct <= (form.watch('food_variance_target_pct') || 0), actuals.foodVarPct <= (form.watch('food_variance_target_pct') || 0) ? 'On Track' : 'High')}
            </div>
          </div>
        </div>

        {/* Service & Times - temporarily removed; will live in its own tab */}

        {/* Team & Personal */}
        <div className="wendys-card md:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-3">Team & Personal</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="team_notes">Notes</Label>
              <Input id="team_notes" {...form.register('team_notes')} placeholder="Notes, personal goals, shout-outs..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/goals')({
  component: GoalsPage,
})
