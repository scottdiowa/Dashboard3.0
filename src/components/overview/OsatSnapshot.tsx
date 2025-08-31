import { Star, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SmgDailyRow {
  id: string
  date: string
  accuracy_decimal: number
  zod_per_10k: number
  cc_complaints: number
  osat_decimal: number
  notes?: string
}

export function OsatSnapshot() {
  const [storeId, setStoreId] = useState<string | null>(null)

  // Resolve store_id for current user
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()
      
      if (active) {
        setStoreId(data?.store_id ?? null)
      }
    })()
    return () => { active = false }
  }, [])

  // Fetch recent SMG data (last 30 days)
  const { data: smgData = [], isLoading } = useQuery<SmgDailyRow[]>({
    queryKey: ['smg_snapshot', storeId],
    queryFn: async () => {
      if (!storeId) return []

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('smg_daily')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Calculate averages from the data
  const averages = smgData.length > 0 ? {
    accuracy: smgData.reduce((sum, entry) => sum + entry.accuracy_decimal, 0) / smgData.length,
    zod: smgData.reduce((sum, entry) => sum + entry.zod_per_10k, 0) / smgData.length,
    complaints: smgData.reduce((sum, entry) => sum + entry.cc_complaints, 0) / smgData.length,
    osat: smgData.reduce((sum, entry) => sum + entry.osat_decimal, 0) / smgData.length,
  } : {
    accuracy: 0,
    zod: 0,
    complaints: 0,
    osat: 0,
  }

  // Get trend for a metric (comparing first half vs second half of period)
  const getTrend = (values: number[]) => {
    if (values.length < 4) return 'neutral'
    const mid = Math.floor(values.length / 2)
    const firstHalf = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const secondHalf = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid)
    
    const diff = secondHalf - firstHalf
    if (Math.abs(diff) < 0.1) return 'neutral'
    return diff > 0 ? 'up' : 'down'
  }

  const trends = {
    accuracy: getTrend(smgData.map(d => d.accuracy_decimal).reverse()),
    zod: getTrend(smgData.map(d => d.zod_per_10k).reverse()),
    complaints: getTrend(smgData.map(d => d.cc_complaints).reverse()),
    osat: getTrend(smgData.map(d => d.osat_decimal).reverse()),
  }

  const getScoreColor = (score: number, isLowerBetter = false) => {
    if (isLowerBetter) {
      if (score <= 1.0) return 'text-green-600'
      if (score <= 3.0) return 'text-yellow-600'
      return 'text-red-600'
    } else {
      if (score >= 90) return 'text-green-600'
      if (score >= 80) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  const getScoreIcon = (score: number, isLowerBetter = false) => {
    if (isLowerBetter) {
      if (score <= 1.0) return <CheckCircle className="h-4 w-4 text-green-600" />
      if (score <= 3.0) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    } else {
      if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />
      if (score >= 80) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="wendys-card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wendys-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-wendys-charcoal">
          OSAT Snapshot (Last 30 Days)
        </h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>{smgData.length} entries</span>
        </div>
      </div>

      {smgData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No OSAT data available</p>
          <p className="text-sm mt-1">Add entries in the OSAT tab to see metrics</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* OSAT Score */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-wendys-charcoal">OSAT Score</p>
                <p className="text-sm text-gray-600">Overall satisfaction</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(trends.osat)}
              {getScoreIcon(averages.osat)}
              <span className={cn("text-xl font-bold", getScoreColor(averages.osat))}>
                {(averages.osat ?? 0).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Accuracy of Order */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-wendys-charcoal">Accuracy of Order</p>
                <p className="text-sm text-gray-600">Order accuracy metric</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(trends.accuracy)}
              {getScoreIcon(averages.accuracy)}
              <span className={cn("text-xl font-bold", getScoreColor(averages.accuracy))}>
                {(averages.accuracy ?? 0).toFixed(1)}
              </span>
            </div>
          </div>

          {/* ZOD per 10k */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-wendys-charcoal">ZOD per 10k</p>
                <p className="text-sm text-gray-600">Zone of defection</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(trends.zod === 'up' ? 'down' : trends.zod === 'down' ? 'up' : 'neutral')}
              {getScoreIcon(averages.zod, true)}
              <span className={cn("text-xl font-bold", getScoreColor(averages.zod, true))}>
                {(averages.zod ?? 0).toFixed(1)}
              </span>
            </div>
          </div>

          {/* CC Complaints */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-wendys-charcoal">CC Complaints</p>
                <p className="text-sm text-gray-600">Customer complaints</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(trends.complaints === 'up' ? 'down' : trends.complaints === 'down' ? 'up' : 'neutral')}
              {getScoreIcon(averages.complaints, true)}
              <span className={cn("text-xl font-bold", getScoreColor(averages.complaints, true))}>
                {(averages.complaints ?? 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

