'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface BookingSourceData {
  name: string
  value: number
}

interface BookingSourcesChartProps {
  data: BookingSourceData[]
}

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626']

const DEFAULT_SOURCES = [
  { name: 'Direct', value: 0 },
  { name: 'Walk-in', value: 0 },
  { name: 'Website', value: 0 },
  { name: 'Phone', value: 0 },
  { name: 'Travel Agent', value: 0 },
  { name: 'OTA', value: 0 },
  { name: 'Other', value: 0 },
]

export default function BookingSourcesChart({ data }: BookingSourcesChartProps) {
  const chartData = data && data.length > 0 ? data : DEFAULT_SOURCES
  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No booking source data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => [
            `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
            'Bookings',
          ]}
          contentStyle={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
