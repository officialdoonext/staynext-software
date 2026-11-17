import React from 'react'
import { Plus, Search, Calendar, Filter, Download, Eye, CheckCircle, XCircle, CalendarX } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Reservations | StayNext' }

export default async function ReservationsPage() {
  const supabase = await createClient()

  let reservations: any[] = []
  try {
    const { data } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        check_in_date,
        check_out_date,
        num_adults,
        num_children,
        total_amount,
        paid_amount,
        status,
        booking_source,
        guests (
          first_name,
          last_name,
          email,
          phone
        ),
        room_types (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      reservations = data.map((res: any) => ({
        id: res.id,
        resNumber: res.reservation_number,
        guest: `${res.guests?.first_name || ''} ${res.guests?.last_name || ''}`.trim() || 'Guest',
        email: res.guests?.email || 'N/A',
        phone: res.guests?.phone || 'N/A',
        roomType: res.room_types?.name || 'Standard',
        roomNumber: '-',
        checkIn: res.check_in_date,
        checkOut: res.check_out_date,
        nights: Math.max(
          1,
          Math.round(
            (new Date(res.check_out_date).getTime() - new Date(res.check_in_date).getTime()) /
              86400000
          )
        ),
        adults: res.num_adults || 1,
        children: res.num_children || 0,
        total: Number(res.total_amount || 0),
        paid: Number(res.paid_amount || 0),
        status: res.status || 'pending',
        source: res.booking_source || 'Direct',
      }))
    }
  } catch {}

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>
      case 'checked_in':
        return <Badge variant="purple">Checked In</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'checked_out':
        return <Badge variant="secondary">Checked Out</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bookings &amp; Reservations
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage guest room reservations, direct bookings, OTA sync, check-ins, and payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reservations/calendar">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <Calendar className="h-4 w-4 mr-1.5" />
              Calendar View
            </Button>
          </Link>
          <Link href="/reservations/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CalendarX className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Reservations Yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Your property does not have any active or past reservations recorded in the database yet.
          </p>
          <div className="mt-6">
            <Link href="/reservations/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                Create First Reservation
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
                <button className="px-3 py-1.5 rounded-md bg-indigo-600 text-white font-semibold">
                  All Bookings ({reservations.length})
                </button>
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
                {reservations.map((res) => (
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
                      <p className="font-medium">
                        {formatDate(res.checkIn)} &rarr; {formatDate(res.checkOut)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {res.nights} nights &bull; {res.adults}A {res.children > 0 ? `${res.children}C` : ''}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{res.source}</TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-gray-900">{formatCurrency(res.total)}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        Paid: {formatCurrency(res.paid)}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(res.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/reservations?id=${res.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View details">
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
