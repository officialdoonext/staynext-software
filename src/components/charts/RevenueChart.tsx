'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface RevenueDataPoint {
  date: string
  revenue: number
  expenses: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrencyShort(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value}`
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
        No revenue data yet
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    displayDate: formatShortDate(d.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatCurrencyShort}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <Tooltip
          formatter={(value: any, name: any) => [
            `$${Number(value || 0).toLocaleString()}`,
            name === 'revenue' ? 'Revenue' : 'Expenses',
          ]}
          labelFormatter={(label: any) => String(label)}
          contentStyle={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          formatter={(value: string) => (value === 'revenue' ? 'Revenue' : 'Expenses')}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#f97316"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 2"
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
