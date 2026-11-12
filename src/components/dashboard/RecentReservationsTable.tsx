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
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReservationRow } from '@/services/dashboard.service'

interface RecentReservationsTableProps {
  reservations: ReservationRow[]
}

export default function RecentReservationsTable({ reservations }: RecentReservationsTableProps) {
  if (!reservations || reservations.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No reservations recorded yet.</p>
        <p className="text-xs text-gray-400 mt-1">Direct bookings, phone calls, and OTA reservations will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking ID</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Room Type</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                <Link href={`/reservations?id=${row.id}`} className="hover:underline">
                  {row.reservation_number}
                </Link>
              </TableCell>
              <TableCell className="font-medium text-gray-900">
                {row.guest_first_name} {row.guest_last_name}
              </TableCell>
              <TableCell className="text-xs text-gray-600">
                {row.room_type || 'Deluxe Room'}
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {formatDate(row.check_in_date)}
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {formatDate(row.check_out_date)}
              </TableCell>
              <TableCell className="text-xs font-semibold text-gray-900">
                {formatCurrency(row.total_amount)}
              </TableCell>
              <TableCell className="text-xs text-gray-500 capitalize">
                {row.booking_source?.replace('_', ' ') || 'Direct'}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    row.status === 'confirmed'
                      ? 'success'
                      : row.status === 'checked_in'
                      ? 'purple'
                      : row.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

