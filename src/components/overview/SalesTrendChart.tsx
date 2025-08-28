import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import { chartFormatters, chartColors, chartDefaults } from '@/lib/chart-utils'

interface SalesTrendChartProps {
  data?: Array<{
    business_date: string
    net_sales: number
  }>
}

export function SalesTrendChart({ data = [] }: SalesTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) {
      // Generate empty data for the last 14 days
      const emptyData = []
      for (let i = 13; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        emptyData.push({
          date: chartFormatters.dateShort(date.toISOString().slice(0, 10)),
          sales: 0,
        })
      }
      return emptyData
    }

    // Sort data by date and take the most recent 30 entries (full dataset)
    return data
      .sort((a, b) => new Date(a.business_date).getTime() - new Date(b.business_date).getTime())
      .slice(-30)
      .map((entry) => ({
        date: chartFormatters.dateShort(entry.business_date),
        sales: entry.net_sales || 0,
      }))
  }, [data])
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid {...chartDefaults.cartesianGrid} />
        <XAxis 
          dataKey="date" 
          {...chartDefaults.xAxis}
        />
        <YAxis 
          {...chartDefaults.yAxis}
          tickFormatter={(value) => chartFormatters.currencyCompact(value)}
        />
        <Tooltip 
          {...chartDefaults.tooltip}
          formatter={(value: any) => [chartFormatters.currencyDetailed(value), 'Net Sales']}
        />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke={chartColors.sales} 
          strokeWidth={3}
          dot={{ fill: chartColors.sales, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: chartColors.salesSecondary, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
