'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Building2, Check, ChevronsUpDown, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Property {
  id: string
  name: string
  type: string
}

export default function PropertySelector() {
  const [properties, setProperties] = useState<Property[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<Property>({
    id: 'primary',
    name: 'Loading Property...',
    type: 'Hotel',
  })

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties
    const q = searchQuery.toLowerCase().trim()
    return properties.filter((p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
  }, [properties, searchQuery])

  useEffect(() => {
    async function loadProperties() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // 1. Fetch properties assigned to this tenant
        const { data, error } = await supabase
          .from('properties')
          .select('id, name, property_type')

        if (!error && data && data.length > 0) {
          const list: Property[] = data.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.property_type || 'Hotel',
          }))
          setProperties(list)
          setSelected(list[0])
          return
        }

        // Fallback to user metadata property name if database has no entries
        const propName = user?.user_metadata?.property_name || 'My Property'
        const defaultProp: Property = {
          id: 'primary',
          name: propName,
          type: 'Primary Property',
        }
        setProperties([defaultProp])
        setSelected(defaultProp)
      } catch {
        setSelected({
          id: 'primary',
          name: 'My Property',
          type: 'Hotel',
        })
      }
    }

    loadProperties()
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
        >
          <Building2 className="h-3.5 w-3.5 text-[#5e2b9d] shrink-0" />
          <span className="max-w-[130px] sm:max-w-[180px] truncate text-left font-medium">
            {selected.name}
          </span>
          {properties.length > 1 && (
            <ChevronsUpDown className="h-3 w-3 text-gray-400 shrink-0 ml-1" />
          )}
        </button>
      </DropdownMenuTrigger>
      {properties.length > 1 && (
        <DropdownMenuContent align="start" className="w-68 rounded-md p-1.5">
          <DropdownMenuLabel className="font-semibold text-xs px-2 py-1 text-gray-900">
            Select Active Property
          </DropdownMenuLabel>
          <div className="px-1.5 py-1">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full pl-8 pr-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] placeholder:text-gray-400"
              />
            </div>
          </div>
          <DropdownMenuSeparator className="my-1" />
          <div className="max-h-56 overflow-y-auto">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <DropdownMenuItem
                  key={property.id}
                  onClick={() => setSelected(property)}
                  className="flex items-center justify-between py-2 px-2.5 cursor-pointer rounded-md hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        selected.id === property.id
                          ? 'text-[#5e2b9d] font-semibold'
                          : 'text-gray-800'
                      )}
                    >
                      {property.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">{property.type}</span>
                  </div>
                  {selected.id === property.id && (
                    <Check className="h-3.5 w-3.5 text-[#5e2b9d] shrink-0" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">
                No matching properties
              </div>
            )}
          </div>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
