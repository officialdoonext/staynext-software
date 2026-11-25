'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Building,
  CheckCircle2,
  AlertTriangle,
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
import { formatCurrency } from '@/lib/utils'
import { RoomTypeOccupancyData } from '@/services/report.service'
import { toast } from 'sonner'

interface OccupancyReportClientProps {
  data: RoomTypeOccupancyData[]
  propertyId: string
}

export function OccupancyReportClient({ data, propertyId }: OccupancyReportClientProps) {
  const totalRooms = data.reduce((sum, d) => sum + d.totalRooms, 0)
  const totalOccupied = data.reduce((sum, d) => sum + d.occupiedRooms, 0)
  const totalAvailable = data.reduce((sum, d) => sum + d.availableRooms, 0)
  const totalMaint = data.reduce((sum, d) => sum + d.maintenanceRooms, 0)
  const overallOccupancy = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0

  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.info('No data to export')
      return
    }
    const headers = ['Room Type', 'Total Rooms', 'Occupied', 'Available / Clean', 'Maintenance / OOO', 'Occupancy %', 'Base Rate']
    const rows = data.map((d) => [
      `"${d.roomTypeName}"`,
      d.totalRooms,
      d.occupiedRooms,
      d.availableRooms,
      d.maintenanceRooms,
      `${d.occupancyPercent}%`,
      d.basePrice,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `occupancy_yield_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Occupancy CSV exported')
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Room Occupancy &amp; Inventory Yield
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Sellable inventory utilization, room-category turnover, and maintenance hold analysis.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Overall Occupancy</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2 font-mono">
            {overallOccupancy}%
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Live property utilization</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Total Sellable Rooms</span>
          <p className="text-2xl font-medium text-gray-900 mt-2 font-mono">{totalRooms}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Total property capacity</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Occupied In-House</span>
          <p className="text-2xl font-medium text-emerald-600 mt-2 font-mono">{totalOccupied}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Checked-in guest rooms</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Available / Clean</span>
          <p className="text-2xl font-medium text-blue-600 mt-2 font-mono">{totalAvailable}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Ready for arrival</p>
        </div>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Building className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Room Types Defined</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Configure room types (Deluxe, Suite, Standard) and rooms in Property Management to view yield metrics.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Room Category</TableHead>
                <TableHead className="text-xs font-medium">Total Inventory</TableHead>
                <TableHead className="text-xs font-medium">Occupied</TableHead>
                <TableHead className="text-xs font-medium">Available &amp; Clean</TableHead>
                <TableHead className="text-xs font-medium">Under Maintenance</TableHead>
                <TableHead className="text-xs font-medium">Base Price</TableHead>
                <TableHead className="text-xs font-medium text-right">Occupancy %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.roomTypeId} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-xs text-gray-900">
                    {row.roomTypeName}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-700">{row.totalRooms} rooms</TableCell>
                  <TableCell className="text-xs font-mono text-emerald-600 font-medium">
                    {row.occupiedRooms}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-blue-600">{row.availableRooms}</TableCell>
                  <TableCell className="text-xs font-mono text-amber-600">{row.maintenanceRooms}</TableCell>
                  <TableCell className="text-xs font-mono text-gray-900 font-medium">
                    {formatCurrency(row.basePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-xs font-medium text-[#5e2b9d]">
                      {row.occupancyPercent}%
                    </span>
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

