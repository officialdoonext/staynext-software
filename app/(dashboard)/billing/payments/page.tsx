import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, CreditCard, DollarSign, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Payment Transactions | StayNext' }

export default async function PaymentsPage() {
  const supabase = await createClient()

  let payments: any[] = []
  try {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      payments = data.map((p: any) => ({
        id: p.id,
        reference: p.transaction_reference || p.id.slice(0, 8),
        date: p.created_at?.split('T')[0] || '',
        guest: 'Guest Payment',
        method: p.payment_method || 'Credit Card',
        amount: Number(p.amount || 0),
        status: p.status || 'completed',
      }))
    }
  } catch {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/billing">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Payment Transactions
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live settlement ledger, payment gateway logs, card terminals, and cash deposits.
            </p>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Payment Records Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Payment transactions will automatically appear here as guests make deposits or settle bills.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((pay) => (
                <TableRow key={pay.id}>
                  <TableCell className="font-mono text-xs font-bold text-indigo-600">
                    {pay.reference}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(pay.date)}</TableCell>
                  <TableCell className="text-xs font-semibold capitalize">{pay.method}</TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600">
                    {formatCurrency(pay.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={pay.status === 'completed' ? 'success' : 'warning'}>
                      {pay.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
