import React from 'react'
import Link from 'next/link'
import { Plus, BedDouble, Users, Sparkles, Check, Edit2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Room Types & Categories | StayNext' }

export default async function RoomTypesPage() {
  const supabase = await createClient()

  let types: any[] = []
  try {
    const { data } = await supabase
      .from('room_types')
      .select('*')
      .order('base_rate', { ascending: false })

    if (data) {
      types = data.map((rt: any) => ({
        id: rt.id,
        name: rt.name,
        code: rt.code || 'STD',
        baseRate: Number(rt.base_rate || 0),
        maxOccupancy: rt.max_occupancy || 2,
        totalRooms: rt.total_rooms || 0,
        size: rt.size_sqft ? `${rt.size_sqft} sqft` : 'Standard',
        bedding: rt.bed_type || 'Double Bed',
        amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
      }))
    }
  } catch {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Room Types &amp; Categories
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Define pricing tiers, base occupancy, bedding configurations, and marketing amenities.
          </p>
        </div>
      </div>

      {types.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Room Categories Created</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You have not configured any room types for your property yet (e.g. Standard, Deluxe, Suite).
          </p>
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type) => (
            <div
              key={type.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{type.name}</h3>
                    <span className="font-mono text-[10px] text-gray-400 font-semibold">{type.code}</span>
                  </div>
                  <Badge variant="purple" className="text-xs font-semibold">
                    {formatCurrency(type.baseRate)}/night
                  </Badge>
                </div>

                <div className="space-y-2 py-3 border-y border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Inventory Units:</span>
                    <span className="font-semibold text-gray-900">{type.totalRooms} rooms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Max Occupancy:</span>
                    <span className="font-semibold text-gray-900">{type.maxOccupancy} Guests</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Bedding:</span>
                    <span className="font-semibold text-gray-900">{type.bedding}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
