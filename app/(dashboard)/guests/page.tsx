import React from 'react'
import { Plus, Search, Crown, Phone, Mail, MapPin, Star, MoreHorizontal, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Guests Directory | StayNext' }

const demoGuests = [
  {
    id: 'g-1',
    name: 'Sophia Montgomery',
    email: 'sophia.m@example.com',
    phone: '+1 (555) 012-4932',
    nationality: 'United States',
    isVip: true,
    vipTier: 'Diamond',
    totalStays: 8,
    totalSpent: 18450.00,
    currentRoom: '201',
    preferences: 'High floor, hypoallergenic pillows, sparkling water on arrival',
  },
  {
    id: 'g-2',
    name: 'Liam Gallagher',
    email: 'liam.g@oasis.co.uk',
    phone: '+44 7911 123456',
    nationality: 'United Kingdom',
    isVip: true,
    vipTier: 'Platinum',
    totalStays: 5,
    totalSpent: 8200.00,
    currentRoom: '102',
    preferences: 'Quiet room away from elevators, espresso pods restocked daily',
  },
  {
    id: 'g-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@travel.de',
    phone: '+49 151 2345678',
    nationality: 'Germany',
    isVip: false,
    vipTier: 'Standard',
    totalStays: 2,
    totalSpent: 2800.00,
    currentRoom: '202',
    preferences: 'Late checkout preferred when available',
  },
  {
    id: 'g-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@chicago.com',
    phone: '+1 (312) 555-9012',
    nationality: 'United States',
    isVip: true,
    vipTier: 'Gold',
    totalStays: 4,
    totalSpent: 5400.00,
    currentRoom: '201',
    preferences: 'Firm mattress, daily newspaper',
  },
  {
    id: 'g-5',
    name: 'David Chen',
    email: 'david.chen@techcorp.io',
    phone: '+1 (206) 555-4321',
    nationality: 'Canada',
    isVip: false,
    vipTier: 'Standard',
    totalStays: 1,
    totalSpent: 700.00,
    currentRoom: '304',
    preferences: 'High-speed WiFi credentials upon check-in',
  },
]

export default function GuestsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Guest CRM &amp; Profiles
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Guest histories, VIP loyalty tiers, personal preferences, spend metrics, and notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Total Registered Guests</span>
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">1,248</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">&uarr; 14% new guests this month</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">VIP Loyalty Members</span>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">142</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Diamond, Platinum &amp; Gold tiers</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Average Lifetime Value</span>
            <Star className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(3420)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Across 4.2 average stays</p>
        </div>
      </div>

      {/* Guest Directory Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">Guest Profiles</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Loyalty Status</TableHead>
              <TableHead>Total Stays</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Current Stay</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoGuests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs">
                      {guest.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{guest.name}</p>
                      {guest.isVip && (
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                          <Crown className="h-2.5 w-2.5" /> VIP {guest.vipTier}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  <p>{guest.email}</p>
                  <p className="text-gray-400">{guest.phone}</p>
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {guest.nationality}
                </TableCell>
                <TableCell>
                  <Badge variant={guest.isVip ? 'purple' : 'secondary'} className="text-[10px]">
                    {guest.vipTier}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-semibold text-gray-900">
                  {guest.totalStays} stays
                </TableCell>
                <TableCell className="text-xs font-bold text-gray-900">
                  {formatCurrency(guest.totalSpent)}
                </TableCell>
                <TableCell>
                  {guest.currentRoom ? (
                    <span className="font-mono text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">
                      Room #{guest.currentRoom}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not in house</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    View Profile
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

