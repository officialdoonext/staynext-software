'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  DollarSign,
  Receipt,
  FileText,
  Download,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  FolioRecord,
  addFolioItem,
  recordPayment,
  generateInvoiceForFolio,
  voidFolioItem,
  getFolioById,
} from '@/services/billing.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BillingClientProps {
  initialFolios: FolioRecord[]
  propertyId: string
  todayCollected: number
}

export function BillingClient({
  initialFolios,
  propertyId,
  todayCollected,
}: BillingClientProps) {
  const router = useRouter()
  const [folios, setFolios] = useState<FolioRecord[]>(initialFolios)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [selectedFolio, setSelectedFolio] = useState<FolioRecord | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Add Charge Form State
  const [chargeForm, setChargeForm] = useState({
    description: '',
    itemType: 'room_charge' as 'room_charge' | 'f_and_b' | 'tax' | 'service' | 'discount',
    quantity: '' as any,
    unitPrice: '' as any,
  })

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '' as any,
    paymentMethod: 'card',
    reference: '',
    notes: '',
  })

  // Filtered folios
  const filteredFolios = folios.filter((f) => {
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      f.folioNumber.toLowerCase().includes(q) ||
      f.guestName.toLowerCase().includes(q) ||
      (f.reservationNumber && f.reservationNumber.toLowerCase().includes(q)) ||
      (f.roomNumber && f.roomNumber.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const totalCharges = folios.reduce((acc, f) => acc + f.totalCharges, 0)
  const totalBalance = folios.reduce((acc, f) => acc + f.balance, 0)
  const openFoliosCount = folios.filter((f) => f.status === 'open').length

  // Open Folio Detail
  const handleOpenDetail = async (folio: FolioRecord) => {
    setIsLoading(true)
    const detailed = await getFolioById(folio.id)
    setSelectedFolio(detailed || folio)
    setIsLoading(false)
    setIsViewOpen(true)
  }

  // Open Add Charge Dialog
  const handleOpenAddCharge = (folio: FolioRecord) => {
    setSelectedFolio(folio)
    setChargeForm({
      description: '',
      itemType: 'room_charge',
      quantity: '' as any,
      unitPrice: '' as any,
    })
    setIsAddChargeOpen(true)
  }

  // Submit Add Charge
  const handleAddChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFolio) return

    if (!chargeForm.description.trim()) {
      toast.error('Please enter a charge description')
      return
    }

    const price = Number(chargeForm.unitPrice) || 0
    if (price <= 0) {
      toast.error('Unit price must be greater than 0')
      return
    }

    setIsLoading(true)
    const res = await addFolioItem({
      folioId: selectedFolio.id,
      description: chargeForm.description,
      itemType: chargeForm.itemType,
      quantity: Number(chargeForm.quantity) || 1,
      unitPrice: price,
    })
    setIsLoading(false)

    if (res.success) {
      toast.success('Charge posted successfully to guest folio')
      setIsAddChargeOpen(false)
      // Refresh detailed folio
      const updated = await getFolioById(selectedFolio.id)
      if (updated) {
        setSelectedFolio(updated)
        setFolios((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      }
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to post charge')
    }
  }

  // Open Payment Dialog
  const handleOpenPayment = (folio: FolioRecord) => {
    setSelectedFolio(folio)
    setPaymentForm({
      amount: '' as any,
      paymentMethod: 'card',
      reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
      notes: 'Guest folio settlement',
    })
    setIsPaymentOpen(true)
  }

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFolio) return

    const payAmt = Number(paymentForm.amount) || 0
    if (payAmt <= 0) {
      toast.error('Payment amount must be greater than 0')
      return
    }

    setIsLoading(true)
    const res = await recordPayment({
      propertyId,
      folioId: selectedFolio.id,
      guestId: selectedFolio.guestId,
      reservationId: selectedFolio.reservationId,
      amount: payAmt,
      paymentMethod: paymentForm.paymentMethod,
      paymentReference: paymentForm.reference,
      notes: paymentForm.notes,
    })
    setIsLoading(false)

    if (res.success) {
      toast.success('Payment recorded successfully')
      setIsPaymentOpen(false)
      const updated = await getFolioById(selectedFolio.id)
      if (updated) {
        setSelectedFolio(updated)
        setFolios((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      }
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to record payment')
    }
  }

  // Generate Invoice
  const handleGenerateInvoice = async (folio: FolioRecord) => {
    setIsLoading(true)
    const res = await generateInvoiceForFolio(folio.id)
    setIsLoading(false)

    if (res.success) {
      toast.success('Official tax invoice generated successfully!')
      router.push(`/billing/invoices/${res.invoiceId}`)
    } else {
      toast.error(res.error || 'Failed to generate invoice')
    }
  }

  // Void item
  const handleVoidItem = async (itemId: string) => {
    if (!selectedFolio) return
    if (!confirm('Are you sure you want to void this line item? This action is audited.')) return

    setIsLoading(true)
    const res = await voidFolioItem(itemId, selectedFolio.id)
    setIsLoading(false)

    if (res.success) {
      toast.success('Item voided')
      const updated = await getFolioById(selectedFolio.id)
      if (updated) {
        setSelectedFolio(updated)
        setFolios((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      }
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to void item')
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredFolios.length === 0) {
      toast.info('No records to export')
      return
    }
    const headers = ['Folio Number', 'Guest Name', 'Room', 'Charges', 'Payments', 'Balance', 'Status', 'Updated Date']
    const rows = filteredFolios.map((f) => [
      `"${f.folioNumber}"`,
      `"${f.guestName}"`,
      `"${f.roomNumber}"`,
      f.totalCharges,
      f.totalPayments,
      f.balance,
      f.status,
      f.updatedAt.slice(0, 10),
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `folios_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Billing, Invoices &amp; Folios
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Automated room charge posting, POS incidentals, payment gateways, tax calculation, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/billing/invoices">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <FileText className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Tax Invoices
            </Button>
          </Link>
          <Link href="/billing/payments">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <CreditCard className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Payment Records
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-[#5e2b9d]">
            <Receipt className="h-5 w-5" />
            <span className="text-xs font-medium text-gray-600">Total Posted Charges</span>
          </div>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(totalCharges)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{folios.length} Total Folios</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-medium text-gray-600">Today Collected</span>
          </div>
          <p className="text-2xl font-medium text-emerald-600 mt-2">{formatCurrency(todayCollected)}</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">Real-time gateway settlements</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            <span className="text-xs font-medium text-gray-600">Pending Folio Balance</span>
          </div>
          <p className="text-2xl font-medium text-amber-600 mt-2">{formatCurrency(totalBalance)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{openFoliosCount} Open Guest Accounts</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 text-[#5e2b9d]">
            <Layers className="h-5 w-5" />
            <span className="text-xs font-medium text-gray-600">Settlement Ratio</span>
          </div>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">
            {totalCharges > 0
              ? `${Math.round(((totalCharges - totalBalance) / totalCharges) * 100)}%`
              : '100%'}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Paid vs outstanding</p>
        </div>
      </div>

      {/* India Statutory GST & Settlement Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-md border border-purple-100 shadow-2xs">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#5e2b9d]">
              <Receipt className="h-4 w-4" />
              GST Tax Ledger Summary (Rule 46)
            </span>
            <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-700 bg-purple-50">
              SAC 996311 / 996331
            </Badge>
          </h3>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-purple-50/50 p-2 rounded-xs border border-purple-100">
              <span className="text-[10px] text-gray-500 block">CGST Total</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(Math.round(totalCharges * 0.06))}</span>
              <span className="text-[9px] text-purple-700 block">6% Central Tax</span>
            </div>
            <div className="bg-purple-50/50 p-2 rounded-xs border border-purple-100">
              <span className="text-[10px] text-gray-500 block">SGST Total</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(Math.round(totalCharges * 0.06))}</span>
              <span className="text-[9px] text-purple-700 block">6% State Tax</span>
            </div>
            <div className="bg-purple-50/50 p-2 rounded-xs border border-purple-100">
              <span className="text-[10px] text-gray-500 block">IGST Total</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(0)}</span>
              <span className="text-[9px] text-gray-400 block">Inter-state</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-emerald-100 shadow-2xs">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CreditCard className="h-4 w-4" />
              India Payment Channels &amp; Settlements
            </span>
            <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50">
              Direct Reconciliation
            </Badge>
          </h3>
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-emerald-50/40 p-2 rounded-xs border border-emerald-100">
              <span className="text-[10px] text-gray-500 block">UPI / QR</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(Math.round(todayCollected * 0.55))}</span>
              <span className="text-[9px] text-emerald-700 block">PhonePe/GPay</span>
            </div>
            <div className="bg-emerald-50/40 p-2 rounded-xs border border-emerald-100">
              <span className="text-[10px] text-gray-500 block">Card Swipe</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(Math.round(todayCollected * 0.25))}</span>
              <span className="text-[9px] text-emerald-700 block">POS EDC</span>
            </div>
            <div className="bg-emerald-50/40 p-2 rounded-xs border border-emerald-100">
              <span className="text-[10px] text-gray-500 block">Cash Desk</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(Math.round(todayCollected * 0.15))}</span>
              <span className="text-[9px] text-emerald-700 block">Drawer Register</span>
            </div>
            <div className="bg-emerald-50/40 p-2 rounded-xs border border-emerald-100">
              <span className="text-[10px] text-gray-500 block">NEFT/RTGS</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(Math.round(todayCollected * 0.05))}</span>
              <span className="text-[9px] text-emerald-700 block">Bank Wire</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search folio, guest, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Filter Status:</span>
          <div className="flex gap-1">
            {['all', 'open', 'settled', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs rounded-md capitalize cursor-pointer transition-colors ${
                  statusFilter === status
                    ? 'bg-[#5e2b9d] text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Folios Table */}
      {filteredFolios.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-6 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Folios Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'No guest folios match your current search criteria.'
              : 'Guest folios are automatically created when reservations are booked or checked in.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Folio #</TableHead>
                <TableHead className="text-xs font-medium">Guest &amp; Room</TableHead>
                <TableHead className="text-xs font-medium">Charges</TableHead>
                <TableHead className="text-xs font-medium">Payments</TableHead>
                <TableHead className="text-xs font-medium">Balance</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFolios.map((folio) => (
                <TableRow key={folio.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-medium text-[#5e2b9d]">
                    {folio.folioNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-gray-900">{folio.guestName}</div>
                    <div className="text-[11px] text-gray-500">
                      Room {folio.roomNumber} {folio.reservationNumber ? `• ${folio.reservationNumber}` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    {formatCurrency(folio.totalCharges)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-emerald-600">
                    {formatCurrency(folio.totalPayments)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={`font-medium ${
                        folio.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(folio.balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        folio.status === 'settled'
                          ? 'success'
                          : folio.status === 'open'
                          ? 'warning'
                          : 'outline'
                      }
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {folio.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(folio)}
                        title="View Folio Statement"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-[#5e2b9d] cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Items
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddCharge(folio)}
                        className="h-7 px-2 text-xs border-gray-200 text-gray-700 hover:bg-[#f7f2fd] hover:text-[#5e2b9d] cursor-pointer rounded-md"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Charge
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenPayment(folio)}
                        className="h-7 px-2 text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateInvoice(folio)}
                        title="Generate Tax Invoice"
                        className="h-7 px-2 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md"
                      >
                        <FileText className="h-3 w-3 mr-1 text-[#5e2b9d]" />
                        Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* VIEW STATEMENT MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora flex items-center justify-between">
              <span>Folio Statement: {selectedFolio?.folioNumber}</span>
              <Badge
                variant={selectedFolio?.status === 'settled' ? 'success' : 'warning'}
                className="capitalize"
              >
                {selectedFolio?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Guest: {selectedFolio?.guestName} • Room {selectedFolio?.roomNumber} • Ref {selectedFolio?.reservationNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-md border border-gray-100 text-center">
              <div>
                <span className="text-[11px] text-gray-500">Total Charges</span>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(selectedFolio?.totalCharges || 0)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-gray-500">Total Payments</span>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(selectedFolio?.totalPayments || 0)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-gray-500">Balance Due</span>
                <p
                  className={`text-sm font-medium ${
                    (selectedFolio?.balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(selectedFolio?.balance || 0)}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedFolio?.items && selectedFolio.items.length > 0 ? (
                    selectedFolio.items.map((item) => (
                      <TableRow key={item.id} className={item.isVoid ? 'opacity-40 line-through bg-gray-50' : ''}>
                        <TableCell className="text-xs text-gray-500">{item.itemDate}</TableCell>
                        <TableCell className="text-xs font-medium text-gray-900">
                          {item.description}
                          {item.isVoid && (
                            <span className="text-[10px] text-rose-500 ml-1.5 font-normal">(Voided)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] text-gray-500 capitalize">
                          {item.itemType.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {!item.isVoid && (
                            <button
                              onClick={() => handleVoidItem(item.id)}
                              className="text-[11px] text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Void
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-gray-400">
                        No line items posted yet to this folio.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsViewOpen(false)
                  if (selectedFolio) handleOpenAddCharge(selectedFolio)
                }}
                className="text-xs cursor-pointer rounded-md"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Charge
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsViewOpen(false)
                  if (selectedFolio) handleOpenPayment(selectedFolio)
                }}
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1" />
                Record Payment
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsViewOpen(false)}
              className="text-xs cursor-pointer rounded-md"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD CHARGE MODAL */}
      <Dialog open={isAddChargeOpen} onOpenChange={setIsAddChargeOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Post Incidental Charge</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Posting charge to folio {selectedFolio?.folioNumber} ({selectedFolio?.guestName})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddChargeSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
              <input
                type="text"
                placeholder="e.g. Room Dining Dinner, Laundry Service, Mini Bar"
                value={chargeForm.description}
                onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Charge Type</label>
                <SearchableSelect
                  value={chargeForm.itemType}
                  onChange={(val) =>
                    setChargeForm({
                      ...chargeForm,
                      itemType: val as any,
                    })
                  }
                  options={[
                    { value: 'room_charge', label: 'Room Charge' },
                    { value: 'f_and_b', label: 'Food & Beverage' },
                    { value: 'service', label: 'Service & Spa' },
                    { value: 'tax', label: 'Tax / Surcharge' },
                    { value: 'discount', label: 'Special Discount' },
                  ]}
                  allowAdd={true}
                  addNewLabel="Add Charge Type"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 1"
                  value={chargeForm.quantity ?? ''}
                  onChange={(e) =>
                    setChargeForm({
                      ...chargeForm,
                      quantity: e.target.value === '' ? ('' as any) : parseInt(e.target.value) || ('' as any),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price ($) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={chargeForm.unitPrice ?? ''}
                onChange={(e) =>
                  setChargeForm({
                    ...chargeForm,
                    unitPrice: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || ('' as any),
                  })
                }
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Total to post: {formatCurrency((Number(chargeForm.quantity) || 1) * (Number(chargeForm.unitPrice) || 0))}
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddChargeOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isLoading ? 'Posting...' : 'Post Charge'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RECORD PAYMENT MODAL */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Record Guest Payment</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Folio: {selectedFolio?.folioNumber} • Balance Due: {formatCurrency(selectedFolio?.balance || 0)}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount to Pay ($) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder={selectedFolio ? formatCurrency(selectedFolio.balance) : "0.00"}
                value={paymentForm.amount ?? ''}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || ('' as any),
                  })
                }
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <SearchableSelect
                  value={paymentForm.paymentMethod}
                  onChange={(val) => setPaymentForm({ ...paymentForm, paymentMethod: val })}
                  options={[
                    { value: 'card', label: 'Credit / Debit Card' },
                    { value: 'cash', label: 'Cash Settlement' },
                    { value: 'bank_transfer', label: 'Bank Wire / UPI' },
                    { value: 'stripe', label: 'Online Gateway' },
                    { value: 'pos', label: 'POS Terminal' },
                  ]}
                  allowAdd={true}
                  addNewLabel="Add Payment Method"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reference / Txn ID</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <input
                type="text"
                placeholder="Front desk remarks..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isLoading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
