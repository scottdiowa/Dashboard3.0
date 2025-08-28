import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useMemo } from 'react'
import { chartFormatters, chartColors, chartDefaults } from '@/lib/chart-utils'

interface LaborVsIdealChartProps {
  data?: Array<{
    business_date: string
    labor_hours: number
    ideal_labor_hours: number
  }>
}

export function LaborVsIdealChart({ data = [] }: LaborVsIdealChartProps) {
  console.log('🔍 LaborVsIdealChart received data:', data.slice(0, 3))

  const chartData = useMemo(() => {
    if (!data.length) {
      // Generate empty data for the last 7 days
      const emptyData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        emptyData.push({
          date: chartFormatters.dateShort(date.toISOString().slice(0, 10)),
          ideal: 0,
          actual: 0,
        })
      }
      return emptyData
    }

    // Sort data by date and take the most recent 30 entries (full dataset)
    const processedData = data
      .sort((a, b) => new Date(a.business_date).getTime() - new Date(b.business_date).getTime())
      .slice(-30)
      .map((entry) => {
        const ideal = Number(entry.ideal_labor_hours) || 0
        const actual = Number(entry.labor_hours) || 0
        console.log('🔍 Processing entry:', entry.business_date, 'ideal:', entry.ideal_labor_hours, '=>', ideal, 'actual:', entry.labor_hours, '=>', actual)
        return {
          date: chartFormatters.dateShort(entry.business_date),
          ideal,
          actual,
        }
      })

    console.log('🔍 Processed chart data:', processedData.slice(0, 3))
    return processedData
  }, [data])

  console.log('🔍 Final chartData being rendered:', chartData.slice(0, 3))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid {...chartDefaults.cartesianGrid} />
        <XAxis 
          dataKey="date" 
          {...chartDefaults.xAxis}
        />
        <YAxis
          {...chartDefaults.yAxis}
          tickFormatter={(value) => chartFormatters.hours(value)}
        />
        <Tooltip
          {...chartDefaults.tooltip}
          formatter={(value: any, name: string) => [
            chartFormatters.hours(value), 
            name === 'ideal' ? 'Ideal Hours' : 'Actual Hours'
          ]}
        />
        <Legend {...chartDefaults.legend} />
        <Bar 
          dataKey="ideal" 
          fill={chartColors.laborIdeal} 
          opacity={0.6}
          name="Ideal Hours"
        />
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke={chartColors.labor} 
          strokeWidth={3}
          dot={{ fill: chartColors.labor, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: chartColors.textPrimary, strokeWidth: 2 }}
          name="Actual Hours"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
