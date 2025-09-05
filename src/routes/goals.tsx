import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState, useCallback } from 'react'
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
import { format, subWeeks, subMonths, startOfWeek } from 'date-fns'
import { GoalCard, GoalStatus } from '@/components/goals/GoalCard'
import { GoalProgressChart } from '@/components/goals/GoalProgressChart'
import { GoalInsights, GoalInsight } from '@/components/goals/GoalInsights'
import { RefreshCw, Save, RotateCcw, AlertCircle } from 'lucide-react'

const goalsSchema = z.object({
  sales_target: z.coerce.number().min(0),
  labor_target_pct: z.coerce.number().min(0),
  waste_target_pct: z.coerce.number().min(0),
  food_variance_target_pct: z.coerce.number(), // Allow negative numbers for food variance
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
  theoretical_food_cost: number
  food_variance_cost: number
  waste_amount: number
  breakfast_sales: number
  night_sales: number
}

type HistoricalData = {
  lastWeek: number
  lastMonth: number
  lastYear: number
}

type SuccessRate = {
  hit: number
  total: number
}

type GoalMetrics = {
  actual: number
  target: number
  progress: number
  status: GoalStatus
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  historical: HistoricalData
  successRate: SuccessRate
  insight: string
}

// Utility functions for goal calculations
const calculateGoalStatus = (actual: number, target: number, isLowerBetter = false): GoalStatus => {
  if (target === 0) return 'behind'
  
  const percentage = (actual / target) * 100
  const tolerance = 5 // 5% tolerance
  
  if (isLowerBetter) {
    if (percentage <= 100 - tolerance) return 'on-track'
    if (percentage <= 100 + tolerance) return 'caution'
    return 'behind'
  } else {
    if (percentage >= 100 + tolerance) return 'exceeded'
    if (percentage >= 100 - tolerance) return 'on-track'
    if (percentage >= 100 - (tolerance * 2)) return 'caution'
    return 'behind'
  }
}


const calculateTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'stable', value: number } => {
  if (previous === 0) return { trend: 'stable', value: 0 }
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 1) return { trend: 'stable', value: 0 }
  return { trend: change > 0 ? 'up' : 'down', value: Math.abs(change) }
}

const generateInsight = (metrics: GoalMetrics, metricName: string): string => {
  const { actual, target, progress, status, trend } = metrics
  
  if (status === 'behind') {
    const shortfall = target - actual
    return `${metricName} is ${shortfall.toLocaleString()} below target. Consider reviewing operational efficiency.`
  }
  
  if (status === 'caution') {
    return `${metricName} is close to target but needs attention. Monitor closely for improvement opportunities.`
  }
  
  if (status === 'exceeded') {
    return `Excellent! ${metricName} exceeded target by ${(actual - target).toLocaleString()}.`
  }
  
  if (trend === 'up' && progress > 80) {
    return `${metricName} trending positively and on track to meet goal.`
  }
  
  return `${metricName} performing well within target range.`
}

