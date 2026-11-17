import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, Printer, CheckCircle, Clock } from 'lucide-react'
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

export const metadata = { title: 'Tax Invoices & Receipts | StayNext' }

export default async function InvoicesPage() {
  const supabase = await createClient()

  let invoices: any[] = []
  try {
    const { data } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        tax_amount,
        status,
        created_at,
        guest_folios (
          reservations (
            guests (
              first_name,
              last_name
            )
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      invoices = data.map((inv: any) => ({
        id: inv.id,
        number: inv.invoice_number,
        date: inv.created_at?.split('T')[0] || '',
        guest: `${inv.guest_folios?.reservations?.guests?.first_name || ''} ${inv.guest_folios?.reservations?.guests?.last_name || ''}`.trim() || 'Guest',
        tax: Number(inv.tax_amount || 0),
        total: Number(inv.total_amount || 0),
        status: inv.status,
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
              Invoices &amp; Tax Documents
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Official guest tax invoices, corporate VAT statements, and receipt PDF downloads.
            </p>
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Invoices Issued</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Tax invoices will be generated when folios are settled or upon guest checkout.
          </p>
        </div>
      ) : (
        /* Invoices Table */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Tax Amount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs font-bold text-indigo-600">
                    {inv.number}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(inv.date)}</TableCell>
                  <TableCell className="text-sm font-semibold text-gray-900">{inv.guest}</TableCell>
                  <TableCell className="text-xs text-gray-600">{formatCurrency(inv.tax)}</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900">{formatCurrency(inv.total)}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                      {inv.status}
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
