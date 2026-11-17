'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  Search,
  Crown,
  Phone,
  Mail,
  MapPin,
  Star,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GuestItem, toggleGuestVip } from '@/services/crm.service'
import { formatCurrency, formatDate } from '@/lib/utils'

interface GuestsListClientProps {
  initialGuests: GuestItem[]
}

export default function GuestsListClient({ initialGuests }: GuestsListClientProps) {
  const [guests, setGuests] = useState<GuestItem[]>(initialGuests)
  const [searchTerm, setSearchTerm] = useState('')
  const [vipFilter, setVipFilter] = useState('all')

  const handleToggleVip = async (guestId: string, currentStatus: boolean) => {
    const res = await toggleGuestVip(guestId, !currentStatus)
    if (res.success) {
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId
            ? {
                ...g,
                is_vip: !currentStatus,
                vip_tier: !currentStatus ? 'Gold VIP' : 'Standard',
              }
            : g
        )
      )
    }
  }

  const filtered = guests.filter((g) => {
    const matchesSearch =
      searchTerm === '' ||
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesVip =
      vipFilter === 'all' ||
      (vipFilter === 'vip' && g.is_vip) ||
      (vipFilter === 'regular' && !g.is_vip)

    return matchesSearch && matchesVip
  })

  const exportCSV = () => {
    const headers = ['Guest Name', 'Email', 'Phone', 'Nationality', 'ID Type', 'ID Number', 'VIP Status', 'Total Stays', 'Lifetime Spend']
    const rows = filtered.map((g) => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.email}"`,
      `"${g.phone}"`,
      `"${g.nationality}"`,
      `"${g.id_type}"`,
      `"${g.id_number}"`,
      g.is_vip ? g.vip_tier : 'Standard',
      g.total_stays,
      g.total_spent,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `guests_directory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Guest CRM &amp; Loyalty Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete guest directory, VIP classifications, contact records, stay counts, and preferences.
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
            Export Guests
          </Button>

          <Link href="/guests/new">
            <Button size="sm" className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Guest Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-3 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by guest name, phone, email, Aadhaar / Passport #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <select
            value={vipFilter}
            onChange={(e) => setVipFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Guest Tiers</option>
            <option value="vip">VIP Guests Only</option>
            <option value="regular">Standard Guests</option>
          </select>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Guest Name</th>
              <th className="px-4 py-3">Contact Details</th>
              <th className="px-4 py-3">ID Document</th>
              <th className="px-4 py-3">VIP Tier</th>
              <th className="px-4 py-3">Stays &amp; Spend</th>
              <th className="px-4 py-3">Preferences</th>
              <th className="px-4 py-3 text-right">VIP Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No guests found</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Try resetting search filters or register a new guest.</div>
                </td>
              </tr>
            ) : (
              filtered.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 flex items-center gap-1.5">
                      {guest.name}
                      {guest.is_vip && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    <span className="text-[10px] text-gray-400">{guest.nationality}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{guest.phone}</div>
                    <div className="text-[10px] text-gray-400 truncate">{guest.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="capitalize">{guest.id_type}</div>
                    <div className="text-[10px] text-gray-400">{guest.id_number || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {guest.is_vip ? (
                      <Badge variant="purple" className="text-[10px] rounded-xs font-medium">
                        {guest.vip_tier}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] rounded-xs">
                        Standard
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium text-gray-900">{formatCurrency(guest.total_spent)}</div>
                    <div className="text-[10px] text-gray-400">{guest.total_stays} stays logged</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-[11px]">
                    <span className="line-clamp-1">{guest.preferences || 'No preferences'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVip(guest.id, guest.is_vip)}
                      className={`h-7 px-2 text-xs rounded-sm cursor-pointer ${
                        guest.is_vip
                          ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                          : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      {guest.is_vip ? 'Revoke VIP' : 'Make VIP'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

