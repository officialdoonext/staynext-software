'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface BookingTrendData {
  date: string
  count: number
}

interface BookingTrendsChartProps {
  data: BookingTrendData[]
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function BookingTrendsChart({ data }: BookingTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No booking trend data yet
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    displayDate: formatShortDate(d.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          formatter={(value: any) => [value, 'Reservations']}
          contentStyle={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
        <Bar dataKey="count" fill="#4f46e5" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
