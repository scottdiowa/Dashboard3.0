import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { chartColors } from '@/lib/chart-utils'

interface OverviewKpiCardProps {
  title: string
  value: number | undefined | null
  format: 'currency' | 'percentage' | 'number'
  delta?: number | undefined | null
  deltaLabel?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  suffix?: string
  subtitle?: string
  sparklineData?: Array<{ value: number }>
  className?: string
}

export function OverviewKpiCard({
  title,
  value,
  format,
  delta,
  deltaLabel,
  icon: Icon,
  trend,
  suffix,
  subtitle,
  sparklineData,
  className
}: OverviewKpiCardProps) {
  const formatValue = (val: number | undefined | null) => {
    if (val == null || isNaN(val)) return '0'
    
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      case 'number':
        return val.toLocaleString()
      default:
        return val.toString()
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
    }
  }

  return (
    <div className={cn("wendys-card", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
            <div className="w-8 h-8 bg-wendys-red bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <Icon className="h-4 w-4 text-wendys-red" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-wendys-charcoal">
              {formatValue(value)}
              {suffix && <span className="text-lg ml-1 font-normal">{suffix}</span>}
            </span>
            
            {sparklineData && sparklineData.length > 0 && (
              <div className="w-16 h-8 ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={trend === 'up' ? chartColors.positive : trend === 'down' ? chartColors.waste : chartColors.textSecondary}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {delta !== undefined && delta !== null && deltaLabel && (
            <div className="flex items-center space-x-1 mt-3">
              {getTrendIcon()}
              <span className={cn("text-sm font-medium", getTrendColor())}>
                {delta > 0 ? '+' : ''}{Math.abs(delta) < 1 && format !== 'percentage' ? formatPercentage(Math.abs(delta) * 100) : formatValue(Math.abs(delta))}
                {suffix && format !== 'percentage' && <span className="ml-1">{suffix}</span>}
              </span>
              <span className="text-xs text-gray-500">{deltaLabel}</span>
            </div>
          )}

          {subtitle && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
