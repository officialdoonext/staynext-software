'use client'

import React, { useState } from 'react'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Property {
  id: string
  name: string
  type: string
}

const defaultProperties: Property[] = [
  { id: 'all', name: 'All Properties', type: 'Overview' },
  { id: 'prop-1', name: 'Grand Horizon Resort & Spa', type: 'Resort' },
  { id: 'prop-2', name: 'City Center Business Hotel', type: 'Hotel' },
  { id: 'prop-3', name: 'Skyline Service Suites', type: 'Service Apartment' },
]

export default function PropertySelector() {
  const [selected, setSelected] = useState<Property>(defaultProperties[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-600">
          <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span className="max-w-[130px] sm:max-w-[180px] truncate text-left">
            {selected.name}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-gray-400 shrink-0 ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Select Active Property</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {defaultProperties.map((property) => (
          <DropdownMenuItem
            key={property.id}
            onClick={() => setSelected(property)}
            className="flex items-center justify-between py-2 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className={cn("text-xs font-medium", selected.id === property.id ? "text-indigo-600 font-semibold" : "text-gray-800")}>
                {property.name}
              </span>
              <span className="text-[10px] text-gray-400">{property.type}</span>
            </div>
            {selected.id === property.id && (
              <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

