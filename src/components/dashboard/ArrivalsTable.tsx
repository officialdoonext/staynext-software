'use client'

import React from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { ReservationRow } from '@/services/dashboard.service'
import { CheckCircle2, Phone, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface ArrivalsTableProps {
  arrivals: ReservationRow[]
}

export default function ArrivalsTable({ arrivals }: ArrivalsTableProps) {
  const handleCheckIn = (resNumber: string) => {
    toast.success(`Guest check-in initiated for ${resNumber}`)
  }

  const handleContactGuest = (phone?: string) => {
    if (phone) {
      toast.info(`Calling guest: ${phone}`)
    } else {
      toast.error('No contact number available for this guest.')
    }
  }

  if (!arrivals || arrivals.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No arrivals scheduled for today.</p>
        <p className="text-xs text-gray-400 mt-1">Walk-ins and new confirmed reservations will appear here.</p>
        <div className="mt-4">
          <Link href="/reservations/new">
            <Button size="sm" variant="outline">
              Create Reservation
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking ID</TableHead>
            <TableHead>Guest Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Room Type</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {arrivals.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                <Link href={`/reservations?id=${row.id}`} className="hover:underline">
                  {row.reservation_number}
                </Link>
              </TableCell>
              <TableCell className="font-medium text-gray-900">
                {row.guest_first_name} {row.guest_last_name}
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {row.guest_phone || '—'}
              </TableCell>
              <TableCell className="font-medium">
                {row.room_number ? (
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-800 font-mono">
                    #{row.room_number}
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-gray-600">
                {row.room_type || 'Standard'}
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {row.check_in_time || '14:00'}
              </TableCell>
              <TableCell className="text-xs text-gray-600">
                {row.adults}A {row.children > 0 ? `${row.children}C` : ''}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.status === 'confirmed'
                      ? 'success'
                      : row.status === 'checked_in'
                      ? 'purple'
                      : 'warning'
                  }
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.payment_status === 'paid'
                      ? 'success'
                      : row.payment_status === 'partial'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {row.payment_status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="View Booking"
                    asChild
                  >
                    <Link href={`/reservations?id=${row.id}`}>
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Contact Guest"
                    onClick={() => handleContactGuest(row.guest_phone)}
                  >
                    <Phone className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleCheckIn(row.reservation_number)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Check-in
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

