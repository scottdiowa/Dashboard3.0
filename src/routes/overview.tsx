import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'

import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react'

import { OverviewKpiCard } from '@/components/overview/OverviewKpiCard'
import { SalesTrendChart } from '@/components/overview/SalesTrendChart'
import { LaborVsIdealChart } from '@/components/overview/LaborVsIdealChart'
import { OsatSnapshot } from '@/components/overview/OsatSnapshot'
import { InterviewsTodayList } from '@/components/overview/InterviewsTodayList'
import { ChartCard } from '@/components/ui/chart-card'
import { FilterToolbar, useFilters } from '@/components/ui/filter-toolbar'

import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/overview')({
  component: OverviewPage,
})

function OverviewPage() {
  const [storeId, setStoreId] = useState<string | null>(null)

  // Use the new filter hook with persistence
  const filters = useFilters('overview', 'today')



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

  // Fetch OMEGA data for charts (always last 30 days for consistent trending)
  const { data: chartEntries = [] } = useQuery({
    queryKey: ['overview-charts', storeId],
    queryFn: async () => {
      if (!storeId) return []

      // Always fetch last 30 days for charts to ensure consistent trending
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const startDate = thirtyDaysAgo.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('omega_daily')
        .select('*')
        .eq('store_id', storeId)
        .gte('business_date', startDate)
        .order('business_date', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Fetch OMEGA data for the selected date range (for KPI calculations)
  const { data: omegaData = [], isLoading, error } = useQuery({
    queryKey: ['overview-omega', storeId, dateRangeFilter?.start, dateRangeFilter?.end],
    queryFn: async () => {
      if (!storeId) return []

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
        .order('business_date', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Calculate aggregated metrics from the fetched data
  const aggregatedData = useMemo(() => {
    if (omegaData.length === 0) {
      return {
        netSales: 0,
        compNetSales: 0,
        laborHours: 0,
        idealLaborHours: 0,
        laborPercentage: 0,
        foodVarianceCost: 0,
        foodVariancePercentage: 0,
        wasteAmount: 0,
        wastePercentage: 0,
        breakfastSales: 0,
        nightSales: 0,
      }
    }

    const totals = omegaData.reduce((acc, entry) => ({
      netSales: acc.netSales + (entry.net_sales || 0),
      compNetSales: acc.compNetSales + ((entry.net_sales || 0) - (entry.last_year_sales || 0)),
      laborHours: acc.laborHours + (entry.labor_hours || 0),
      idealLaborHours: acc.idealLaborHours + (entry.ideal_labor_hours || 0),
      foodVarianceCost: acc.foodVarianceCost + (entry.food_variance_cost || 0),
      wasteAmount: acc.wasteAmount + (entry.waste_amount || 0),
      breakfastSales: acc.breakfastSales + (entry.breakfast_sales || 0),
      nightSales: acc.nightSales + (entry.night_sales || 0),
    }), {
      netSales: 0,
      compNetSales: 0,
      laborHours: 0,
      idealLaborHours: 0,
      foodVarianceCost: 0,
      wasteAmount: 0,
      breakfastSales: 0,
      nightSales: 0,
    })

    // Calculate percentages
    const laborPercentage = totals.netSales > 0 ? (totals.laborHours / totals.netSales) * 100 : 0
    const foodVariancePercentage = totals.netSales > 0 ? (totals.foodVarianceCost / totals.netSales) * 100 : 0
    const wastePercentage = totals.netSales > 0 ? (totals.wasteAmount / totals.netSales) * 100 : 0

    return {
      ...totals,
      laborPercentage,
      foodVariancePercentage,
      wastePercentage,
    }
  }, [omegaData])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-wendys-charcoal">Overview</h1>
          <p className="text-gray-600">
            Key metrics and performance indicators for {filters.getSelectedLabel()}
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewKpiCard
          title="Net Sales"
          value={aggregatedData.netSales}
          format="currency"
          delta={aggregatedData.compNetSales}
          deltaLabel="vs Last Year"
          icon={DollarSign}
          trend={aggregatedData.compNetSales >= 0 ? "up" : "down"}
        />

        <OverviewKpiCard
          title="Labor Hours"
          value={aggregatedData.laborHours}
          format="number"
          delta={aggregatedData.laborHours - aggregatedData.idealLaborHours}
          deltaLabel="vs Ideal"
          icon={Clock}
          trend={aggregatedData.laborHours > aggregatedData.idealLaborHours ? "down" : "up"}
          suffix="hrs"
        />

        <OverviewKpiCard
          title="Labor %"
          value={aggregatedData.laborPercentage}
          format="percentage"
          icon={TrendingUp}
          trend="neutral"
        />

        <OverviewKpiCard
          title="Food Variance"
          value={aggregatedData.foodVarianceCost}
          format="currency"
          delta={aggregatedData.foodVariancePercentage}
          deltaLabel="% of Sales"
          icon={TrendingDown}
          trend={aggregatedData.foodVarianceCost >= 0 ? "down" : "up"}
        />
      </div>

      {/* Second Row of KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewKpiCard
          title="Waste Amount"
          value={aggregatedData.wasteAmount}
          format="currency"
          delta={aggregatedData.wastePercentage}
          deltaLabel="% of Sales"
          icon={TrendingDown}
          trend={aggregatedData.wasteAmount >= 0 ? "down" : "up"}
        />

        <OverviewKpiCard
          title="Breakfast Sales"
          value={aggregatedData.breakfastSales}
          format="currency"
          icon={DollarSign}
          trend="neutral"
        />

        <OverviewKpiCard
          title="Night Sales"
          value={aggregatedData.nightSales}
          format="currency"
          icon={DollarSign}
          trend="neutral"
        />

        <OverviewKpiCard
          title="Comp Net Sales"
          value={aggregatedData.compNetSales}
          format="currency"
          icon={TrendingUp}
          trend={aggregatedData.compNetSales >= 0 ? "up" : "down"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Net Sales Trend"
          subtitle="Last 30 days"
          loading={!chartEntries.length && !error}
          error={error?.message}
        >
          {chartEntries.length > 0 ? (
            <SalesTrendChart data={chartEntries} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No chart data available</p>
                <p className="text-sm mt-1">Add entries in OMEGA Daily to see trends</p>
              </div>
        </div>
          )}
        </ChartCard>

        <ChartCard
          title="Labor Hours vs Ideal"
          subtitle="Last 30 days"
          loading={!chartEntries.length && !error}
          error={error?.message}
        >
          {chartEntries.length > 0 ? (
            <LaborVsIdealChart data={chartEntries} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No chart data available</p>
                <p className="text-sm mt-1">Add entries in OMEGA Daily to see trends</p>
              </div>
        </div>
          )}
        </ChartCard>
      </div>

      {/* OSAT Snapshot and Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OsatSnapshot />
        <InterviewsTodayList />
      </div>
    </div>
  )
}
