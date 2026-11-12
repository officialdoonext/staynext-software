import { BedDouble, CheckSquare, Users, Hotel, AlertTriangle, Clock, Wrench, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomStatusCardProps {
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  reservedRooms: number
  dirtyRooms: number
  cleaningRooms: number
  maintenanceRooms: number
  outOfOrderRooms: number
}

interface StatusItem {
  label: string
  count: number
  icon: React.ElementType
  color: string
  bg: string
}

export default function RoomStatusCard({
  totalRooms,
  availableRooms,
  occupiedRooms,
  reservedRooms,
  dirtyRooms,
  cleaningRooms,
  maintenanceRooms,
  outOfOrderRooms,
}: RoomStatusCardProps) {
  const statuses: StatusItem[] = [
    { label: 'Available', count: availableRooms, icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Occupied', count: occupiedRooms, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Reserved', count: reservedRooms, icon: Hotel, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Dirty', count: dirtyRooms, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Cleaning', count: cleaningRooms, icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Maintenance', count: maintenanceRooms, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Out of Order', count: outOfOrderRooms, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Room Status</h3>
          <p className="text-xs text-gray-500 mt-0.5">{totalRooms} total rooms</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-indigo-600">{occupancyPct}%</p>
          <p className="text-xs text-gray-500">Occupancy</p>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${occupancyPct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statuses.map(({ label, count, icon: StatusIcon, color, bg }) => (
          <div key={label} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50">
            <div className={cn('w-7 h-7 rounded flex items-center justify-center flex-shrink-0', bg)}>
              <StatusIcon className={cn('h-3.5 w-3.5', color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-sm font-semibold text-gray-900">{count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
