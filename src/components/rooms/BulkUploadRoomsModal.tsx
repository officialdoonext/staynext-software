'use client'

import React, { useState, useMemo } from 'react'
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Building2,
  DoorOpen,
  X,
  FileText,
  RefreshCw,
  PlusCircle,
  Check,
  Ban
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { PropertyItem } from '@/services/property.service'
import { RoomTypeItem } from '@/services/room.service'
import { BuildingItem, FloorItem } from '@/services/property.service'
import { bulkUploadRooms, BulkUploadRoomInput, BulkUploadResult } from '@/services/room.service'
import { formatCurrency } from '@/lib/utils'

interface BulkUploadRoomsModalProps {
  isOpen: boolean
  onClose: () => void
  properties: PropertyItem[]
  currentPropertyId: string
  existingRoomTypes: RoomTypeItem[]
  existingBuildings: BuildingItem[]
  existingFloors: FloorItem[]
  existingRoomNumbers: string[]
  onSuccess: () => void
}

const SAMPLE_CSV_CONTENT = `room_number,room_type,building,floor,base_rate,max_occupancy,bed_type,status,is_smoking
101,Deluxe King,Main Wing,1,2500,2,King Bed,available,false
102,Deluxe King,Main Wing,1,2500,2,King Bed,available,false
103,Executive Twin,Main Wing,1,3200,2,Twin Beds,available,false
104,Executive Twin,Main Wing,1,3200,2,Twin Beds,available,false
201,Royal Suite,Tower Block,2,5500,4,King Bed + Sofa,available,false
202,Royal Suite,Tower Block,2,5500,4,King Bed + Sofa,available,false
301,Presidential Suite,Tower Block,3,9500,4,Super King Bed,available,false`