export function GoalsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [storeId, setStoreId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [lastSavedValues, setLastSavedValues] = useState<GoalsFormData | null>(null)

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
      food_variance_target_pct: -0.5, // Default to negative (under budget is good)
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
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('store_id', storeId)
          .eq('period_start', period_start)
          .eq('period_end', period_end)
          .maybeSingle()
        if (error && error.code !== 'PGRST116') {
          const code = String((error as any).code || '')
          const msg = String((error as any).message || '')
          const isMissing = code.startsWith('42') || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('does not exist')
          if (isMissing) {
            console.warn('[Goals] Goals table not available; returning null')
            return null
          }
          throw error
        }
        return (data as GoalsRow) || null
      } catch (e: any) {
        const code = String(e?.code || '')
        const msg = String(e?.message || '')
        const isMissing = code.startsWith('42') || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('does not exist')
        if (isMissing) {
          console.warn('[Goals] Goals table not available; returning null')
          return null
        }
        throw e
      }
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

  // Historical data for benchmarks
  const { data: historicalData } = useQuery<{
    lastWeek: OmegaDailyRow[]
    lastMonth: OmegaDailyRow[]
    lastYear: OmegaDailyRow[]
  }>({
    queryKey: ['historical_data_for_goals', storeId, period_start, period_end],
    queryFn: async () => {
      if (!storeId) return { lastWeek: [], lastMonth: [], lastYear: [] }
      
      const currentStart = new Date(period_start)
      const currentEnd = new Date(period_end)
      
      // Last week (same period last week)
      const lastWeekStart = format(subWeeks(currentStart, 1), 'yyyy-MM-dd')
      const lastWeekEnd = format(subWeeks(currentEnd, 1), 'yyyy-MM-dd')
      
      // Last month (same period last month)
      const lastMonthStart = format(subMonths(currentStart, 1), 'yyyy-MM-dd')
      const lastMonthEnd = format(subMonths(currentEnd, 1), 'yyyy-MM-dd')
      
      // Last year (same period last year)
      const lastYearStart = format(subMonths(currentStart, 12), 'yyyy-MM-dd')
      const lastYearEnd = format(subMonths(currentEnd, 12), 'yyyy-MM-dd')
      
      const [lastWeekRes, lastMonthRes, lastYearRes] = await Promise.all([
        supabase
          .from('omega_daily')
          .select('*')
          .eq('store_id', storeId)
          .gte('business_date', lastWeekStart)
          .lte('business_date', lastWeekEnd)
          .order('business_date', { ascending: true }),
        supabase
          .from('omega_daily')
          .select('*')
          .eq('store_id', storeId)
          .gte('business_date', lastMonthStart)
          .lte('business_date', lastMonthEnd)
          .order('business_date', { ascending: true }),
        supabase
          .from('omega_daily')
          .select('*')
          .eq('store_id', storeId)
          .gte('business_date', lastYearStart)
          .lte('business_date', lastYearEnd)
          .order('business_date', { ascending: true })
      ])
      
      return {
        lastWeek: (lastWeekRes.data as OmegaDailyRow[]) || [],
        lastMonth: (lastMonthRes.data as OmegaDailyRow[]) || [],
        lastYear: (lastYearRes.data as OmegaDailyRow[]) || []
      }
    },
    enabled: !!storeId,
  })

  // Success rate data (last 12 periods)
  const { data: successRateData } = useQuery<{
    sales: SuccessRate
    labor: SuccessRate
    waste: SuccessRate
    foodVariance: SuccessRate
  }>({
    queryKey: ['success_rate_data', storeId],
    queryFn: async () => {
      if (!storeId) return { sales: { hit: 0, total: 0 }, labor: { hit: 0, total: 0 }, waste: { hit: 0, total: 0 }, foodVariance: { hit: 0, total: 0 } }
      
      // Get last 12 weeks of data
      const twelveWeeksAgo = format(subWeeks(new Date(), 12), 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      
      const { data, error } = await supabase
        .from('omega_daily')
        .select('*')
        .eq('store_id', storeId)
        .gte('business_date', twelveWeeksAgo)
        .lte('business_date', today)
        .order('business_date', { ascending: true })
      
      if (error) throw error
      const entries = (data as OmegaDailyRow[]) || []
      
      // Group by week and calculate success rates
      const weeklyData = entries.reduce((acc, entry) => {
        const weekStart = startOfWeek(new Date(entry.business_date), { weekStartsOn: 0 })
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        
        if (!acc[weekKey]) {
          acc[weekKey] = []
        }
        acc[weekKey].push(entry)
        return acc
      }, {} as Record<string, OmegaDailyRow[]>)
      
      const weeks = Object.values(weeklyData).slice(-12) // Last 12 weeks
      
      const calculateSuccessRate = (weeks: OmegaDailyRow[][], targetValue: number, isLowerBetter = false) => {
        let hit = 0
        weeks.forEach(week => {
          const weeklyTotal = week.reduce((sum, day) => sum + (day.net_sales || 0), 0)
          const weeklyAvg = week.reduce((sum, day) => sum + (day.labor_percentage || 0), 0) / week.length
          const weeklyWaste = week.reduce((sum, day) => sum + (day.waste_amount || 0), 0)
          const weeklyWastePct = weeklyTotal > 0 ? (weeklyWaste / weeklyTotal) * 100 : 0
          const weeklyVariance = week.reduce((sum, day) => sum + (day.food_variance_cost || 0), 0)
          const weeklyVariancePct = weeklyTotal > 0 ? (weeklyVariance / weeklyTotal) * 100 : 0
          
          let value = 0
          if (targetValue === 25) value = weeklyAvg // Labor target
          else if (targetValue === 0.5) value = weeklyWastePct // Waste target
          else if (targetValue === 0.5) value = weeklyVariancePct // Food variance target
          else value = weeklyTotal // Sales target
          
          const isSuccess = isLowerBetter ? value <= targetValue : value >= targetValue
          if (isSuccess) hit++
        })
        
        return { hit, total: weeks.length }
      }
      
      return {
        sales: calculateSuccessRate(weeks, 0, false), // Will be calculated with actual sales targets
        labor: calculateSuccessRate(weeks, 25, true),
        waste: calculateSuccessRate(weeks, 0.5, true),
        foodVariance: calculateSuccessRate(weeks, 0.5, true)
      }
    },
    enabled: !!storeId,
  })

  const actuals = useMemo(() => {
    const totalSales = omegaEntries.reduce((s, r) => s + (Number(r.net_sales) || 0), 0)
    
    // Weighted average for labor percentage (weighted by sales)
    const totalLaborHours = omegaEntries.reduce((s, r) => s + (Number(r.labor_hours) || 0), 0)
    const totalIdealHours = omegaEntries.reduce((s, r) => s + (Number(r.ideal_labor_hours) || 0), 0)
    const avgLaborPct = totalIdealHours > 0 ? (totalLaborHours / totalIdealHours) * 100 : 0
    
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

  // Enhanced goal metrics with pacing, trends, and insights
  const goalMetrics = useMemo(() => {
    const formValues = form.watch()

    // Calculate historical benchmarks
    const getHistoricalValue = (data: OmegaDailyRow[], isPercentage = false) => {
      if (!data || data.length === 0) return 0
      if (isPercentage) {
        const totalLaborHours = data.reduce((s, r) => s + (Number(r.labor_hours) || 0), 0)
        const totalIdealHours = data.reduce((s, r) => s + (Number(r.ideal_labor_hours) || 0), 0)
        return totalIdealHours > 0 ? (totalLaborHours / totalIdealHours) * 100 : 0
      } else {
        return data.reduce((s, r) => s + (Number(r.net_sales) || 0), 0)
      }
    }

    const historical = historicalData ? {
      lastWeek: getHistoricalValue(historicalData.lastWeek),
      lastMonth: getHistoricalValue(historicalData.lastMonth),
      lastYear: getHistoricalValue(historicalData.lastYear)
    } : { lastWeek: 0, lastMonth: 0, lastYear: 0 }

    // Sales metrics
    const salesProgress = formValues.sales_target > 0 ? (actuals.totalSales / formValues.sales_target) * 100 : 0
    const salesStatus = calculateGoalStatus(actuals.totalSales, formValues.sales_target, false)
    const salesTrend = calculateTrend(actuals.totalSales, historical.lastWeek)
    
    // Labor metrics (for percentage goals where lower is better)
    const laborProgress = formValues.labor_target_pct > 0 && actuals.avgLaborPct > 0
      ? Math.max(0, Math.min(100, (formValues.labor_target_pct / actuals.avgLaborPct) * 100))
      : formValues.labor_target_pct > 0 && actuals.avgLaborPct === 0
      ? 100 // If actual is 0 and we have a target, we're doing great
      : 0
    const laborStatus = calculateGoalStatus(actuals.avgLaborPct, formValues.labor_target_pct, true)
    const laborTrend = calculateTrend(actuals.avgLaborPct, historical.lastWeek)
    
    // Waste metrics (for percentage goals where lower is better)
    const wasteProgress = formValues.waste_target_pct > 0 && actuals.wastePct > 0
      ? Math.max(0, Math.min(100, (formValues.waste_target_pct / actuals.wastePct) * 100))
      : formValues.waste_target_pct > 0 && actuals.wastePct === 0
      ? 100 // If actual is 0 and we have a target, we're doing great
      : 0
    const wasteStatus = calculateGoalStatus(actuals.wastePct, formValues.waste_target_pct, true)
    const wasteTrend = calculateTrend(actuals.wastePct, historical.lastWeek)
    
    // Food variance metrics (can be negative - negative is good, positive is bad)
    const foodVarProgress = (() => {
      if (formValues.food_variance_target_pct === 0) return 0
      
      // If target is negative (good) and actual is negative (good), show progress
      if (formValues.food_variance_target_pct < 0 && actuals.foodVarPct < 0) {
        // Both negative - closer to 0 is better, so show how close we are to target
        return Math.max(0, Math.min(100, (Math.abs(actuals.foodVarPct) / Math.abs(formValues.food_variance_target_pct)) * 100))
      }
      
      // If target is positive (bad) and actual is positive (bad), show progress
      if (formValues.food_variance_target_pct > 0 && actuals.foodVarPct > 0) {
        // Both positive - closer to 0 is better, so show how close we are to target
        return Math.max(0, Math.min(100, (formValues.food_variance_target_pct / actuals.foodVarPct) * 100))
      }
      
      // If actual is 0 (perfect) and we have any target, we're doing great
      if (actuals.foodVarPct === 0) return 100
      
      // Mixed signs - if actual is better than target, show good progress
      if (actuals.foodVarPct < formValues.food_variance_target_pct) {
        return Math.max(0, Math.min(100, 100 - Math.abs(actuals.foodVarPct - formValues.food_variance_target_pct) * 10))
      }
      
      return 0
    })()
    const foodVarStatus = calculateGoalStatus(actuals.foodVarPct, formValues.food_variance_target_pct, true)
    const foodVarTrend = calculateTrend(actuals.foodVarPct, historical.lastWeek)

    return {
      sales: {
        actual: actuals.totalSales,
        target: formValues.sales_target,
        progress: salesProgress,
        status: salesStatus,
        trend: salesTrend.trend,
        trendValue: salesTrend.value,
        historical,
        successRate: successRateData?.sales || { hit: 0, total: 0 },
        insight: generateInsight({
          actual: actuals.totalSales,
          target: formValues.sales_target,
          progress: salesProgress,
          status: salesStatus,
          trend: salesTrend.trend,
          trendValue: salesTrend.value,
          historical,
          successRate: successRateData?.sales || { hit: 0, total: 0 },
          insight: ''
        }, 'Sales')
      },
      labor: {
        actual: actuals.avgLaborPct,
        target: formValues.labor_target_pct,
        progress: laborProgress,
        status: laborStatus,
        trend: laborTrend.trend,
        trendValue: laborTrend.value,
        historical,
        successRate: successRateData?.labor || { hit: 0, total: 0 },
        insight: generateInsight({
          actual: actuals.avgLaborPct,
          target: formValues.labor_target_pct,
          progress: laborProgress,
          status: laborStatus,
          trend: laborTrend.trend,
          trendValue: laborTrend.value,
          historical,
          successRate: successRateData?.labor || { hit: 0, total: 0 },
          insight: ''
        }, 'Labor')
      },
      waste: {
        actual: actuals.wastePct,
        target: formValues.waste_target_pct,
        progress: wasteProgress,
        status: wasteStatus,
        trend: wasteTrend.trend,
        trendValue: wasteTrend.value,
        historical,
        successRate: successRateData?.waste || { hit: 0, total: 0 },
        insight: generateInsight({
          actual: actuals.wastePct,
          target: formValues.waste_target_pct,
          progress: wasteProgress,
          status: wasteStatus,
          trend: wasteTrend.trend,
          trendValue: wasteTrend.value,
          historical,
          successRate: successRateData?.waste || { hit: 0, total: 0 },
          insight: ''
        }, 'Waste')
      },
      foodVariance: {
        actual: actuals.foodVarPct,
        target: formValues.food_variance_target_pct,
        progress: foodVarProgress,
        status: foodVarStatus,
        trend: foodVarTrend.trend,
        trendValue: foodVarTrend.value,
        historical,
        successRate: successRateData?.foodVariance || { hit: 0, total: 0 },
        insight: generateInsight({
          actual: actuals.foodVarPct,
          target: formValues.food_variance_target_pct,
          progress: foodVarProgress,
          status: foodVarStatus,
          trend: foodVarTrend.trend,
          trendValue: foodVarTrend.value,
          historical,
          successRate: successRateData?.foodVariance || { hit: 0, total: 0 },
          insight: ''
        }, 'Food Variance')
      }
    }
  }, [actuals, form.watch(), historicalData, successRateData, period_start, period_end])

  // Generate insights for the insights panel
  const insights = useMemo((): GoalInsight[] => {
    const insights: GoalInsight[] = []
    
    // Check for pacing issues
    const timeElapsed = Math.max(0.1, (Date.now() - new Date(period_start).getTime()) / (new Date(period_end).getTime() - new Date(period_start).getTime()))
    const salesPacing = goalMetrics.sales.progress / timeElapsed
    if (salesPacing < 0.8 && goalMetrics.sales.status === 'behind') {
      insights.push({
        type: 'alert',
        title: 'Sales Pacing Alert',
        message: `Sales are ${(goalMetrics.sales.progress).toFixed(1)}% of target but only ${(timeElapsed * 100).toFixed(1)}% of time has passed. Consider immediate action.`,
        action: 'Review Operations'
      })
    }
    
    // Check for labor issues
    if (goalMetrics.labor.status === 'behind') {
      insights.push({
        type: 'warning',
        title: 'Labor Over Target',
        message: `Labor is ${goalMetrics.labor.actual.toFixed(1)}% vs target of ${goalMetrics.labor.target.toFixed(1)}%. Review scheduling and efficiency.`,
        action: 'Adjust Schedule'
      })
    }
    
    // Check for waste issues
    if (goalMetrics.waste.status === 'behind') {
      insights.push({
        type: 'warning',
        title: 'Waste Over Target',
        message: `Waste is ${goalMetrics.waste.actual.toFixed(2)}% vs target of ${goalMetrics.waste.target.toFixed(2)}%. Review inventory management.`,
        action: 'Check Inventory'
      })
    }
    
    // Success rate insights
    if (goalMetrics.sales.successRate.hit / goalMetrics.sales.successRate.total < 0.5) {
      insights.push({
        type: 'info',
        title: 'Sales Consistency',
        message: `Sales goal hit only ${goalMetrics.sales.successRate.hit} of last ${goalMetrics.sales.successRate.total} periods. Focus on consistency.`
      })
    }
    
    return insights
  }, [goalMetrics, period_start, period_end])

  const saveMutation = useMutation({
    mutationFn: async (payload: GoalsFormData) => {
      console.log('Save mutation started with payload:', payload)
      console.log('Store ID:', storeId)
      console.log('Scope:', scope)
      console.log('Period:', period_start, 'to', period_end)
      
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
      console.log('Upsert data:', upsert)
      
      const { error } = await supabase
        .from('goals')
        .upsert(upsert, { onConflict: 'store_id,period_start,period_end' })
      
      if (error) {
        console.error('Supabase error:', error)
        const code = String((error as any).code || '')
        const msg = String((error as any).message || '')
        const isMissing = code.startsWith('42') || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('does not exist')
        if (isMissing) {
          throw new Error('Goals table is not installed in this Supabase project. Open Setup and run the SQL to create it, then try again.')
        }
        throw error
      }
      console.log('Goals saved successfully')
    },
    onSuccess: () => {
      toast({ title: 'Goals Saved', description: 'Goals have been successfully saved for the selected period.' })
      queryClient.invalidateQueries({ queryKey: ['goals_settings', storeId, period_start, period_end] })
      setLastSavedValues(form.getValues())
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' })
    }
  })

  // Enhanced handlers
  const handleEdit = useCallback(() => {
    setLastSavedValues(form.getValues())
    setIsEditing(true)
  }, [form])

  const handleCancel = useCallback(() => {
    if (lastSavedValues) {
      form.reset(lastSavedValues)
    }
    setIsEditing(false)
  }, [form, lastSavedValues])

  const handleSave = useCallback(() => {
    console.log('Save button clicked')
    const values = form.getValues()
    console.log('Form values:', values)
    form.handleSubmit((values) => {
      console.log('Form submitted with values:', values)
      saveMutation.mutate(values)
    })()
  }, [form, saveMutation])

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['omega_daily_for_goals', storeId, period_start, period_end] })
    queryClient.invalidateQueries({ queryKey: ['historical_data_for_goals', storeId, period_start, period_end] })
    queryClient.invalidateQueries({ queryKey: ['success_rate_data', storeId] })
    toast({ title: 'Refreshed', description: 'Goal data has been refreshed with latest information.' })
  }, [queryClient, storeId, period_start, period_end, toast])

  const handleReset = useCallback(() => {
    form.reset({
      sales_target: 0,
      labor_target_pct: 25,
      waste_target_pct: 0.5,
      food_variance_target_pct: -0.5, // Default to negative (under budget is good)
      team_notes: '',
    })
    setIsEditing(true)
  }, [form])

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-wendys-charcoal">Goal Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Set targets, track progress, and gain insights into your store's performance</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={!storeId}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {!isEditing ? (
            <Button onClick={handleEdit} className="wendys-button">
              Edit Goals
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending}
                className="wendys-button flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Goals'}
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
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

      {/* Key Insights Panel */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-800">Performance Alerts</h3>
          </div>
          <GoalInsights insights={insights} />
        </div>
      )}

      {/* Enhanced Goal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Sales Goal Card */}
        <GoalCard
          title="Sales Target"
          target={goalMetrics.sales.target}
          actual={goalMetrics.sales.actual}
          unit="currency"
          status={goalMetrics.sales.status}
          progress={goalMetrics.sales.progress}
          trend={goalMetrics.sales.trend}
          trendValue={goalMetrics.sales.trendValue}
          insight={goalMetrics.sales.insight}
          historicalBenchmark={{
            lastWeek: goalMetrics.sales.historical.lastWeek,
            lastYear: goalMetrics.sales.historical.lastYear
          }}
          successRate={goalMetrics.sales.successRate}
          isEditing={isEditing}
          onEdit={(value) => form.setValue('sales_target', value)}
        />

        {/* Labor Goal Card */}
        <GoalCard
          title="Labor Efficiency"
          target={goalMetrics.labor.target}
          actual={goalMetrics.labor.actual}
          unit="percentage"
          status={goalMetrics.labor.status}
          progress={goalMetrics.labor.progress}
          trend={goalMetrics.labor.trend}
          trendValue={goalMetrics.labor.trendValue}
          insight={goalMetrics.labor.insight}
          historicalBenchmark={{
            lastWeek: goalMetrics.labor.historical.lastWeek,
            lastYear: goalMetrics.labor.historical.lastYear
          }}
          successRate={goalMetrics.labor.successRate}
          isEditing={isEditing}
          onEdit={(value) => form.setValue('labor_target_pct', value)}
        />

        {/* Waste Goal Card */}
        <GoalCard
          title="Waste Control"
          target={goalMetrics.waste.target}
          actual={goalMetrics.waste.actual}
          unit="percentage"
          status={goalMetrics.waste.status}
          progress={goalMetrics.waste.progress}
          trend={goalMetrics.waste.trend}
          trendValue={goalMetrics.waste.trendValue}
          insight={goalMetrics.waste.insight}
          historicalBenchmark={{
            lastWeek: goalMetrics.waste.historical.lastWeek,
            lastYear: goalMetrics.waste.historical.lastYear
          }}
          successRate={goalMetrics.waste.successRate}
          isEditing={isEditing}
          onEdit={(value) => form.setValue('waste_target_pct', value)}
        />

        {/* Food Variance Goal Card */}
        <GoalCard
          title="Food Variance"
          target={goalMetrics.foodVariance.target}
          actual={goalMetrics.foodVariance.actual}
          unit="percentage"
          status={goalMetrics.foodVariance.status}
          progress={goalMetrics.foodVariance.progress}
          trend={goalMetrics.foodVariance.trend}
          trendValue={goalMetrics.foodVariance.trendValue}
          insight={goalMetrics.foodVariance.insight}
          historicalBenchmark={{
            lastWeek: goalMetrics.foodVariance.historical.lastWeek,
            lastYear: goalMetrics.foodVariance.historical.lastYear
          }}
          successRate={goalMetrics.foodVariance.successRate}
          isEditing={isEditing}
          onEdit={(value) => form.setValue('food_variance_target_pct', value)}
        />

        {/* Team Notes Card */}
        <div className="wendys-card p-6 lg:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">Team Notes & Goals</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team_notes" className="text-sm font-medium text-gray-700">
                Notes & Observations
              </Label>
              <Input 
                id="team_notes" 
                {...form.register('team_notes')} 
                placeholder="Team notes, personal goals, shout-outs, operational insights..."
                className="mt-1"
                disabled={!isEditing}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use this space to track team performance, note operational improvements, 
                or celebrate achievements that contribute to your goals.
              </p>
            </div>
            </div>
          </div>
        </div>

      {/* Progress Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="wendys-card p-6">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">Sales Progress Trend</h3>
          <GoalProgressChart
            data={omegaEntries.map(entry => ({
              date: entry.business_date,
              actual: entry.net_sales,
              target: goalMetrics.sales.target,
              period: format(new Date(entry.business_date), 'MMM d')
            }))}
            unit="currency"
          />
            </div>
        <div className="wendys-card p-6">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">Labor Efficiency Trend</h3>
          <GoalProgressChart
            data={omegaEntries.map(entry => ({
              date: entry.business_date,
              actual: entry.labor_percentage,
              target: goalMetrics.labor.target,
              period: format(new Date(entry.business_date), 'MMM d')
            }))}
            unit="percentage"
          />
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/goals')({
  component: GoalsPage,
})
