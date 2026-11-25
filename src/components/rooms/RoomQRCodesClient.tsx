'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  QrCode,
  ArrowLeft,
  Printer,
  Download,
  RefreshCw,
  Ban,
  CheckCircle2,
  ExternalLink,
  Eye,
  Layers,
  Sparkles,
  Search,
  Loader2,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  RoomQRCodeItem,
  generateRoomQRCode,
  bulkGenerateRoomQRCodes,
  revokeRoomQRCode,
  incrementQRPrintCount
} from '@/services/qr.service'
import { PropertyItem } from '@/services/property.service'
import { formatDate } from '@/lib/utils'

interface RoomQRCodesClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  initialQRCodes: RoomQRCodeItem[]
}

type TemplateType = 'table_tent' | 'wall_sticker' | 'keycard' | 'directory_insert'
type PerPageLayout = 1 | 2 | 4 | 8

export default function RoomQRCodesClient({
  property: initialProp,
  properties,
  initialQRCodes,
}: RoomQRCodesClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [qrItems, setQrItems] = useState<RoomQRCodeItem[]>(initialQRCodes)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'missing' | 'revoked'>('all')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Preview Modal state
  const [previewItem, setPreviewItem] = useState<RoomQRCodeItem | null>(null)

  // Print Mode state
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [printLayout, setPrintLayout] = useState<PerPageLayout>(4)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('table_tent')
  const [selectedRoomIdsForPrint, setSelectedRoomIdsForPrint] = useState<string[]>([])

  // Analytics
  const totalRooms = qrItems.length
  const activeQRs = qrItems.filter((q) => q.is_active && q.token_hash).length
  const missingQRs = qrItems.filter((q) => !q.token_hash).length
  const revokedQRs = qrItems.filter((q) => q.token_hash && !q.is_active).length
  const totalScans = qrItems.reduce((acc, q) => acc + (q.scan_count || 0), 0)

  // Actions
  const handleGenerate = async (roomId: string) => {
    setLoadingAction(`gen-${roomId}`)
    try {
      const res = await generateRoomQRCode(selectedPropertyId, roomId)
      if (res.success && res.data) {
        setQrItems((prev) =>
          prev.map((item) =>
            item.room_id === roomId
              ? {
                  ...item,
                  ...res.data,
                  is_active: true,
                }
              : item
          )
        )
      }
    } finally {
      setLoadingAction(null)
    }
  }

  const handleBulkGenerate = async () => {
    setLoadingAction('bulk-gen')
    try {
      const res = await bulkGenerateRoomQRCodes(selectedPropertyId)
      if (res.success) {
        // Reload all QR codes
        window.location.reload()
      }
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRevoke = async (roomId: string) => {
    if (!confirm('Are you sure you want to revoke this QR code? Guests scanning it will be blocked.')) return
    setLoadingAction(`rev-${roomId}`)
    try {
      const res = await revokeRoomQRCode(roomId)
      if (res.success) {
        setQrItems((prev) =>
          prev.map((item) =>
            item.room_id === roomId ? { ...item, is_active: false } : item
          )
        )
      }
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDownloadPNG = (item: RoomQRCodeItem) => {
    if (!item.qr_code_data_url) return
    const link = document.createElement('a')
    link.href = item.qr_code_data_url
    link.download = `QR_Room_${item.room_number}_${initialProp.name.replace(/\s+/g, '_')}.png`
    link.click()
  }

  const handleDownloadSVG = (item: RoomQRCodeItem) => {
    if (!item.qr_code_svg) return
    const blob = new Blob([item.qr_code_svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `QR_Room_${item.room_number}_${initialProp.name.replace(/\s+/g, '_')}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  const triggerPrintSingle = (item: RoomQRCodeItem) => {
    setSelectedRoomIdsForPrint([item.room_id])
    setIsPrintMode(true)
    setTimeout(() => {
      window.print()
      incrementQRPrintCount(item.room_id)
    }, 400)
  }

  const triggerBulkPrint = () => {
    setSelectedRoomIdsForPrint(qrItems.filter((q) => q.is_active).map((q) => q.room_id))
    setIsPrintMode(true)
    setTimeout(() => {
      window.print()
    }, 400)
  }

  const filtered = qrItems.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.room_type_name && item.room_type_name.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = item.is_active && !!item.token_hash
    if (statusFilter === 'missing') matchesStatus = !item.token_hash
    if (statusFilter === 'revoked') matchesStatus = !!item.token_hash && !item.is_active

    return matchesSearch && matchesStatus
  })

  const printItems = qrItems.filter((q) =>
    (selectedRoomIdsForPrint.length === 0 || selectedRoomIdsForPrint.includes(q.room_id)) &&
    Boolean(q.qr_code_data_url && q.qr_code_data_url.trim() !== '')
  )

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Non-print UI */}
      <div className="print:hidden space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link href="/rooms">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-gray-900">
                Room QR Code Management &amp; Guest Self-Service
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Generate secure QR codes, download print stickers, track live scans, and preview guest experiences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerBulkPrint}
              disabled={activeQRs === 0}
              className="text-xs h-9 rounded-md cursor-pointer border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print Stickers Sheet
            </Button>

            <Button
              size="sm"
              onClick={handleBulkGenerate}
              disabled={loadingAction === 'bulk-gen'}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer"
            >
              {loadingAction === 'bulk-gen' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Generate All Missing QRs
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Analytics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <Card className="border-gray-200 rounded-md shadow-2xs">
            <CardContent className="pt-3.5">
              <div className="text-[10px] text-gray-400">Total Rooms</div>
              <div className="text-xl font-medium text-gray-900 mt-0.5">{totalRooms}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 rounded-md shadow-2xs">
            <CardContent className="pt-3.5">
              <div className="text-[10px] text-emerald-600 font-medium">Active QR Codes</div>
              <div className="text-xl font-medium text-emerald-600 mt-0.5">{activeQRs}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 rounded-md shadow-2xs">
            <CardContent className="pt-3.5">
              <div className="text-[10px] text-amber-600 font-medium">Not Generated</div>
              <div className="text-xl font-medium text-amber-600 mt-0.5">{missingQRs}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 rounded-md shadow-2xs">
            <CardContent className="pt-3.5">
              <div className="text-[10px] text-red-600 font-medium">Revoked / Inactive</div>
              <div className="text-xl font-medium text-red-600 mt-0.5">{revokedQRs}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 rounded-md shadow-2xs bg-[#f7f2fd]/30 border-[#dfcef6]">
            <CardContent className="pt-3.5">
              <div className="text-[10px] text-[#5e2b9d] font-medium">Total Guest Scans</div>
              <div className="text-xl font-medium text-[#5e2b9d] mt-0.5">{totalScans}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Template Selector Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-2xs items-center">
          <div className="sm:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search room number or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              <option value="all">All QR Statuses</option>
              <option value="active">Active Only</option>
              <option value="missing">Missing / Not Generated</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              <option value="table_tent">Template: Table Tent</option>
              <option value="wall_sticker">Template: Wall Sticker</option>
              <option value="keycard">Template: Keycard Pocket</option>
              <option value="directory_insert">Template: Directory Insert</option>
            </select>
          </div>

          <div>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(Number(e.target.value) as any)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              <option value={1}>1 Sticker / Page (Large A4)</option>
              <option value={2}>2 Stickers / Page (Half Sheet)</option>
              <option value={4}>4 Stickers / Page (Quarter A4)</option>
              <option value={8}>8 Stickers / Page (Compact Badges)</option>
            </select>
          </div>
        </div>

        {/* QR Codes Table */}
        <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
              <tr>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Floor &amp; Category</th>
                <th className="px-4 py-3">QR Status</th>
                <th className="px-4 py-3">Scan Analytics</th>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.room_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    Room {item.room_number}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{item.room_type_name}</div>
                    <div className="text-[10px] text-gray-400">{item.floor_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    {!item.token_hash ? (
                      <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200 rounded-sm">
                        Not Generated
                      </Badge>
                    ) : item.is_active ? (
                      <Badge variant="purple" className="text-[10px] rounded-sm">
                        Active &amp; Live
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] rounded-sm">
                        Revoked
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div><strong>{item.scan_count || 0}</strong> scans</div>
                    {item.last_scanned_at && (
                      <div className="text-[10px] text-gray-400">Last: {formatDate(item.last_scanned_at)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.qr_code_data_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="p-1 border border-gray-200 rounded-sm hover:border-[#5e2b9d] transition-all bg-white cursor-pointer"
                        title="Click to zoom preview"
                      >
                        <img
                          src={item.qr_code_data_url}
                          alt={`QR Room ${item.room_number}`}
                          className="h-9 w-9 object-contain"
                        />
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No QR</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.token_hash ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => triggerPrintSingle(item)}
                            className="h-7 px-2 text-xs text-gray-700 hover:text-[#5e2b9d] rounded-sm cursor-pointer"
                            title="Print Sticker"
                          >
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Print
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPNG(item)}
                            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-sm cursor-pointer"
                            title="Download PNG"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>

                          <a
                            href={item.guest_url}
                            target="_blank"
                            rel="noreferrer"
                            className="h-7 px-2 flex items-center text-xs text-[#5e2b9d] hover:bg-[#f7f2fd] rounded-sm cursor-pointer border border-[#dfcef6]"
                            title="Open Mobile Guest Application"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Test Experience
                          </a>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerate(item.room_id)}
                            disabled={loadingAction === `gen-${item.room_id}`}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-[#5e2b9d] rounded-sm cursor-pointer"
                            title="Regenerate QR"
                          >
                            <RefreshCw className={`h-3 w-3 ${loadingAction === `gen-${item.room_id}` ? 'animate-spin' : ''}`} />
                          </Button>

                          {item.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(item.room_id)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 rounded-sm cursor-pointer"
                              title="Revoke QR"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(item.room_id)}
                          disabled={loadingAction === `gen-${item.room_id}`}
                          className="bg-[#5e2b9d] text-white text-xs h-7 px-2.5 rounded-sm cursor-pointer font-medium"
                        >
                          {loadingAction === `gen-${item.room_id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <QrCode className="h-3 w-3 mr-1" />
                          )}
                          Generate QR
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-md max-w-sm w-full p-6 space-y-4 text-center shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">
                Room #{previewItem.room_number} QR Code
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-md inline-block shadow-2xs">
              {previewItem.qr_code_data_url ? (
                <img
                  src={previewItem.qr_code_data_url}
                  alt={`Room ${previewItem.room_number}`}
                  className="w-56 h-56 mx-auto object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded">
                  QR Not Generated
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-900">{initialProp.name}</div>
              <div className="text-xs text-gray-500">Scan to access Food, Housekeeping &amp; Services</div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadPNG(previewItem)}
                className="text-xs h-8 rounded-md cursor-pointer border-gray-200"
              >
                <Download className="h-3 w-3 mr-1" />
                PNG
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadSVG(previewItem)}
                className="text-xs h-8 rounded-md cursor-pointer border-gray-200"
              >
                <Download className="h-3 w-3 mr-1" />
                SVG
              </Button>
              <Button
                size="sm"
                onClick={() => triggerPrintSingle(previewItem)}
                className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
              >
                <Printer className="h-3 w-3 mr-1" />
                Print Sticker
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY TEMPLATES CONTAINER */}
      <div className={`hidden print:block w-full ${isPrintMode ? 'block' : ''}`}>
        <div
          className={`grid gap-6 p-4 ${
            printLayout === 1
              ? 'grid-cols-1'
              : printLayout === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : printLayout === 4
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {printItems.map((item) => (
            <div
              key={item.room_id}
              className="border-2 border-gray-800 rounded-lg p-6 flex flex-col items-center justify-between text-center bg-white page-break-inside-avoid"
            >
              {/* Template: Table Tent */}
              {selectedTemplate === 'table_tent' && (
                <>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                      Welcome to
                    </div>
                    <div className="text-base font-bold text-gray-900">{initialProp.name}</div>
                    <div className="inline-block bg-[#5e2b9d] text-white text-xs font-semibold px-3 py-0.5 rounded-full mt-1">
                      ROOM {item.room_number}
                    </div>
                  </div>

                  <div className="my-4 p-2 bg-white border border-gray-300 rounded-md">
                    {item.qr_code_data_url ? (
                      <img
                        src={item.qr_code_data_url}
                        alt={`QR Room ${item.room_number}`}
                        className="w-40 h-40 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                        No QR Code
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-900">
                      Scan with Phone Camera
                    </div>
                    <div className="text-[10px] text-gray-600 max-w-[220px]">
                      Order In-Room Dining, Request Towels, Water, Laundry &amp; Express Checkout
                    </div>
                    <div className="text-[9px] text-gray-400 pt-1">
                      No App Download Required
                    </div>
                  </div>
                </>
              )}

              {/* Template: Wall Sticker */}
              {selectedTemplate === 'wall_sticker' && (
                <>
                  <div className="flex items-center justify-between w-full pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-[#5e2b9d]">{initialProp.name}</span>
                    <span className="text-xs font-bold text-gray-900">ROOM {item.room_number}</span>
                  </div>

                  <div className="my-3">
                    {item.qr_code_data_url ? (
                      <img
                        src={item.qr_code_data_url}
                        alt={`QR Room ${item.room_number}`}
                        className="w-36 h-36 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-xs text-gray-400 bg-gray-50 mx-auto">
                        No QR Code
                      </div>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-gray-800">
                    Scan for In-Room Guest Services
                  </div>
                </>
              )}

              {/* Template: Keycard Holder */}
              {selectedTemplate === 'keycard' && (
                <>
                  <div className="text-xs font-bold text-[#5e2b9d]">{initialProp.name}</div>
                  <div className="text-sm font-bold text-gray-900 my-1">Room {item.room_number}</div>
                  {item.qr_code_data_url ? (
                    <img
                      src={item.qr_code_data_url}
                      alt={`QR Room ${item.room_number}`}
                      className="w-28 h-28 object-contain my-2"
                    />
                  ) : (
                    <div className="w-28 h-28 flex items-center justify-center text-xs text-gray-400 bg-gray-50 my-2 mx-auto">
                      No QR Code
                    </div>
                  )}
                  <div className="text-[10px] text-gray-600">Scan for 24/7 Digital Concierge</div>
                </>
              )}

              {/* Template: Directory Insert */}
              {selectedTemplate === 'directory_insert' && (
                <div className="text-left w-full space-y-3">
                  <div className="border-b border-gray-200 pb-2 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{initialProp.name}</div>
                      <div className="text-xs text-gray-500">In-Room Guest Directory</div>
                    </div>
                    <div className="text-sm font-bold bg-gray-100 px-2 py-1 rounded">
                      Room {item.room_number}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.qr_code_data_url ? (
                      <img
                        src={item.qr_code_data_url}
                        alt={`QR Room ${item.room_number}`}
                        className="w-28 h-28 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center text-xs text-gray-400 bg-gray-50 shrink-0">
                        No QR Code
                      </div>
                    )}
                    <div className="text-xs space-y-1 text-gray-700">
                      <div><strong>🍽 In-Room Dining:</strong> Breakfast, Lunch &amp; Dinner</div>
                      <div><strong>✨ Housekeeping:</strong> Linen &amp; Towels Refresh</div>
                      <div><strong>🔧 Assistance:</strong> AC, Hot Water, WiFi Help</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