export default function BulkUploadRoomsModal({
  isOpen,
  onClose,
  properties,
  currentPropertyId,
  existingRoomTypes,
  existingBuildings,
  existingFloors,
  existingRoomNumbers,
  onSuccess,
}: BulkUploadRoomsModalProps) {
  const [selectedPropId, setSelectedPropId] = useState(currentPropertyId)
  const [csvText, setCsvText] = useState('')
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste')
  const [fileName, setFileName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultReport, setResultReport] = useState<BulkUploadResult | null>(null)

  // Download sample CSV
  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'sample_hotel_rooms.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Load sample data into text box
  const handleLoadSample = () => {
    setCsvText(SAMPLE_CSV_CONTENT)
    setActiveTab('paste')
    setErrorMsg('')
    setResultReport(null)
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvText(content || '')
      setErrorMsg('')
      setResultReport(null)
    }
    reader.readAsText(file)
  }

  // Parse CSV text into row objects
  const parsedRows: BulkUploadRoomInput[] = useMemo(() => {
    if (!csvText.trim()) return []

    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return []

    // Helper to parse CSV line respecting quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let cur = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes
        } else if ((char === ',' || char === '\t') && !inQuotes) {
          result.push(cur.trim())
          cur = ''
        } else {
          cur += char
        }
      }
      result.push(cur.trim())
      return result
    }

    const headers = parseLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/[\s_-]+/g, '')
    )

    const findIndex = (aliases: string[]) => {
      return headers.findIndex((h) => aliases.includes(h))
    }

    const colRoomNum = findIndex(['roomnumber', 'roomno', 'room', 'roomnum', 'number'])
    const colRoomType = findIndex(['roomtype', 'type', 'category', 'roomcategory'])
    const colBuilding = findIndex(['building', 'block', 'wing', 'tower'])
    const colFloor = findIndex(['floor', 'floornumber', 'level'])
    const colRate = findIndex(['baserate', 'rate', 'price', 'baseprice'])
    const colOccupancy = findIndex(['maxoccupancy', 'occupancy', 'guests', 'capacity', 'adults'])
    const colBedType = findIndex(['bedtype', 'bed', 'beds'])
    const colStatus = findIndex(['status', 'roomstatus'])
    const colSmoking = findIndex(['issmoking', 'smoking', 'smokingallowed'])
    const colNotes = findIndex(['notes', 'description', 'remarks'])

    if (colRoomNum === -1 || colRoomType === -1) {
      return []
    }

    const rows: BulkUploadRoomInput[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i])
      if (values.length <= 1 && !values[0]) continue

      const roomNum = values[colRoomNum] || ''
      const roomType = values[colRoomType] || ''

      if (!roomNum || !roomType) continue

      const rawRate = colRate !== -1 ? parseFloat(values[colRate]?.replace(/[^\d.]/g, '') || '0') : 2500
      const rawOcc = colOccupancy !== -1 ? parseInt(values[colOccupancy]?.replace(/[^\d]/g, '') || '2', 10) : 2
      const isSmokingStr = colSmoking !== -1 ? (values[colSmoking] || '').toLowerCase() : 'false'
      const isSmoking = isSmokingStr === 'true' || isSmokingStr === 'yes' || isSmokingStr === '1'

      rows.push({
        room_number: roomNum,
        room_type: roomType,
        building: colBuilding !== -1 ? values[colBuilding] || 'Main Building' : 'Main Building',
        floor: colFloor !== -1 ? values[colFloor] || '1' : '1',
        base_rate: !isNaN(rawRate) && rawRate > 0 ? rawRate : 2500,
        max_occupancy: !isNaN(rawOcc) && rawOcc > 0 ? rawOcc : 2,
        bed_type: colBedType !== -1 ? values[colBedType] || 'King Bed' : 'King Bed',
        status: colStatus !== -1 ? values[colStatus] || 'available' : 'available',
        is_smoking: isSmoking,
        notes: colNotes !== -1 ? values[colNotes] || '' : '',
      })
    }

    return rows
  }, [csvText])

  // Cross-reference existing items vs new items to be created
  const analysis = useMemo(() => {
    const existingTypeNames = new Set(existingRoomTypes.map((t) => t.name.toLowerCase().trim()))
    const existingBldgNames = new Set(existingBuildings.map((b) => b.name.toLowerCase().trim()))
    const existingNumSet = new Set(existingRoomNumbers.map((n) => String(n).toLowerCase().trim()))

    const uniqueTypes = Array.from(new Set(parsedRows.map((r) => r.room_type.trim()))).filter(Boolean)
    const uniqueBuildings = Array.from(new Set(parsedRows.map((r) => r.building?.trim() || 'Main Building'))).filter(Boolean)
    const uniqueFloors = Array.from(new Set(parsedRows.map((r) => String(r.floor || '1').trim()))).filter(Boolean)

    const newTypes = uniqueTypes.filter((t) => !existingTypeNames.has(t.toLowerCase()))
    const newBuildings = uniqueBuildings.filter((b) => !existingBldgNames.has(b.toLowerCase()))

    const duplicateRooms: string[] = []
    const internalDuplicates: string[] = []
    const seen = new Set<string>()

    for (const r of parsedRows) {
      const lower = r.room_number.toLowerCase()
      if (seen.has(lower)) {
        internalDuplicates.push(r.room_number)
      } else {
        seen.add(lower)
      }

      if (existingNumSet.has(lower)) {
        duplicateRooms.push(r.room_number)
      }
    }

    return {
      totalRooms: parsedRows.length,
      uniqueTypesCount: uniqueTypes.length,
      newTypes,
      uniqueBuildingsCount: uniqueBuildings.length,
      newBuildings,
      uniqueFloorsCount: uniqueFloors.length,
      duplicateRooms,
      internalDuplicates,
      validRoomsToCreate: parsedRows.length - duplicateRooms.length - internalDuplicates.length,
    }
  }, [parsedRows, existingRoomTypes, existingBuildings, existingRoomNumbers])

  // Submit bulk upload
  const handleConfirmUpload = async () => {
    if (parsedRows.length === 0) return
    setIsSubmitting(true)
    setErrorMsg('')
    setResultReport(null)

    try {
      const res = await bulkUploadRooms(selectedPropId, parsedRows)
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to complete bulk upload.')
      } else {
        setResultReport(res)
        onSuccess()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during upload.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#5e2b9d]/10 flex items-center justify-center text-[#5e2b9d]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                Bulk Upload Hotel Rooms
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Import multiple rooms at once. Missing room types, wings, and floors are auto-created.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Result Banner if already completed */}
          {resultReport && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Bulk Upload Successfully Completed!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-emerald-900">
                <div className="bg-white/80 p-2 rounded border border-emerald-200">
                  <span className="text-gray-500 block text-[10px]">Rooms Created:</span>
                  <span className="font-bold text-base text-emerald-700">{resultReport.createdRoomsCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-emerald-200">
                  <span className="text-gray-500 block text-[10px]">New Room Types:</span>
                  <span className="font-bold text-base text-[#5e2b9d]">{resultReport.createdRoomTypesCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-emerald-200">
                  <span className="text-gray-500 block text-[10px]">New Buildings/Wings:</span>
                  <span className="font-bold text-base text-blue-700">{resultReport.createdBuildingsCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-emerald-200">
                  <span className="text-gray-500 block text-[10px]">QR Codes Generated:</span>
                  <span className="font-bold text-base text-amber-700">{resultReport.createdRoomsCount}</span>
                </div>
              </div>

              {resultReport.createdRoomTypes.length > 0 && (
                <div className="text-[11px] text-emerald-800 pt-1">
                  <strong>Auto-created Room Types:</strong> {resultReport.createdRoomTypes.join(', ')}
                </div>
              )}

              {resultReport.skippedDuplicates.length > 0 && (
                <div className="text-[11px] text-amber-800 pt-1">
                  <strong>Skipped (Already existed):</strong> Room {resultReport.skippedDuplicates.join(', ')}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={onClose}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-md cursor-pointer font-medium"
                >
                  Done &amp; View Rooms Inventory
                </Button>
              </div>
            </div>
          )}

          {/* Controls Bar: Property selector + Sample actions */}
          {!resultReport && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Target Property:</span>
                <select
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="h-8 px-2.5 text-xs rounded-md cursor-pointer border-gray-200 text-gray-700 hover:bg-white"
                  title="Download pre-formatted sample CSV file"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5 text-[#5e2b9d]" />
                  Download Sample CSV
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="h-8 px-2.5 text-xs rounded-md cursor-pointer border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd] font-medium"
                  title="Populate 7 sample rooms with 1-click"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Load Sample Data
                </Button>
              </div>
            </div>
          )}

          {/* Input Method Tabs */}
          {!resultReport && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`pb-2 px-3 text-xs font-medium cursor-pointer border-b-2 transition-colors ${
                    activeTab === 'paste'
                      ? 'border-[#5e2b9d] text-[#5e2b9d]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Paste CSV / Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`pb-2 px-3 text-xs font-medium cursor-pointer border-b-2 transition-colors ${
                    activeTab === 'file'
                      ? 'border-[#5e2b9d] text-[#5e2b9d]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Upload CSV File {fileName && `(${fileName})`}
                </button>
              </div>

              {activeTab === 'paste' ? (
                <div>
                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => {
                      setCsvText(e.target.value)
                      setErrorMsg('')
                    }}
                    placeholder={`room_number,room_type,building,floor,base_rate,max_occupancy,bed_type,status\n101,Deluxe King,Main Wing,1,2500,2,King Bed,available\n102,Executive Suite,Tower Block,2,4500,3,King Bed,available`}
                    className="w-full font-mono text-xs p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] bg-gray-50/50"
                  />
                  <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1">
                    <span>Columns: room_number, room_type, building, floor, base_rate, max_occupancy, bed_type, status</span>
                    {csvText && (
                      <button
                        onClick={() => setCsvText('')}
                        className="text-red-500 hover:underline cursor-pointer"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-md p-6 text-center hover:border-[#5e2b9d] transition-colors bg-gray-50/40">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">
                    Click to select or drag and drop your CSV file here
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Supports .csv or .txt files formatted with commas or tabs
                  </p>
                  <label className="mt-3 inline-block">
                    <span className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs">
                      Browse File
                    </span>
                    <input
                      type="file"
                      accept=".csv,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {fileName && (
                    <div className="mt-2 text-xs font-medium text-[#5e2b9d]">
                      Loaded: {fileName} ({parsedRows.length} rooms detected)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error notification */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Analysis & Detection Summary Badges */}
          {!resultReport && parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="h-4 w-4 text-[#5e2b9d]" />
                    <span className="text-gray-600 font-medium">Rooms:</span>
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{analysis.totalRooms}</span>
                </div>

                <div className="p-2.5 bg-purple-50/60 rounded-md border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#5e2b9d]" />
                    <span className="text-gray-600 font-medium">Room Types:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-sm">{analysis.uniqueTypesCount}</span>
                    {analysis.newTypes.length > 0 && (
                      <span className="text-[10px] text-[#5e2b9d] block font-medium">
                        +{analysis.newTypes.length} new
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/60 rounded-md border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600 font-medium">Wings/Blocks:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-sm">{analysis.uniqueBuildingsCount}</span>
                    {analysis.newBuildings.length > 0 && (
                      <span className="text-[10px] text-blue-600 block font-medium">
                        +{analysis.newBuildings.length} new
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/60 rounded-md border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-amber-600" />
                    <span className="text-gray-600 font-medium">Floors:</span>
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{analysis.uniqueFloorsCount}</span>
                </div>
              </div>

              {/* Informational notices on auto-created entities */}
              {analysis.newTypes.length > 0 && (
                <div className="p-2.5 bg-[#f7f2fd] border border-[#dfcef6] rounded-md text-[11px] text-[#4d2282] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#5e2b9d] shrink-0" />
                  <span>
                    <strong>Auto-generate Room Types:</strong> The following new categories will be created automatically: <strong>{analysis.newTypes.join(', ')}</strong>.
                  </span>
                </div>
              )}

              {analysis.newBuildings.length > 0 && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md text-[11px] text-blue-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Auto-generate Wings/Blocks:</strong> The following buildings will be created automatically: <strong>{analysis.newBuildings.join(', ')}</strong>.
                  </span>
                </div>
              )}

              {analysis.duplicateRooms.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Duplicate Warning:</strong> Room {analysis.duplicateRooms.join(', ')} already exists in this property and will be skipped to prevent duplicates.
                  </span>
                </div>
              )}

              {/* Parsed Preview Table */}
              <div className="border border-gray-200 rounded-md overflow-hidden shadow-2xs">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 font-semibold text-gray-700 flex items-center justify-between text-xs">
                  <span>Parsed Rooms Preview ({parsedRows.length})</span>
                  <span className="text-gray-500 font-normal text-[11px]">
                    Ready to create: <strong>{analysis.validRoomsToCreate}</strong>
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/60 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Room #</th>
                        <th className="py-2 px-3 font-semibold">Room Type</th>
                        <th className="py-2 px-3 font-semibold">Wing / Building</th>
                        <th className="py-2 px-3 font-semibold">Floor</th>
                        <th className="py-2 px-3 font-semibold">Base Rate</th>
                        <th className="py-2 px-3 font-semibold">Max Guests</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((r, idx) => {
                        const isDuplicate = analysis.duplicateRooms.includes(r.room_number)
                        const isNewType = analysis.newTypes.includes(r.room_type)
                        const isNewBldg = analysis.newBuildings.includes(r.building || '')

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-gray-50/80 transition-colors ${
                              isDuplicate ? 'bg-amber-50/40 text-amber-900' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                              <span>{r.room_number}</span>
                              {isDuplicate && (
                                <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300 py-0 px-1">
                                  Duplicate
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                <span>{r.room_type}</span>
                                {isNewType && (
                                  <span className="text-[9px] bg-purple-100 text-[#5e2b9d] px-1 py-0.2 rounded font-medium">
                                    New Type
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <span>{r.building || 'Main'}</span>
                                {isNewBldg && (
                                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-medium">
                                    New Wing
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              Floor {r.floor}
                            </td>
                            <td className="py-2 px-3 font-medium text-gray-900">
                              {formatCurrency(r.base_rate || 0)}
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              {r.max_occupancy} Guests
                            </td>
                            <td className="py-2 px-3">
                              <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize py-0 px-1.5 font-normal">
                                {r.status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!resultReport && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs rounded-md cursor-pointer border-gray-200"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={isSubmitting || parsedRows.length === 0 || analysis.validRoomsToCreate === 0}
              onClick={handleConfirmUpload}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md cursor-pointer font-medium px-4 h-9 shadow-2xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Creating Rooms &amp; QR Codes...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Confirm &amp; Import {analysis.validRoomsToCreate} Rooms
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

