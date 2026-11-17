import React from 'react'
import { CreditCard, DollarSign, Receipt, FileText, Download, Plus, ArrowUpRight, CheckCircle2 } from 'lucide-react'
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

export const metadata = { title: 'Billing & Folios | StayNext' }

export default async function BillingPage() {
  const supabase = await createClient()

  let folios: any[] = []
  let todayCollected = 0
  let pendingBalance = 0

  try {
    const today = new Date().toISOString().split('T')[0]

    // 1. Fetch folios
    const { data: folioData } = await supabase
      .from('guest_folios')
      .select(`
        id,
        folio_number,
        total_charges,
        total_payments,
        balance,
        status,
        updated_at,
        reservations (
          reservation_number,
          guests (
            first_name,
            last_name
          )
        )
      `)
      .order('updated_at', { ascending: false })

    if (folioData) {
      folios = folioData.map((f: any) => ({
        id: f.id,
        folioNumber: f.folio_number,
        guest: `${f.reservations?.guests?.first_name || ''} ${f.reservations?.guests?.last_name || ''}`.trim() || 'Guest',
        room: '-',
        totalCharges: Number(f.total_charges || 0),
        totalPayments: Number(f.total_payments || 0),
        balance: Number(f.balance || 0),
        status: f.status,
        lastUpdated: f.updated_at?.split('T')[0] || today,
      }))
    }

    // 2. Metrics
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .gte('created_at', `${today}T00:00:00`)
      .eq('status', 'completed')

    todayCollected = (payments || []).reduce((acc: number, p: any) => acc + (p.amount || 0), 0)
    pendingBalance = folios.reduce((acc: number, f: any) => acc + (f.balance || 0), 0)
  } catch {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Billing, Invoices &amp; Folios
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Automated room charge posting, POS incidentals, payment gateways, tax calculation, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/billing/invoices">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <FileText className="h-4 w-4 mr-1.5" />
              Tax Invoices
            </Button>
          </Link>
          <Link href="/billing/payments">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Payment Records
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-semibold">Collected Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(todayCollected)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Real-time payments</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs font-semibold">Pending Balance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(pendingBalance)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Unsettled guest folios</p>
        </div>
      </div>

      {folios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Billing Folios Recorded</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Billing folios are automatically initiated upon guest check-in and reservation confirmation.
          </p>
        </div>
      ) : (
        /* Folio Table */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio Number</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Total Charges</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folios.map((folio) => (
                <TableRow key={folio.id}>
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {folio.folioNumber}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-gray-900">
                    {folio.guest}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-800">
                    {formatCurrency(folio.totalCharges)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-emerald-600">
                    {formatCurrency(folio.totalPayments)}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-rose-600">
                    {formatCurrency(folio.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={folio.status === 'settled' ? 'success' : 'warning'}>
                      {folio.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-gray-400">
                    {formatDate(folio.lastUpdated)}
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
