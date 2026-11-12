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
import { LogOut, Eye, Receipt } from 'lucide-react'
import { toast } from 'sonner'

interface DeparturesTableProps {
  departures: ReservationRow[]
}

export default function DeparturesTable({ departures }: DeparturesTableProps) {
  const handleProcessCheckout = (resNumber: string) => {
    toast.success(`Checkout process initiated for ${resNumber}`)
  }

  if (!departures || departures.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No departures scheduled for today.</p>
        <p className="text-xs text-gray-400 mt-1">Guests scheduled to leave today will appear here.</p>
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
            <TableHead>Room</TableHead>
            <TableHead>Expected Check-out</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Outstanding Balance</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departures.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                <Link href={`/reservations?id=${row.id}`} className="hover:underline">
                  {row.reservation_number}
                </Link>
              </TableCell>
              <TableCell className="font-medium text-gray-900">
                {row.guest_first_name} {row.guest_last_name}
              </TableCell>
              <TableCell className="font-medium">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-800 font-mono">
                  #{row.room_number || '101'}
                </span>
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {row.check_out_time || '11:00 AM'}
              </TableCell>
              <TableCell className="text-xs font-medium text-gray-900">
                {formatCurrency(row.total_amount)}
              </TableCell>
              <TableCell className="text-xs font-semibold">
                {(row.outstanding_balance ?? 0) > 0 ? (
                  <span className="text-rose-600 font-bold">
                    {formatCurrency(row.outstanding_balance ?? 0)}
                  </span>
                ) : (
                  <span className="text-emerald-600">Paid ($0.00)</span>
                )}
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
                    title="View Guest Folio"
                    asChild
                  >
                    <Link href={`/billing?reservation=${row.id}`}>
                      <Receipt className="h-4 w-4 text-gray-500" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => handleProcessCheckout(row.reservation_number)}
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1" />
                    Checkout
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

