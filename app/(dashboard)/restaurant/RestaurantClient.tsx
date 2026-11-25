'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  UtensilsCrossed,
  Plus,
  Coffee,
  Wine,
  Clock,
  CheckCircle,
  LayoutGrid,
  MenuSquare,
  FileBarChart,
  Search,
  DollarSign,
  Send,
  Hotel,
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
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  RestaurantOrderRecord,
  TableRecord,
  MenuItemRecord,
  createRestaurantOrder,
  updateOrderStatus,
  settleRestaurantOrder,
} from '@/services/restaurant.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface RestaurantClientProps {
  initialOrders: RestaurantOrderRecord[]
  tables: TableRecord[]
  menuItems: MenuItemRecord[]
  propertyId: string
  rooms: Array<{ id: string; roomNumber: string }>
}

export function RestaurantClient({
  initialOrders,
  tables,
  menuItems,
  propertyId,
  rooms,
}: RestaurantClientProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<RestaurantOrderRecord[]>(initialOrders)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // New Order Modal
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'room_delivery'>('dine_in')
  const [selectedTableId, setSelectedTableId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [cart, setCart] = useState<Array<{ itemId: string; name: string; quantity: number; unitPrice: number }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Settle Order Modal
  const [settleOrder, setSettleOrder] = useState<RestaurantOrderRecord | null>(null)
  const [settleMethod, setSettleMethod] = useState<'cash' | 'card' | 'room'>('card')

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      o.id.toLowerCase().includes(q) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
      (o.roomNumber && o.roomNumber.toLowerCase().includes(q)) ||
      (o.guestName && o.guestName.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  // Calculations
  const todayRevenue = orders
    .filter((o) => o.status === 'settled' || o.paymentStatus === 'paid' || o.paymentStatus === 'billed_to_room')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const occupiedTables = tables.filter((t) => t.status === 'occupied').length
  const totalTables = tables.length
  const occupancyPercent = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0
  const activeOrdersCount = orders.filter((o) => o.status !== 'settled' && o.status !== 'cancelled').length

  // Cart operations
  const handleAddToCart = (item: MenuItemRecord) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.id)
      if (existing) {
        return prev.map((i) => (i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { itemId: item.id, name: item.name, quantity: 1, unitPrice: item.price }]
    })
  }

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  const cartSubtotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const cartTax = Number((cartSubtotal * 0.05).toFixed(2))
  const cartTotal = Number((cartSubtotal + cartTax).toFixed(2))

  // Submit Order
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      toast.error('Please add at least one dish from the menu')
      return
    }

    if (orderType === 'dine_in' && !selectedTableId && tables.length > 0) {
      toast.error('Please select a dining table')
      return
    }

    if (orderType === 'room_delivery' && !selectedRoomId && rooms.length > 0) {
      toast.error('Please select an in-house room for delivery')
      return
    }

    setIsSubmitting(true)
    const res = await createRestaurantOrder({
      propertyId,
      tableId: orderType === 'dine_in' ? selectedTableId || undefined : undefined,
      roomId: orderType === 'room_delivery' ? selectedRoomId || undefined : undefined,
      orderType,
      items: cart,
      notes: orderNotes.trim() || undefined,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('KOT Order dispatched to kitchen!')
      setIsNewOrderOpen(false)
      setCart([])
      setOrderNotes('')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to place order')
    }
  }

  // Update Status
  const handleStatusChange = async (orderId: string, nextStatus: any) => {
    setIsSubmitting(true)
    const res = await updateOrderStatus(orderId, nextStatus)
    setIsSubmitting(false)

    if (res.success) {
      toast.success(`Order status updated to ${nextStatus.replace('_', ' ')}`)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update status')
    }
  }

  // Settle Order Submit
  const handleSettleSubmit = async () => {
    if (!settleOrder) return
    setIsSubmitting(true)
    const res = await settleRestaurantOrder(
      settleOrder.id,
      settleMethod,
      settleMethod === 'room'
    )
    setIsSubmitting(false)

    if (res.success) {
      toast.success(
        settleMethod === 'room'
          ? 'Bill posted directly to guest room folio'
          : `Bill settled with ${settleMethod}`
      )
      setSettleOrder(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to settle order')
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
            Restaurant POS &amp; F&amp;B Console
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Table management, kitchen order tickets (KOT), room service billing, and menu catalog.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/restaurant/food-requests">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]">
              <UtensilsCrossed className="h-4 w-4 mr-1.5" />
              Food Requests (QR)
            </Button>
          </Link>
          <Link href="/restaurant/tables">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <LayoutGrid className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Tables Layout
            </Button>
          </Link>
          <Link href="/restaurant/menu">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <MenuSquare className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Menu Catalog
            </Button>
          </Link>
          <Link href="/restaurant/reports">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <FileBarChart className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              F&amp;B Sales
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsNewOrderOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New POS Order
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Today&apos;s F&amp;B Revenue</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{formatCurrency(todayRevenue)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Kitchen &amp; Bar Sales</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Table Occupancy</span>
          <p className="text-2xl font-medium text-[#5e2b9d] mt-2">
            {occupancyPercent}% ({occupiedTables}/{totalTables})
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Dining Room &amp; Patio</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Active KOT Tickets</span>
          <p className="text-2xl font-medium text-amber-600 mt-2">{activeOrdersCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Live in prep / service</p>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium">Catalog Items</span>
          <p className="text-2xl font-medium text-gray-900 mt-2">{menuItems.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Dishes and beverages</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search order #, table, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Filter:</span>
          <div className="flex gap-1 flex-wrap">
            {['all', 'placed', 'kitchen_prep', 'served', 'settled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md capitalize cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-[#5e2b9d] text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No POS Orders Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Create kitchen order tickets for dine-in tables, room service deliveries, or takeaways.
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsNewOrderOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Order
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="text-xs font-medium">Order / KOT</TableHead>
                <TableHead className="text-xs font-medium">Type &amp; Destination</TableHead>
                <TableHead className="text-xs font-medium">Ordered Items</TableHead>
                <TableHead className="text-xs font-medium">Total Amount</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((ord) => (
                <TableRow key={ord.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="font-mono text-xs font-medium text-[#5e2b9d]">
                      #{ord.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-[11px] text-gray-400">{formatDateTime(ord.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {ord.orderType.replace('_', ' ')}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {ord.tableNumber
                        ? `Table: ${ord.tableNumber}`
                        : ord.roomNumber
                        ? `Room: #${ord.roomNumber}`
                        : 'Direct Counter'}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-gray-700">
                    <div className="truncate">
                      {ord.items.map((i) => `${i.itemName} x${i.quantity}`).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-gray-900">
                    {formatCurrency(ord.totalAmount)}
                    <span className="block text-[10px] text-gray-400">
                      {ord.paymentStatus.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ord.status === 'settled'
                          ? 'success'
                          : ord.status === 'kitchen_prep'
                          ? 'warning'
                          : ord.status === 'served'
                          ? 'outline'
                          : 'secondary'
                      }
                      className="text-[10px] capitalize rounded-sm"
                    >
                      {ord.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ord.status === 'placed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(ord.id, 'kitchen_prep')}
                          className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer rounded-md"
                        >
                          Prep
                        </Button>
                      )}
                      {ord.status === 'kitchen_prep' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(ord.id, 'served')}
                          className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer rounded-md"
                        >
                          Serve
                        </Button>
                      )}
                      {ord.status !== 'settled' && ord.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => setSettleOrder(ord)}
                          className="h-7 px-2.5 text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
                        >
                          Settle Bill
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* NEW POS ORDER MODAL */}
      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Create Kitchen Order Ticket (KOT)</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select order destination and click items from the restaurant catalog to add to order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrderSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Order Destination</label>
                <SearchableSelect
                  value={orderType}
                  onChange={(val) => setOrderType(val as any)}
                  options={[
                    { value: 'dine_in', label: 'Dine-in Table' },
                    { value: 'room_delivery', label: 'Room Service' },
                    { value: 'takeaway', label: 'Takeaway Counter' },
                  ]}
                  placeholder="Select destination..."
                />
              </div>

              {orderType === 'dine_in' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Table *</label>
                  <SearchableSelect
                    value={selectedTableId}
                    onChange={setSelectedTableId}
                    options={tables.map((t) => ({
                      value: t.id,
                      label: `${t.tableNumber} (${t.section} - ${t.capacity} seats) - ${t.status}`,
                    }))}
                    placeholder="Choose Table..."
                    required
                  />
                </div>
              )}

              {orderType === 'room_delivery' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Room *</label>
                  <SearchableSelect
                    value={selectedRoomId}
                    onChange={setSelectedRoomId}
                    options={rooms.map((r) => ({
                      value: r.id,
                      label: `Room #${r.roomNumber}`,
                    }))}
                    placeholder="Choose Room..."
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, extra butter"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            {/* Menu Picker & Cart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="border border-gray-200 rounded-md p-3 max-h-64 overflow-y-auto space-y-2">
                <span className="text-xs font-medium text-gray-700 block mb-2">Available Menu Items</span>
                {menuItems.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    No menu items in catalog. Go to Menu to add items.
                  </p>
                ) : (
                  menuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-[#f7f2fd] border border-gray-100 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {item.name}
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-[#5e2b9d]" />
                    </div>
                  ))
                )}
              </div>

              {/* Current Order Summary */}
              <div className="border border-gray-200 rounded-md p-3 flex flex-col justify-between bg-gray-50/50">
                <div>
                  <span className="text-xs font-medium text-gray-700 block mb-2">
                    Current Order Items ({cart.length})
                  </span>
                  {cart.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">
                      Click items from the left to add to order.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {cart.map((i) => (
                        <div
                          key={i.itemId}
                          className="flex items-center justify-between text-xs bg-white p-2 rounded-md border border-gray-200"
                        >
                          <span className="font-medium text-gray-900 truncate max-w-[120px]">{i.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(i.itemId, -1)}
                              className="w-5 h-5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
                            >
                              -
                            </button>
                            <span className="font-mono">{i.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(i.itemId, 1)}
                              className="w-5 h-5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
                            >
                              +
                            </button>
                            <span className="font-mono text-gray-800 ml-2">
                              {formatCurrency(i.quantity * i.unitPrice)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST (5%):</span>
                    <span className="font-mono">{formatCurrency(cartTax)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-900 border-t border-gray-200 pt-1">
                    <span>Total Bill:</span>
                    <span className="font-mono text-[#5e2b9d]">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewOrderOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isSubmitting ? 'Dispatching...' : 'Dispatch KOT Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SETTLE BILL MODAL */}
      <Dialog open={!!settleOrder} onOpenChange={(open) => !open && setSettleOrder(null)}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Settle Restaurant Bill</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Order #{settleOrder?.id.slice(0, 8).toUpperCase()} • Total Due: {formatCurrency(settleOrder?.totalAmount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Settlement Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSettleMethod('card')}
                  className={`p-2.5 text-xs rounded-md border text-center cursor-pointer transition-colors ${
                    settleMethod === 'card'
                      ? 'border-[#5e2b9d] bg-[#f7f2fd] text-[#5e2b9d] font-medium'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Card / POS
                </button>
                <button
                  type="button"
                  onClick={() => setSettleMethod('cash')}
                  className={`p-2.5 text-xs rounded-md border text-center cursor-pointer transition-colors ${
                    settleMethod === 'cash'
                      ? 'border-[#5e2b9d] bg-[#f7f2fd] text-[#5e2b9d] font-medium'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cash Register
                </button>
                <button
                  type="button"
                  onClick={() => setSettleMethod('room')}
                  className={`p-2.5 text-xs rounded-md border text-center cursor-pointer transition-colors ${
                    settleMethod === 'room'
                      ? 'border-[#5e2b9d] bg-[#f7f2fd] text-[#5e2b9d] font-medium'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Room Folio
                </button>
              </div>
            </div>

            {settleMethod === 'room' && (
              <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-800">
                This charge ({formatCurrency(settleOrder?.totalAmount || 0)}) will be posted automatically to the guest&apos;s open room folio.
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettleOrder(null)}
              className="text-xs cursor-pointer rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleSettleSubmit}
              className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
            >
              {isSubmitting ? 'Settling...' : 'Confirm Settlement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

