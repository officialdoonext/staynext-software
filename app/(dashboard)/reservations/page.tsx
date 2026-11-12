import React from 'react'
import { Plus, Search, Calendar, Filter, Download, Eye, CheckCircle, XCircle } from 'lucide-react'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Reservations | StayNext' }

const demoReservations = [
  {
    id: 'res-101',
    resNumber: 'RES-9082-A',
    guest: 'Sophia Montgomery',
    email: 'sophia.m@example.com',
    phone: '+1 (555) 012-4932',
    roomType: 'Presidential Suite',
    roomNumber: '201',
    checkIn: '2026-11-10',
    checkOut: '2026-11-16',
    nights: 6,
    adults: 2,
    children: 1,
    total: 3900.00,
    paid: 3900.00,
    status: 'checked_in',
    source: 'Website',
  },
  {
    id: 'res-102',
    resNumber: 'RES-9083-B',
    guest: 'Liam Gallagher',
    email: 'liam.g@oasis.co.uk',
    phone: '+44 7911 123456',
    roomType: 'Deluxe King',
    roomNumber: '102',
    checkIn: '2026-11-11',
    checkOut: '2026-11-14',
    nights: 3,
    adults: 1,
    children: 0,
    total: 660.00,
    paid: 660.00,
    status: 'checked_in',
    source: 'OTA (Booking.com)',
  },
  {
    id: 'res-103',
    resNumber: 'RES-9084-C',
    guest: 'Elena Rostova',
    email: 'elena.rostova@travel.de',
    phone: '+49 151 2345678',
    roomType: 'Junior Suite',
    roomNumber: '202',
    checkIn: '2026-11-11',
    checkOut: '2026-11-15',
    nights: 4,
    adults: 2,
    children: 0,
    total: 1400.00,
    paid: 500.00,
    status: 'confirmed',
    source: 'Direct Booking',
  },
  {
    id: 'res-104',
    resNumber: 'RES-9085-D',
    guest: 'Lucas Meyer',
    email: 'lucas.m@enterprise.ch',
    phone: '+41 79 000 1122',
    roomType: 'Executive Double',
    roomNumber: '103',
    checkIn: '2026-11-12',
    checkOut: '2026-11-15',
    nights: 3,
    adults: 2,
    children: 2,
    total: 840.00,
    paid: 0.00,
    status: 'pending',
    source: 'Corporate Client',
  },
  {
    id: 'res-105',
    resNumber: 'RES-9086-E',
    guest: 'Victoria Sterling',
    email: 'v.sterling@consulting.com',
    phone: '+1 (415) 555-8900',
    roomType: 'Ocean Villa',
    roomNumber: '301',
    checkIn: '2026-11-15',
    checkOut: '2026-11-20',
    nights: 5,
    adults: 2,
    children: 0,
    total: 2600.00,
    paid: 2600.00,
    status: 'confirmed',
    source: 'Travel Agent',
  },
  {
    id: 'res-106',
    resNumber: 'RES-9087-F',
    guest: 'David Chen',
    email: 'david.chen@techcorp.io',
    phone: '+1 (206) 555-4321',
    roomType: 'Standard Queen',
    roomNumber: '304',
    checkIn: '2026-11-09',
    checkOut: '2026-11-13',
    nights: 4,
    adults: 1,
    children: 0,
    total: 700.00,
    paid: 700.00,
    status: 'checked_in',
    source: 'Walk-in',
  },
  {
    id: 'res-107',
    resNumber: 'RES-9088-G',
    guest: 'Amara Kalu',
    email: 'amara.k@invest.ng',
    phone: '+234 802 345 6789',
    roomType: 'Deluxe King',
    roomNumber: '101',
    checkIn: '2026-11-08',
    checkOut: '2026-11-10',
    nights: 2,
    adults: 2,
    children: 0,
    total: 440.00,
    paid: 440.00,
    status: 'checked_out',
    source: 'Website',
  },
]

export default function ReservationsPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in': return <Badge variant="purple">Checked In</Badge>
      case 'confirmed': return <Badge variant="success">Confirmed</Badge>
      case 'pending': return <Badge variant="warning">Pending Deposit</Badge>
      case 'checked_out': return <Badge variant="secondary">Checked Out</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Reservations Master Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage incoming arrivals, advance deposits, booking modifications, and channel bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9">
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Link href="/reservations/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              New Reservation
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
            <button className="px-3 py-1.5 rounded-md bg-indigo-600 text-white font-semibold">All Bookings</button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Confirmed (2)</button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Checked In (3)</button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Pending (1)</button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100">Checked Out (1)</button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search guest, ID, phone..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Guest Details</TableHead>
              <TableHead>Room &amp; Category</TableHead>
              <TableHead>Dates (Nights)</TableHead>
              <TableHead>Channel Source</TableHead>
              <TableHead>Financials</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoReservations.map((res) => (
              <TableRow key={res.id}>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">
                  {res.resNumber}
                </TableCell>
                <TableCell>
                  <p className="text-sm font-semibold text-gray-900">{res.guest}</p>
                  <p className="text-[11px] text-gray-500">{res.phone}</p>
                </TableCell>
                <TableCell>
                  <span className="font-mono px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold mr-1.5">
                    #{res.roomNumber}
                  </span>
                  <span className="text-xs text-gray-600">{res.roomType}</span>
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  <p className="font-medium">{formatDate(res.checkIn)} &rarr; {formatDate(res.checkOut)}</p>
                  <p className="text-[10px] text-gray-400">{res.nights} nights &bull; {res.adults}A {res.children > 0 ? `${res.children}C` : ''}</p>
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {res.source}
                </TableCell>
                <TableCell>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(res.total)}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Paid: {formatCurrency(res.paid)}</p>
                </TableCell>
                <TableCell>
                  {getStatusBadge(res.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View details">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                    {res.status === 'confirmed' && (
                      <Button size="sm" className="h-7 px-2 text-xs bg-indigo-600 text-white hover:bg-indigo-700">
                        Check-in
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

