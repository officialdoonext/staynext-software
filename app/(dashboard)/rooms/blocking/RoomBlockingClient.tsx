'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Ban,
  Plus,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RoomBlockItem, RoomItem, createRoomBlock, releaseRoomBlock } from '@/services/room.service'
import { PropertyItem } from '@/services/property.service'
import { formatDate } from '@/lib/utils'

interface RoomBlockingClientProps {
  property: PropertyItem
  properties: PropertyItem[]
  rooms: RoomItem[]
  initialBlocks: RoomBlockItem[]
}

export default function RoomBlockingClient({
  property: initialProp,
  properties,
  rooms,
  initialBlocks,
}: RoomBlockingClientProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProp.id)
  const [blocks, setBlocks] = useState<RoomBlockItem[]>(initialBlocks)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    room_id: rooms[0]?.id || '',
    block_type: 'Maintenance',
    reason: 'AC Compressor Service & Maintenance',
    start_date: '',
    end_date: '',
    blocked_by: 'Duty Manager',
    approved_by: 'General Manager',
    maintenance_ticket_number: 'WO-1042',
    notes: '',
  })

  const openAddForm = () => {
    const today = new Date().toISOString().split('T')[0]
    const defaultEnd = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    setFormData((prev) => ({
      ...prev,
      start_date: prev.start_date || today,
      end_date: prev.end_date || defaultEnd,
    }))
    setShowAddForm((prev) => !prev)
  }

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.room_id) {
      setErrorMsg('Please select a room to block.')
      return
    }

    if (!formData.reason.trim()) {
      setErrorMsg('Please specify the reason for blocking.')
      return
    }

    setLoading(true)

    try {
      const res = await createRoomBlock({
        property_id: selectedPropertyId,
        room_id: formData.room_id,
        reason: formData.reason.trim(),
        block_type: formData.block_type,
        maintenance_ticket_number: formData.maintenance_ticket_number,
        approved_by: formData.approved_by,
        start_date: formData.start_date,
        end_date: formData.end_date,
        blocked_by: formData.blocked_by,
        notes: formData.notes,
      })

      if (!res.success) throw new Error(res.error || 'Failed to block room')

      const roomObj = rooms.find((r) => r.id === formData.room_id)
      setBlocks((prev) => [
        {
          ...res.data,
          room_number: roomObj?.room_number || 'Room',
          block_type: (formData.block_type as any) || 'Maintenance',
          maintenance_ticket_number: formData.maintenance_ticket_number,
          approved_by: formData.approved_by,
          inspection_status: 'Pending',
        },
        ...prev,
      ])

      setSuccessMsg(`Room #${roomObj?.room_number} blocked and inventory locked.`)
      setTimeout(() => {
        setShowAddForm(false)
        setSuccessMsg('')
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (blockId: string, roomId: string, roomNum?: string) => {
    if (!confirm(`Are you sure you want to release the block on Room #${roomNum || ''} and return it to available inventory?`)) return

    try {
      const res = await releaseRoomBlock(blockId, roomId)
      if (res.success) {
        setBlocks((prev) =>
          prev.map((b) => (b.id === blockId ? { ...b, status: 'released' } : b))
        )
      } else {
        alert(res.error || 'Failed to release block')
      }
    } catch {}
  }

  return (
    <div className="space-y-6 w-full pb-12">
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
              Room Blocking &amp; Out-of-Order Console
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Prevent rooms from being reserved during deep cleaning, pest control, renovation, or equipment repairs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <Button
            onClick={openAddForm}
            size="sm"
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 font-medium rounded-md cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {showAddForm ? 'Close Form' : 'Block a Room'}
          </Button>
        </div>
      </div>

      {/* Add Block Form */}
      {showAddForm && (
        <Card className="border-[#dfcef6] bg-[#f7f2fd]/30 rounded-md shadow-sm">
          <CardHeader className="pb-3 border-b border-[#eee4fa]">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#5e2b9d]">
                <Ban className="h-4 w-4" />
                Apply Room Inventory Block
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {errorMsg && (
              <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 mb-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddBlock} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Room *</label>
                  <select
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                    required
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.room_type_name}) - Current: {r.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Block Type *</label>
                  <select
                    value={formData.block_type}
                    onChange={(e) => setFormData({ ...formData, block_type: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="Maintenance">Maintenance &amp; Engineering</option>
                    <option value="Renovation">Room Renovation / Refurbishment</option>
                    <option value="Pest Control">Pest Control Treatment</option>
                    <option value="Deep Cleaning">Deep Sanitization / Cleaning</option>
                    <option value="Safety Issue">Safety / Electrical Inspection</option>
                    <option value="VIP Reservation Hold">VIP / Government Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Work Order / Ticket #</label>
                  <input
                    type="text"
                    value={formData.maintenance_ticket_number}
                    onChange={(e) => setFormData({ ...formData, maintenance_ticket_number: e.target.value })}
                    placeholder="e.g. WO-1042"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={formData.approved_by}
                    onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Block *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. AC compressor failure, bathroom plumbing leak"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Blocked By</label>
                  <input
                    type="text"
                    value={formData.blocked_by}
                    onChange={(e) => setFormData({ ...formData, blocked_by: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Work Order Notes / Vendor Details</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="External vendor contact or technician notes"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs h-8 rounded-md cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Lock Inventory Block
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Blocks Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
            <tr>
              <th className="px-4 py-3">Room Unit</th>
              <th className="px-4 py-3">Block Type &amp; Work Order</th>
              <th className="px-4 py-3">Reason &amp; Scope</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Blocked &amp; Approved By</th>
              <th className="px-4 py-3">Inspection Status</th>
              <th className="px-4 py-3">Block Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {blocks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No rooms currently under inventory block. All configured rooms are in active circulation.
                </td>
              </tr>
            ) : (
              blocks.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    Room {b.room_number}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{b.block_type || 'Maintenance'}</span>
                    {b.maintenance_ticket_number && (
                      <div className="font-mono text-[10px] text-purple-700 bg-purple-50 inline-block px-1 py-0.2 rounded-xs mt-0.5">
                        #{b.maintenance_ticket_number}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    <div>{b.reason}</div>
                    {b.notes && <div className="text-[10px] text-gray-400 mt-0.5">{b.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(b.start_date)} &rarr; {formatDate(b.end_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div>{b.blocked_by}</div>
                    {b.approved_by && (
                      <div className="text-[10px] text-gray-400">Appr: {b.approved_by}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] rounded-sm ${b.inspection_status === 'Passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {b.inspection_status || 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={b.status === 'active' ? 'destructive' : 'secondary'} className="text-[10px] rounded-sm">
                      {b.status === 'active' ? 'Active Block' : 'Released'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(b.id, b.room_id, b.room_number)}
                        className="h-7 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200 rounded-sm cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Release Block
                      </Button>
                    ) : (
                      <span className="text-[10px] text-gray-400">Inventory Available</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

