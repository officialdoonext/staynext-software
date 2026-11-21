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
import { GuestItem, toggleGuestVip, toggleGuestBlacklist } from '@/services/crm.service'
import { formatCurrency, formatDate } from '@/lib/utils'

interface GuestsListClientProps {
  initialGuests: GuestItem[]
}

export default function GuestsListClient({ initialGuests }: GuestsListClientProps) {
  const [guests, setGuests] = useState<GuestItem[]>(initialGuests)
  const [searchTerm, setSearchTerm] = useState('')
  const [vipFilter, setVipFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

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

  const handleToggleBlacklist = async (guestId: string, currentStatus?: boolean, guestName?: string) => {
    if (currentStatus) {
      if (!confirm(`Are you sure you want to remove ${guestName || 'this guest'} from the blacklist?`)) return
      const res = await toggleGuestBlacklist(guestId, false)
      if (res.success) {
        setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, is_blacklisted: false, blacklist_reason: '' } : g)))
      }
    } else {
      const reason = prompt(`Enter reason for blacklisting ${guestName || 'this guest'}:`, 'Security / behavioral incident flagged by management')
      if (reason === null) return
      const res = await toggleGuestBlacklist(guestId, true, reason)
      if (res.success) {
        setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, is_blacklisted: true, blacklist_reason: reason } : g)))
      }
    }
  }

  const filtered = guests.filter((g) => {
    const matchesSearch =
      searchTerm === '' ||
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.guest_code && g.guest_code.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesVip =
      vipFilter === 'all' ||
      (vipFilter === 'vip' && g.is_vip) ||
      (vipFilter === 'regular' && !g.is_vip)

    const matchesCat =
      categoryFilter === 'all' ||
      (categoryFilter === 'indian' && (!g.guest_category || g.guest_category.toLowerCase() === 'indian')) ||
      (categoryFilter === 'foreign' && g.guest_category?.toLowerCase() === 'foreign') ||
      (categoryFilter === 'oci' && g.guest_category?.toLowerCase() === 'oci')

    return matchesSearch && matchesVip && matchesCat
  })

  const exportCSV = () => {
    const headers = ['Guest ID', 'Category', 'Guest Name', 'Email', 'Phone', 'WhatsApp', 'Nationality', 'ID Type', 'ID Number', 'State', 'Company', 'GSTIN', 'VIP Status', 'Total Stays', 'Lifetime Spend', 'Blacklisted']
    const rows = filtered.map((g) => [
      `"${g.guest_code || ''}"`,
      `"${g.guest_category || 'Indian'}"`,
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.email}"`,
      `"${g.phone}"`,
      `"${g.whatsapp_number || g.phone}"`,
      `"${g.nationality}"`,
      `"${g.id_type}"`,
      `"${g.id_number}"`,
      `"${g.state || ''}"`,
      `"${g.company_name || ''}"`,
      `"${g.company_gstin || ''}"`,
      g.is_vip ? g.vip_tier : 'Standard',
      g.total_stays,
      g.total_spent,
      g.is_blacklisted ? `Yes - ${g.blacklist_reason}` : 'No',
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
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-3 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, GST code, mobile, Aadhaar / Passport #, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="indian">Indian Residents</option>
            <option value="foreign">Foreign Nationals (Form III)</option>
            <option value="oci">OCI Cardholders</option>
          </select>
        </div>

        <div>
          <select
            value={vipFilter}
            onChange={(e) => setVipFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
          >
            <option value="all">All Loyalty Tiers</option>
            <option value="vip">VIP Guests Only</option>
            <option value="regular">Standard Guests</option>
          </select>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[950px]">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Guest ID &amp; Category</th>
              <th className="px-4 py-3">Guest Name &amp; VIP</th>
              <th className="px-4 py-3">Contact Details</th>
              <th className="px-4 py-3">Identity Document</th>
              <th className="px-4 py-3">Origin / Location</th>
              <th className="px-4 py-3">Corporate / GSTIN</th>
              <th className="px-4 py-3">Stays &amp; Spend</th>
              <th className="px-4 py-3">Guest Status</th>
              <th className="px-4 py-3 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="font-medium text-gray-800 text-xs">No guests found</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Try resetting search filters or register a new guest.</div>
                </td>
              </tr>
            ) : (
              filtered.map((guest) => (
                <tr key={guest.id} className={`hover:bg-gray-50 transition-colors ${guest.is_blacklisted ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-gray-900 block">
                      {guest.guest_code}
                    </span>
                    <Badge variant="outline" className={`text-[9px] mt-0.5 px-1.5 py-0 ${
                      guest.guest_category?.toLowerCase() === 'foreign'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : guest.guest_category?.toLowerCase() === 'oci'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {guest.guest_category || 'Indian'}
                    </Badge>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 flex items-center gap-1.5">
                      {guest.name}
                      {guest.is_vip && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    {guest.is_vip ? (
                      <span className="text-[10px] text-amber-700 font-medium">{guest.vip_tier}</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Standard Tier</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>{guest.phone}</span>
                      {guest.whatsapp_number && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded-xs font-medium">WA</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{guest.email}</div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    <div className="capitalize font-medium text-gray-800 text-[11px]">{guest.id_type}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{guest.id_number || 'N/A'}</div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    <div>{guest.city ? `${guest.city}, ${guest.state || guest.country}` : guest.country || 'India'}</div>
                    <div className="text-[10px] text-gray-400">{guest.nationality}</div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {guest.company_name ? (
                      <div>
                        <div className="font-medium text-gray-900 truncate max-w-[120px]">{guest.company_name}</div>
                        {guest.company_gstin && (
                          <span className="font-mono text-[9px] text-purple-700 bg-purple-50 px-1 rounded-xs">
                            {guest.company_gstin}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">Retail / Direct</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-semibold text-gray-900">{formatCurrency(guest.total_spent)}</div>
                    <div className="text-[10px] text-gray-400">{guest.total_stays} stays logged</div>
                  </td>

                  <td className="px-4 py-3">
                    {guest.is_blacklisted ? (
                      <div>
                        <Badge variant="destructive" className="text-[9px] rounded-xs font-medium">
                          Blacklisted
                        </Badge>
                        {guest.blacklist_reason && (
                          <div className="text-[9px] text-red-600 truncate max-w-[120px] mt-0.5" title={guest.blacklist_reason}>
                            {guest.blacklist_reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] rounded-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                        Active &bull; Good Standing
                      </Badge>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleVip(guest.id, guest.is_vip)}
                        className={`h-7 px-2 text-[10px] rounded-sm cursor-pointer ${
                          guest.is_vip
                            ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                            : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                        title="Toggle VIP classification"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        {guest.is_vip ? 'Revoke' : 'VIP'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleBlacklist(guest.id, guest.is_blacklisted, guest.name)}
                        className={`h-7 px-1.5 text-[10px] rounded-sm cursor-pointer ${
                          guest.is_blacklisted
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={guest.is_blacklisted ? 'Remove Blacklist' : 'Flag / Blacklist'}
                      >
                        {guest.is_blacklisted ? 'Unblock' : 'Flag'}
                      </Button>
                    </div>
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

