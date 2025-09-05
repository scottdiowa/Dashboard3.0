import { AlertTriangle, Target, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GoalInsight {
  type: 'warning' | 'success' | 'info' | 'alert'
  title: string
  message: string
  action?: string
  onAction?: () => void
}

export interface GoalInsightsProps {
  insights: GoalInsight[]
  className?: string
}

const insightConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-600'
  },
  success: {
    icon: Target,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  info: {
    icon: Clock,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  },
  alert: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  }
}

export function GoalInsights({ insights, className }: GoalInsightsProps) {
  if (insights.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Insights</h4>
      {insights.map((insight, index) => {
        const config = insightConfig[insight.type]
        const Icon = config.icon

        return (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border",
              config.bgColor,
              config.borderColor
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.iconColor)} />
              <div className="flex-1 min-w-0">
                <h5 className={cn("text-sm font-medium", config.textColor)}>
                  {insight.title}
                </h5>
                <p className={cn("text-sm mt-1", config.textColor)}>
                  {insight.message}
                </p>
                {insight.action && (
                  <button
                    onClick={insight.onAction}
                    className={cn(
                      "mt-2 text-xs font-medium underline hover:no-underline",
                      config.textColor
                    )}
                  >
                    {insight.action}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
