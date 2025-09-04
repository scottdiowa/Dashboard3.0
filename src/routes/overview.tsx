import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'

import { TrendingUp, TrendingDown, DollarSign, Clock, Video, Settings } from 'lucide-react'

import { OverviewKpiCard } from '@/components/overview/OverviewKpiCard'
import { SalesTrendChart } from '@/components/overview/SalesTrendChart'
import { LaborVsIdealChart } from '@/components/overview/LaborVsIdealChart'
import { OsatSnapshot } from '@/components/overview/OsatSnapshot'
import { InterviewsTodayList } from '@/components/overview/InterviewsTodayList'
import { ChartCard } from '@/components/ui/chart-card'
import { FilterToolbar, useFilters } from '@/components/ui/filter-toolbar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'

export const Route = createFileRoute('/overview')({
  component: OverviewPage,
})

function OverviewPage() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string>('banner-video.mp4')

  // Available video options
  const videoOptions = [
    { value: 'banner-video.mp4', label: 'Banner Video (Original)' },
    { value: 'banner-video (2).mp4', label: 'Banner Video 2' },
    { value: 'video-banner.mp4', label: 'Video Banner' },
    { value: 'dashboard-8_30_2025, 8_58 PM.mp4', label: 'Dashboard Demo' },
  ]

  // Use the new filter hook with persistence
  const filters = useFilters('overview', 'today')

  // Load saved video selection from localStorage
  useEffect(() => {
    const savedVideo = localStorage.getItem('banner-video-selection')
    if (savedVideo && videoOptions.some(option => option.value === savedVideo)) {
      setSelectedVideo(savedVideo)
    }
  }, [])

  // Save video selection to localStorage
  const handleVideoChange = (videoValue: string) => {
    setSelectedVideo(videoValue)
    localStorage.setItem('banner-video-selection', videoValue)
  }

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

  // Fetch Weekending Sheet data for the selected date range
  const { data: weekendingData = [] } = useQuery({
    queryKey: ['overview-weekending', storeId, dateRangeFilter?.start, dateRangeFilter?.end],
    queryFn: async () => {
      if (!storeId) return []

      console.log('📊 Fetching overview weekending data with filters:', {
        storeId,
        dateRangeFilter,
        queryKey: ['overview-weekending', storeId, dateRangeFilter?.start, dateRangeFilter?.end]
      })
      console.log('📊 Date range details:', {
        start: dateRangeFilter?.start,
        end: dateRangeFilter?.end,
        hasFilter: !!dateRangeFilter
      })

      let query = supabase
        .from('weekending_sheet')
        .select('*')
        .eq('store_id', storeId)
        
      if (dateRangeFilter) {
        query = query
          .gte('week_ending_date', dateRangeFilter.start)
          .lte('week_ending_date', dateRangeFilter.end)
      }
      
      const { data, error } = await query
        .order('week_ending_date', { ascending: true })

      if (error) throw error
      console.log('📊 Overview weekending data fetched:', data?.length || 0, 'entries')
      return data || []
    },
    enabled: !!storeId,
  })

  // Fetch Weekending Sheet data for charts (always last 12 weeks for consistent trending)
  const { data: weekendingChartData = [] } = useQuery({
    queryKey: ['overview-weekending-charts', storeId],
    queryFn: async () => {
      if (!storeId) return []

      // Always fetch last 12 weeks for charts to ensure consistent trending
      const twelveWeeksAgo = new Date()
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84) // 12 weeks * 7 days
      const startDate = twelveWeeksAgo.toISOString().slice(0, 10)

      console.log('📈 Fetching overview weekending chart data:', {
        storeId,
        startDate,
        queryKey: ['overview-weekending-charts', storeId]
      })

      const { data, error } = await supabase
        .from('weekending_sheet')
        .select('*')
        .eq('store_id', storeId)
        .gte('week_ending_date', startDate)
        .order('week_ending_date', { ascending: true })

      if (error) throw error
      console.log('📈 Overview weekending chart data fetched:', data?.length || 0, 'entries')
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

  // Calculate aggregated metrics from weekending sheet data
  const weekendingAggregatedData = useMemo(() => {
    if (weekendingData.length === 0) {
      return {
        weeklyNetSales: 0,
        weeklyLabor: 0,
        weeklyFoodVariance: 0,
        weeklyBreakfastSales: 0,
        weeklyLateNightSales: 0,
        weeklyOnboarding: 0,
        weeklyCrewQuiz: 0,
        weeklyMgrQuiz: 0,
        weeklyNewHires: 0,
        weeklyTerminations: 0,
      }
    }

    const totals = weekendingData.reduce((acc, entry) => ({
      weeklyNetSales: acc.weeklyNetSales + (entry.net_sales || 0),
      weeklyLabor: acc.weeklyLabor + (entry.labor || 0),
      weeklyFoodVariance: acc.weeklyFoodVariance + (entry.food_variance_percentage || 0),
      weeklyBreakfastSales: acc.weeklyBreakfastSales + (entry.breakfast_sales || 0),
      weeklyLateNightSales: acc.weeklyLateNightSales + (entry.late_night_sales || 0),
      weeklyOnboarding: acc.weeklyOnboarding + (entry.onboarding ? 1 : 0),
      weeklyCrewQuiz: acc.weeklyCrewQuiz + (entry.crew_food_safety_quiz || 0),
      weeklyMgrQuiz: acc.weeklyMgrQuiz + (entry.mgr_food_safety_quiz || 0),
      weeklyNewHires: acc.weeklyNewHires + (entry.new_hire_name ? 1 : 0),
      weeklyTerminations: acc.weeklyTerminations + (entry.terminations ? 1 : 0),
    }), {
      weeklyNetSales: 0,
      weeklyLabor: 0,
      weeklyFoodVariance: 0,
      weeklyBreakfastSales: 0,
      weeklyLateNightSales: 0,
      weeklyOnboarding: 0,
      weeklyCrewQuiz: 0,
      weeklyMgrQuiz: 0,
      weeklyNewHires: 0,
      weeklyTerminations: 0,
    })

    // Calculate averages
    const avgCrewQuiz = weekendingData.length > 0 ? totals.weeklyCrewQuiz / weekendingData.length : 0
    const avgMgrQuiz = weekendingData.length > 0 ? totals.weeklyMgrQuiz / weekendingData.length : 0
    const avgFoodVariance = weekendingData.length > 0 ? totals.weeklyFoodVariance / weekendingData.length : 0

    return {
      ...totals,
      avgCrewQuiz,
      avgMgrQuiz,
      avgFoodVariance,
    }
  }, [weekendingData])

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

      {/* Video Banner */}
      <div className="wendys-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-wendys-red" />
            <h3 className="text-lg font-semibold text-wendys-charcoal">Banner Video</h3>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <Select value={selectedVideo} onValueChange={handleVideoChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select video" />
              </SelectTrigger>
              <SelectContent>
                {videoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-center">
          <video 
            key={selectedVideo} // Force re-render when video changes
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full rounded-lg shadow-lg opacity-60"
            style={{ height: '200px', objectFit: 'cover', width: '100%', pointerEvents: 'none' }}
          >
            <source src={`/${selectedVideo}`} type="video/mp4" />
            <p>Your browser does not support the video tag.</p>
          </video>
        </div>
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

      {/* Weekending Sheet KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewKpiCard
          title="Weekly Net Sales"
          value={weekendingAggregatedData.weeklyNetSales}
          format="currency"
          icon={DollarSign}
          trend="neutral"
        />

        <OverviewKpiCard
          title="Weekly Labor"
          value={weekendingAggregatedData.weeklyLabor}
          format="currency"
          icon={Clock}
          trend="neutral"
        />

        <OverviewKpiCard
          title="Avg Food Variance %"
          value={weekendingAggregatedData.avgFoodVariance}
          format="percentage"
          icon={TrendingDown}
          trend={weekendingAggregatedData.avgFoodVariance >= 0 ? "down" : "up"}
        />

        <OverviewKpiCard
          title="Weekly Onboarding"
          value={weekendingAggregatedData.weeklyOnboarding}
          format="number"
          icon={TrendingUp}
          trend="neutral"
        />
      </div>

      {/* Additional Weekending Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewKpiCard
          title="Avg Crew Quiz Score"
          value={weekendingAggregatedData.avgCrewQuiz}
          format="number"
          icon={TrendingUp}
          trend="neutral"
          suffix="/100"
        />

        <OverviewKpiCard
          title="Avg MGR Quiz Score"
          value={weekendingAggregatedData.avgMgrQuiz}
          format="number"
          icon={TrendingUp}
          trend="neutral"
          suffix="/100"
        />

        <OverviewKpiCard
          title="Weekly New Hires"
          value={weekendingAggregatedData.weeklyNewHires}
          format="number"
          icon={TrendingUp}
          trend="neutral"
        />

        <OverviewKpiCard
          title="Weekly Terminations"
          value={weekendingAggregatedData.weeklyTerminations}
          format="number"
          icon={TrendingDown}
          trend="neutral"
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

      {/* Weekending Sheet Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Weekly Net Sales Trend"
          subtitle="Last 12 weeks"
          loading={!weekendingChartData.length && !error}
          error={error?.message}
        >
          {weekendingChartData.length > 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-wendys-charcoal">
                  {formatCurrency(weekendingAggregatedData.weeklyNetSales)}
                </p>
                <p className="text-sm text-gray-600">Total Weekly Sales</p>
                <p className="text-xs text-gray-500 mt-2">
                  {weekendingChartData.length} weeks of data
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No weekly data available</p>
                <p className="text-sm mt-1">Add entries in Weekending Sheet to see trends</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Weekly Training Metrics"
          subtitle="Last 12 weeks"
          loading={!weekendingChartData.length && !error}
          error={error?.message}
        >
          {weekendingChartData.length > 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-medium text-wendys-charcoal">
                    {(weekendingAggregatedData.avgCrewQuiz ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Avg Crew Quiz</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-wendys-charcoal">
                    {(weekendingAggregatedData.avgMgrQuiz ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Avg MGR Quiz</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-wendys-charcoal">
                    {weekendingAggregatedData.weeklyOnboarding}
                  </p>
                  <p className="text-sm text-gray-600">Onboarding</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-wendys-charcoal">
                    {weekendingAggregatedData.weeklyNewHires}
                  </p>
                  <p className="text-sm text-gray-600">New Hires</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No training data available</p>
                <p className="text-sm mt-1">Add entries in Weekending Sheet to see metrics</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Data Integration Summary */}
      <div className="wendys-card">
        <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">Data Integration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Daily Entries</p>
            <p className="text-2xl font-bold text-wendys-charcoal">{omegaData.length}</p>
            <p className="text-xs text-gray-500">OMEGA Daily records</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Weekly Entries</p>
            <p className="text-2xl font-bold text-wendys-charcoal">{weekendingData.length}</p>
            <p className="text-xs text-gray-500">Weekending records</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-wendys-charcoal">
              {formatCurrency(aggregatedData.netSales + weekendingAggregatedData.weeklyNetSales)}
            </p>
            <p className="text-xs text-gray-500">Combined daily + weekly</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Data Coverage</p>
            <p className="text-2xl font-bold text-wendys-charcoal">
              {omegaData.length > 0 || weekendingData.length > 0 ? 'Active' : 'No Data'}
            </p>
            <p className="text-xs text-gray-500">System status</p>
          </div>
        </div>
      </div>

      {/* OSAT Snapshot and Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OsatSnapshot />
        <InterviewsTodayList />
      </div>
    </div>
  )
}
