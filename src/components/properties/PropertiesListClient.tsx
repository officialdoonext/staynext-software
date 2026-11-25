'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Settings,
  Edit,
  Eye,
  BedDouble,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PropertyItem, togglePropertyStatus, TenantPropertyStats } from '@/services/property.service'

interface PropertiesListClientProps {
  initialProperties: PropertyItem[]
  propertyStats?: TenantPropertyStats
}

export default function PropertiesListClient({ initialProperties, propertyStats }: PropertiesListClientProps) {
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsUpdating(id)
    try {
      const res = await togglePropertyStatus(id, !currentStatus)
      if (res.success) {
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
        )
      }
    } finally {
      setIsUpdating(null)
    }
  }

  const filtered = properties.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === 'all' || p.property_type.toLowerCase() === selectedType.toLowerCase()
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && p.is_active) ||
      (selectedStatus === 'inactive' && !p.is_active)

    return matchesSearch && matchesType && matchesStatus
  })

  const exportCSV = () => {
    const headers = ['Property Name', 'Type', 'City', 'Country', 'Phone', 'Email', 'Total Rooms', 'Occupied', 'Status']
    const rows = filtered.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.property_type,
      `"${p.city}"`,
      `"${p.country}"`,
      `"${p.phone || ''}"`,
      `"${p.email || ''}"`,
      p.total_rooms || 0,
      p.occupied_rooms || 0,
      p.is_active ? 'Active' : 'Inactive',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `staynext_properties_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Property Portfolio
            </h1>
            {propertyStats && (
              <Badge
                variant={propertyStats.canAdd ? 'outline' : 'warning'}
                className="text-[11px] rounded-sm font-mono px-2 py-0.5"
              >
                Allowed: {propertyStats.currentCount} / {propertyStats.allowedCount}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage your hotel branches, buildings, floors, facilities, and property settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="text-xs h-9 rounded-md cursor-pointer border-gray-200"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            Export CSV
          </Button>
          {propertyStats && !propertyStats.canAdd ? (
            <Button
              disabled
              title={`Your subscription plan allows a maximum of ${propertyStats.allowedCount} property(ies)`}
              className="bg-gray-100 text-gray-400 text-xs h-9 font-medium rounded-md cursor-not-allowed border border-gray-200"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Limit Reached ({propertyStats.allowedCount}/{propertyStats.allowedCount})
            </Button>
          ) : (
            <Link href="/properties/new">
              <Button className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Property
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by hotel name, address or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Property Types</option>
            <option value="hotel">Hotel</option>
            <option value="resort">Resort</option>
            <option value="lodge">Lodge</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">No properties match your filter</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter, or register a new property branch.
          </p>
          <div className="mt-5">
            <Link href="/properties/new">
              <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-xs rounded-md cursor-pointer">
                <Plus className="h-4 w-4 mr-1.5" />
                Register New Property
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Properties Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prop) => (
            <Card
              key={prop.id}
              className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#f7f2fd] rounded-md text-[#5e2b9d]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-gray-900 line-clamp-1">
                        {prop.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-500 capitalize">{prop.property_type}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] text-amber-600 font-medium">{prop.star_rating || 3} ★</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(prop.id, prop.is_active)}
                    disabled={isUpdating === prop.id}
                    className="cursor-pointer"
                    title={prop.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    <Badge variant={prop.is_active ? 'default' : 'secondary'} className="text-[10px] rounded-md cursor-pointer">
                      {prop.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-3.5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{prop.address || 'Address not set'}, {prop.city}</span>
                  </div>
                  {prop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{prop.phone}</span>
                    </div>
                  )}
                  {prop.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{prop.email}</span>
                    </div>
                  )}
                </div>

                {/* Room stats banner */}
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-md border border-gray-100 text-xs">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-[#5e2b9d]" />
                    <div>
                      <div className="text-[10px] text-gray-400">Total Rooms</div>
                      <div className="font-medium text-gray-900">{prop.total_rooms || 0} Rooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-[10px] text-gray-400">Occupied</div>
                      <div className="font-medium text-gray-900">{prop.occupied_rooms || 0} Active</div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px]">
                    Currency: <strong className="text-gray-700">{prop.currency}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/properties/${prop.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-[#5e2b9d] rounded-md cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                    </Link>
                    <Link href={`/properties/${prop.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] rounded-md cursor-pointer border-[#dfcef6]"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

