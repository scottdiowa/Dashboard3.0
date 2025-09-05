import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Clock } from 'lucide-react'
import { chartFormatters } from '@/lib/chart-utils'

export type GoalStatus = 'on-track' | 'caution' | 'behind' | 'exceeded'

export interface GoalCardProps {
  title: string
  target: number
  actual: number
  unit: 'currency' | 'percentage' | 'hours' | 'count'
  status: GoalStatus
  progress: number // 0-100
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  insight?: string
  historicalBenchmark?: {
    lastWeek: number
    lastYear: number
  }
  successRate?: {
    hit: number
    total: number
  }
  isEditing?: boolean
  onEdit?: (value: number) => void
  className?: string
}

const statusConfig = {
  'on-track': {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    label: 'On Track'
  },
  'caution': {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertTriangle,
    label: 'Caution'
  },
  'behind': {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertTriangle,
    label: 'Behind'
  },
  'exceeded': {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Target,
    label: 'Exceeded'
  }
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Clock
}

export function GoalCard({
  title,
  target,
  actual,
  unit,
  status,
  progress,
  trend,
  trendValue,
  insight,
  historicalBenchmark,
  successRate,
  isEditing = false,
  onEdit,
  className
}: GoalCardProps) {
  const statusStyle = statusConfig[status]
  const StatusIcon = statusStyle.icon
  const TrendIcon = trend ? trendIcons[trend] : null

  const formatValue = (value: number) => {
    switch (unit) {
      case 'currency':
        return chartFormatters.currency(value)
      case 'percentage':
        return chartFormatters.percent(value, 1)
      case 'hours':
        return chartFormatters.hours(value, 1)
      case 'count':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  const getProgressColor = () => {
    switch (status) {
      case 'on-track':
        return 'bg-green-500'
      case 'caution':
        return 'bg-amber-500'
      case 'behind':
        return 'bg-red-500'
      case 'exceeded':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={cn(
      "wendys-card p-6 transition-all duration-200 hover:shadow-lg",
      statusStyle.borderColor,
      "border-l-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-wendys-charcoal">{title}</h3>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
          statusStyle.bgColor,
          statusStyle.color
        )}>
          <StatusIcon className="w-4 h-4" />
          {statusStyle.label}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Target</p>
          <p className="text-2xl font-bold text-wendys-charcoal">
            {isEditing ? (
              <input
                type="number"
                value={target}
                onChange={(e) => onEdit?.(Number(e.target.value))}
                className="w-full text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-wendys-red focus:outline-none"
              />
            ) : (
              formatValue(target)
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Actual</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-wendys-charcoal">
              {formatValue(actual)}
            </p>
            {TrendIcon && trendValue && (
              <div className={cn(
                "flex items-center gap-1 text-sm",
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(trendValue).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn("h-2 rounded-full transition-all duration-300", getProgressColor())}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Historical Benchmarks */}
      {historicalBenchmark && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 mb-1">Last Week</p>
            <p className="text-sm font-medium">{formatValue(historicalBenchmark.lastWeek)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Last Year</p>
            <p className="text-sm font-medium">{formatValue(historicalBenchmark.lastYear)}</p>
          </div>
        </div>
      )}

      {/* Success Rate */}
      {successRate && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Success Rate</p>
          <p className="text-sm font-medium text-blue-800">
            Hit {successRate.hit} of last {successRate.total} periods
          </p>
        </div>
      )}

      {/* Insight */}
      {insight && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-600 mb-1">Insight</p>
          <p className="text-sm text-amber-800">{insight}</p>
        </div>
      )}
    </div>
  )
}
