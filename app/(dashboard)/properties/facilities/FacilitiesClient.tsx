'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FacilityItem, PropertyItem, togglePropertyFacility } from '@/services/property.service'

interface FacilitiesClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  initialFacilities: FacilityItem[]
}

export default function FacilitiesClient({
  property: initialProp,
  properties,
  initialFacilities,
}: FacilitiesClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [facilities, setFacilities] = useState<FacilityItem[]>(initialFacilities)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleToggle = async (facilityId: string, currentStatus: boolean) => {
    setUpdatingId(facilityId)
    try {
      const res = await togglePropertyFacility(selectedPropertyId, facilityId, !currentStatus)
      if (res.success) {
        setFacilities((prev) =>
          prev.map((f) => (f.id === facilityId ? { ...f, is_available: !currentStatus } : f))
        )
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/properties">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Hotel Facilities &amp; Amenities
            </h1>
            <p className="text-xs text-gray-500">
              Configure services, fitness, dining, and pool amenities provided at your hotel.
            </p>
          </div>
        </div>

        {properties.length > 1 && (
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {facilities.map((fac) => (
          <Card
            key={fac.id}
            onClick={() => handleToggle(fac.id, !!fac.is_available)}
            className={`border rounded-md cursor-pointer transition-all ${
              fac.is_available
                ? 'border-[#dfcef6] bg-[#f7f2fd]/40 shadow-xs'
                : 'border-gray-200 opacity-60 hover:opacity-100'
            }`}
          >
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#5e2b9d]" />
                  {fac.name}
                </div>
                {fac.description && (
                  <div className="text-[10px] text-gray-500 line-clamp-2">{fac.description}</div>
                )}
                <span className="text-[9px] uppercase tracking-wider text-gray-400 block pt-1">
                  Category: {fac.category}
                </span>
              </div>
              <Badge
                variant={fac.is_available ? 'purple' : 'secondary'}
                className="text-[9px] rounded-sm shrink-0"
              >
                {fac.is_available ? 'Active' : 'Disabled'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

