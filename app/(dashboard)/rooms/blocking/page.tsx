'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Ban, Plus, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const initialBlocks = [
  { id: 'blk-1', roomNumber: '204', roomType: 'Deluxe Twin', reason: 'AC Compressor Replacement', startDate: '2026-11-09', endDate: '2026-11-14', status: 'maintenance', blockedBy: 'Tom Bradley' },
  { id: 'blk-2', roomNumber: '302', roomType: 'Oceanfront Villa', reason: 'Bathroom Tile Regrouting & Sealant', startDate: '2026-11-10', endDate: '2026-11-17', status: 'out_of_order', blockedBy: 'Alex Rivers' },
]

export default function RoomBlockingPage() {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    roomNumber: '103',
    roomType: 'Executive Double',
    reason: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    status: 'maintenance',
  })

  const handleUnblock = (id: string, roomNum: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    toast.success(`Room #${roomNum} unblocked and returned to sellable inventory.`)
  }

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault()
    const newEntry = {
      id: `blk-${Date.now()}`,
      roomNumber: formData.roomNumber,
      roomType: formData.roomType,
      reason: formData.reason,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      blockedBy: 'Property Manager',
    }
    setBlocks((prev) => [newEntry, ...prev])
    setShowAddForm(false)
    toast.success(`Room #${formData.roomNumber} blocked successfully.`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <Link href="/rooms">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Room Overview
          </Button>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-semibold text-gray-900">Room Blocking &amp; Out of Order</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Room Blocking &amp; Out-of-Order Console
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Prevent rooms from being sold on OTAs or booking engine during renovations, deep cleaning, or equipment maintenance.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {showAddForm ? 'Close Form' : 'Block a Room'}
        </Button>
      </div>

      {/* Block Room Form Modal/Panel */}
      {showAddForm && (
        <Card className="border-indigo-200 bg-indigo-50/20 shadow-sm">
          <CardHeader className="pb-3 border-b border-indigo-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900">
              <Ban className="h-4 w-4 text-indigo-600" />
              Apply Room Inventory Block
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddBlock} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="roomNumber" className="text-xs">Room Number</Label>
                <select
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
                >
                  <option value="101">Room 101 (Deluxe King)</option>
                  <option value="103">Room 103 (Executive Double)</option>
                  <option value="203">Room 203 (Deluxe Twin)</option>
                  <option value="301">Room 301 (Oceanfront Villa)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs">Block Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs">Block End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="reason" className="text-xs">Reason for Block</Label>
                <Input
                  id="reason"
                  required
                  placeholder="e.g. Balcony repainting, plumbing overhaul..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  Confirm Inventory Block
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Blocks Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Active Blocked &amp; Out-of-Order Rooms</h3>
          <span className="text-xs text-rose-600 font-semibold">{blocks.length} Units Blocked</span>
        </div>

        {blocks.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No rooms currently blocked. All units in sellable inventory.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Block Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Authorized By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((blk) => (
                <TableRow key={blk.id}>
                  <TableCell className="font-mono font-bold text-xs text-gray-900">
                    #{blk.roomNumber}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {blk.roomType}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-900">
                    {blk.reason}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 font-mono">
                    {formatDate(blk.startDate)} &rarr; {formatDate(blk.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={blk.status === 'out_of_order' ? 'destructive' : 'warning'} className="capitalize text-[10px]">
                      {blk.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {blk.blockedBy}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblock(blk.id, blk.roomNumber)}
                      className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Unblock Room
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

