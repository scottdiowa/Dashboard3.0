import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { chartColors, chartDefaults } from '@/lib/chart-utils'

export interface GoalProgressChartProps {
  data: Array<{
    date: string
    actual: number
    target: number
    period: string
  }>
  unit: 'currency' | 'percentage' | 'hours' | 'count'
  className?: string
}

export function GoalProgressChart({ data, unit, className }: GoalProgressChartProps) {
  const formatValue = (value: number) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'hours':
        return `${value.toFixed(1)}h`
      case 'count':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className={className}>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid {...chartDefaults.cartesianGrid} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              {...chartDefaults.xAxis}
            />
            <YAxis 
              tickFormatter={formatValue}
              {...chartDefaults.yAxis}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-medium text-gray-900">{formatDate(label)}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-blue-600">Target:</span> {formatValue(Number(payload[0]?.value) || 0)}
                        </p>
                        <p className="text-sm">
                          <span className="text-green-600">Actual:</span> {formatValue(Number(payload[1]?.value) || 0)}
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke={chartColors.textSecondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={chartColors.sales}
              strokeWidth={3}
              dot={{ fill: chartColors.sales, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
