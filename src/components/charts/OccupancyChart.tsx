'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface OccupancyDataPoint {
  name: string
  value: number
  color: string
}

interface OccupancyChartProps {
  data: OccupancyDataPoint[]
}

export default function OccupancyChart({ data }: OccupancyChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
        No room data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any, name: any) => [
            `${value} rooms (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
            name,
          ]}
          contentStyle={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value: any, entry: any) => (
            <span style={{ color: '#374151' }}>
              {value} ({entry.payload?.value ?? 0})
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
