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
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Tax Invoices & Receipts | StayNext' }

const invoices = [
  { id: 'inv-101', number: 'INV-2026-0891', date: '2026-11-11', guest: 'Sophia Montgomery', room: '201', subtotal: 3900.00, tax: 350.00, total: 4250.00, status: 'paid' },
  { id: 'inv-102', number: 'INV-2026-0892', date: '2026-11-11', guest: 'Liam Gallagher', room: '102', subtotal: 660.00, tax: 150.00, total: 810.00, status: 'partially_paid' },
  { id: 'inv-103', number: 'INV-2026-0893', date: '2026-11-10', guest: 'David Chen', room: '304', subtotal: 700.00, tax: 85.00, total: 785.00, status: 'paid' },
  { id: 'inv-104', number: 'INV-2026-0894', date: '2026-11-09', guest: 'Global Tech Consulting', room: 'Corporate Account', subtotal: 8200.00, tax: 740.00, total: 8940.00, status: 'issued' },
  { id: 'inv-105', number: 'INV-2026-0895', date: '2026-11-08', guest: 'Elena Rostova', room: '202', subtotal: 1250.00, tax: 150.00, total: 1400.00, status: 'issued' },
]

export default function InvoicesPage() {
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
        <Button variant="outline" size="sm" className="text-xs h-9">
          <Download className="h-4 w-4 mr-1.5" />
          Export Invoices CSV
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Bill To / Guest</TableHead>
              <TableHead>Room / Account</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Tax (VAT/GST)</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs font-bold text-indigo-600">{inv.number}</TableCell>
                <TableCell className="font-mono text-xs">{inv.date}</TableCell>
                <TableCell className="font-semibold text-gray-900 text-xs">{inv.guest}</TableCell>
                <TableCell className="text-xs text-gray-600">{inv.room}</TableCell>
                <TableCell className="font-mono text-xs">{formatCurrency(inv.subtotal)}</TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{formatCurrency(inv.tax)}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-gray-900">{formatCurrency(inv.total)}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partially_paid' ? 'warning' : 'outline'} className="text-[10px]">
                    {inv.status === 'paid' ? 'Paid in Full' : inv.status === 'partially_paid' ? 'Partial' : 'Issued'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print PDF
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
