'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, Download, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoicePrintClientProps {
  invoice: any
}

export function InvoicePrintClient({ invoice }: InvoicePrintClientProps) {
  const property = invoice.properties || {}
  const guest = invoice.guests || {}
  const folio = invoice.guest_folios || {}
  const reservation = folio.reservations || {}
  const room = reservation.reservation_rooms?.[0]?.rooms?.room_number || '-'

  // Items from invoice or from folio
  const items: any[] =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            description: 'Room Accommodation & Services Charges',
            quantity: 1,
            unit_price: invoice.subtotal || invoice.total,
            total_price: invoice.subtotal || invoice.total,
          },
        ]

  const subtotal = Number(invoice.subtotal || 0)
  const taxAmount = Number(invoice.tax_amount || 0)
  const total = Number(invoice.total || 0)

  // Standard Indian 12% split: 6% CGST + 6% SGST
  const cgst = Number((taxAmount / 2).toFixed(2))
  const sgst = Number((taxAmount / 2).toFixed(2))

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top action bar (hidden in print) */}
      <div className="flex items-center justify-between print:hidden pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/billing/invoices">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
              Tax Invoice {invoice.invoice_number}
            </h1>
            <p className="text-xs text-gray-500">Official GST Compliance Document</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Tax Invoice Paper Sheet */}
      <div className="bg-white border border-gray-200 rounded-md p-8 sm:p-12 shadow-sm text-gray-900 print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#5e2b9d] font-sora">
                {property.name || 'StayNext Hotel & Suites'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 max-w-xs">
              {property.address || '108 Hospitality Boulevard'}
              <br />
              {property.city || 'Hyderabad'}, {property.state || 'Telangana'} {property.postal_code || '500081'}, {property.country || 'India'}
            </p>
            <div className="text-xs text-gray-600 mt-2 space-y-0.5">
              <p>Phone: {property.phone || '+91 40 2345 6789'}</p>
              <p>Email: {property.email || 'billing@staynext.com'}</p>
              <p className="font-medium text-[#5e2b9d]">
                GSTIN: {property.tax_id || '36AAACH7409R1ZZ'}
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right w-full sm:w-auto">
            <span className="inline-block px-3 py-1 bg-[#f7f2fd] text-[#5e2b9d] text-xs font-medium uppercase tracking-wider rounded-md border border-[#5e2b9d]/20 mb-2">
              Tax Invoice
            </span>
            <h2 className="text-lg font-mono font-medium text-gray-900">
              {invoice.invoice_number}
            </h2>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p>Date: {formatDate(invoice.issued_at || invoice.created_at)}</p>
              {invoice.due_date && <p>Due Date: {formatDate(invoice.due_date)}</p>}
              <div className="pt-1">
                <Badge
                  variant={invoice.status === 'paid' ? 'success' : 'warning'}
                  className="capitalize font-mono text-[11px]"
                >
                  Status: {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Guest & Stay Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-gray-200">
          <div>
            <span className="text-xs uppercase font-medium text-gray-400 tracking-wider">
              Billed To (Guest / Client):
            </span>
            <h3 className="text-sm font-medium text-gray-900 mt-1">
              {invoice.customer_name || (guest.first_name ? `${guest.first_name} ${guest.last_name}` : 'Registered Guest')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {guest.address || 'Guest Address on File'}
              {guest.city ? `, ${guest.city}` : ''}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Phone: {invoice.customer_phone || guest.phone || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Email: {invoice.customer_email || guest.email || 'N/A'}
            </p>
            {invoice.customer_gstin && (
              <p className="text-xs font-medium text-gray-700 mt-1">
                Guest GSTIN: {invoice.customer_gstin}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-xs uppercase font-medium text-gray-400 tracking-wider">
              Stay &amp; Folio Reference:
            </span>
            <div className="mt-1 space-y-1 text-xs text-gray-700">
              <p>
                Room Allocated: <strong className="text-gray-900">Room #{room}</strong>
              </p>
              {reservation.reservation_number && (
                <p>Booking ID: {reservation.reservation_number}</p>
              )}
              {reservation.check_in_date && (
                <p>
                  Stay: {reservation.check_in_date} to {reservation.check_out_date}
                </p>
              )}
              {folio.folio_number && <p>Folio: {folio.folio_number}</p>}
              <p>SAC Code: <span className="font-mono">996311</span> (Hotel Accommodation)</p>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 font-medium">#</th>
                <th className="py-2.5 font-medium">Service / Charge Description</th>
                <th className="py-2.5 font-medium text-center">SAC/HSN</th>
                <th className="py-2.5 font-medium text-right">Qty</th>
                <th className="py-2.5 font-medium text-right">Unit Price</th>
                <th className="py-2.5 font-medium text-right">Taxable Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-3 text-gray-400 font-mono">{index + 1}</td>
                  <td className="py-3 font-medium text-gray-900">
                    {item.description || item.title || 'Room Charge'}
                  </td>
                  <td className="py-3 text-center text-gray-500 font-mono">9963</td>
                  <td className="py-3 text-right text-gray-600">{item.quantity || 1}</td>
                  <td className="py-3 text-right font-mono text-gray-600">
                    {formatCurrency(item.unit_price || item.total_price || 0)}
                  </td>
                  <td className="py-3 text-right font-mono font-medium text-gray-900">
                    {formatCurrency(item.total_price || (item.quantity || 1) * (item.unit_price || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-gray-200 pt-6">
          <div className="text-xs text-gray-500 max-w-sm space-y-1">
            <p className="font-medium text-gray-700">Statutory Tax Breakup:</p>
            <p>• Central GST (CGST) @ 6%: {formatCurrency(cgst)}</p>
            <p>• State GST (SGST) @ 6%: {formatCurrency(sgst)}</p>
            <p className="pt-2 text-[11px] text-gray-400 italic">
              All taxes are levied as per Section 9 of the CGST/SGST Act 2017.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Taxable Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>CGST (6%):</span>
              <span className="font-mono">{formatCurrency(cgst)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>SGST (6%):</span>
              <span className="font-mono">{formatCurrency(sgst)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-900 border-t border-gray-200 pt-2">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-[#5e2b9d] text-base font-bold">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures & Footer */}
        <div className="grid grid-cols-2 gap-8 border-t border-gray-200 mt-12 pt-8 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-700">Guest Acknowledgement:</p>
            <p className="text-[11px] mt-1 text-gray-400">
              I agree that my liability for this bill is not waived and agree to be held personally liable.
            </p>
            <div className="mt-12 border-t border-dashed border-gray-300 pt-1 w-48 text-[11px]">
              Guest Signature
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <p className="font-medium text-gray-700">For {property.name || 'StayNext Hotel'}</p>
            <div className="mt-12 border-t border-dashed border-gray-300 pt-1 w-48 text-center text-[11px]">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

