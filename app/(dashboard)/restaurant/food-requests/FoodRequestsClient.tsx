'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  UtensilsCrossed,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ChefHat,
  Bike,
  CheckCheck,
  XCircle,
  ArrowLeft,
  Phone,
  MessageSquare,
  DollarSign,
  Printer,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  FoodRequestRecord,
  updateFoodRequestStatus,
  getFoodRequests,
} from '@/services/restaurant.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FoodRequestsClientProps {
  initialRequests: FoodRequestRecord[]
  propertyId: string
  properties?: Array<{ id: string; name: string }>
}

export function FoodRequestsClient({ initialRequests, propertyId, properties = [] }: FoodRequestsClientProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<FoodRequestRecord[]>(initialRequests)
  const [currentPropertyId, setCurrentPropertyId] = useState(propertyId)

  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  useEffect(() => {
    setCurrentPropertyId(propertyId)
  }, [propertyId])

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [cancelModalOrder, setCancelModalOrder] = useState<FoodRequestRecord | null>(null)
  const [printOrder, setPrintOrder] = useState<FoodRequestRecord | null>(null)

  // Refresh data from server
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const fresh = await getFoodRequests(currentPropertyId || propertyId)
      setRequests(fresh)
      toast.success('Food requests refreshed')
    } catch (e) {
      toast.error('Failed to refresh requests')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePropertyChange = async (newPropId: string) => {
    setCurrentPropertyId(newPropId)
    setIsRefreshing(true)
    try {
      const fresh = await getFoodRequests(newPropId)
      setRequests(fresh)
    } catch (e) {
      console.error(e)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle status update
  const handleStatusChange = async (
    orderId: string,
    newStatus: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  ) => {
    setUpdatingId(orderId)
    const res = await updateFoodRequestStatus(orderId, newStatus)
    setUpdatingId(null)

    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === orderId
            ? {
                ...r,
                status: newStatus,
                deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : r.deliveredAt,
              }
            : r
        )
      )
      const labelMap: Record<string, string> = {
        preparing: 'Kitchen started preparation',
        out_for_delivery: 'Dispatched for room delivery',
        delivered: 'Order marked delivered and settled to room',
        cancelled: 'Order cancelled',
      }
      toast.success(labelMap[newStatus] || 'Status updated')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update status')
    }
  }

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      r.roomNumber.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q) ||
      r.guestName.toLowerCase().includes(q) ||
      r.items.some((i) => i.itemName.toLowerCase().includes(q))

    return matchesStatus && matchesSearch
  })

  // Summary Metrics
  const activeCount = requests.filter(
    (r) => r.status === 'placed' || r.status === 'preparing' || r.status === 'out_for_delivery'
  ).length
  const placedCount = requests.filter((r) => r.status === 'placed').length
  const preparingCount = requests.filter((r) => r.status === 'preparing').length
  const outDeliveryCount = requests.filter((r) => r.status === 'out_for_delivery').length
  const deliveredCount = requests.filter((r) => r.status === 'delivered').length
  const totalRevenue = requests
    .filter((r) => r.status === 'delivered' || r.paymentStatus === 'billed_to_room')
    .reduce((sum, r) => sum + r.totalAmount, 0)

  // Status helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            New Order Placed
          </span>
        )
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <ChefHat className="h-3 w-3 text-blue-600" />
            Kitchen Cooking
          </span>
        )
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-[#5e2b9d] border border-purple-300">
            <Bike className="h-3 w-3 text-[#5e2b9d]" />
            Out for Delivery
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCheck className="h-3 w-3 text-emerald-600" />
            Delivered
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <XCircle className="h-3 w-3 text-gray-500" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/restaurant">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
                Food Requests &amp; In-Room Dining
              </h1>
              {placedCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {placedCount} NEW
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live kitchen order display for food and beverage requests submitted via Room QR scans.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {properties && properties.length > 1 && (
            <select
              value={currentPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2.5 py-2 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <Link href="/restaurant/menu">
            <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer rounded-md font-medium">
              <UtensilsCrossed className="h-4 w-4 mr-1.5 text-[#5e2b9d]" />
              Manage Menu Catalog
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500 block">Active Requests</span>
          <div className="text-xl font-bold text-gray-900 mt-0.5">{activeCount}</div>
          <span className="text-[10px] text-gray-400">Needing fulfillment</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-800 block">New / Placed</span>
          <div className="text-xl font-bold text-amber-900 mt-0.5">{placedCount}</div>
          <span className="text-[10px] text-amber-700">Awaiting kitchen accept</span>
        </div>

        <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-blue-800 block">Kitchen Prep</span>
          <div className="text-xl font-bold text-blue-900 mt-0.5">{preparingCount}</div>
          <span className="text-[10px] text-blue-700">Currently cooking</span>
        </div>

        <div className="bg-purple-50/60 border border-purple-200 rounded-md p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-[#5e2b9d] block">Out for Delivery</span>
          <div className="text-xl font-bold text-[#5e2b9d] mt-0.5">{outDeliveryCount}</div>
          <span className="text-[10px] text-purple-700">In transit to room</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-800 block">Delivered</span>
          <div className="text-xl font-bold text-emerald-900 mt-0.5">{deliveredCount}</div>
          <span className="text-[10px] text-emerald-700">Completed &amp; billed</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500 block">Total Revenue</span>
          <div className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalRevenue)}</div>
          <span className="text-[10px] text-gray-400">Delivered dining orders</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
          {[
            { id: 'all', label: `All (${requests.length})` },
            { id: 'placed', label: `New Placed (${placedCount})` },
            { id: 'preparing', label: `Kitchen Prep (${preparingCount})` },
            { id: 'out_for_delivery', label: `Out for Delivery (${outDeliveryCount})` },
            { id: 'delivered', label: `Delivered (${deliveredCount})` },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize cursor-pointer transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#5e2b9d] text-white font-medium'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Room #, Guest, Order ID, Dish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center space-y-3">
          <UtensilsCrossed className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-900 font-sora">No Food Requests Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'No requests match the current filters. Try changing or clearing your search filter.'
              : 'When hotel guests scan the Room QR code and add items to their dining tray, their live requests will display here instantly.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRequests.map((order) => {
            const isUpdating = updatingId === order.id

            return (
              <Card
                key={order.id}
                className={`border rounded-md shadow-2xs transition-all bg-white flex flex-col justify-between ${
                  order.status === 'placed'
                    ? 'border-amber-300 ring-1 ring-amber-300/50'
                    : order.status === 'preparing'
                    ? 'border-blue-200'
                    : 'border-gray-200'
                }`}
              >
                <div>
                  {/* Card Header: Room, Order #, Status, Timestamp */}
                  <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3 bg-gray-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#5e2b9d] text-white font-bold text-xs px-2.5 py-0.5 rounded-md">
                          ROOM {order.roomNumber}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 font-mono">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{order.guestName}</span>
                        {order.guestPhone && (
                          <>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {order.guestPhone}
                            </span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>{order.roomTypeName || 'Room'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(order.status)}
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Items List */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        Dishes Ordered ({order.items.reduce((acc, it) => acc + it.quantity, 0)} items)
                      </div>
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-md p-2 bg-gray-50/30">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {item.dietaryType === 'veg' ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" title="Veg" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="Non-Veg" />
                              )}
                              <span className="font-semibold text-[#5e2b9d] text-[11px] w-5">
                                {item.quantity}x
                              </span>
                              <span className="font-medium text-gray-900">{item.itemName}</span>
                              {item.specialRequests && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  {item.specialRequests}
                                </span>
                              )}
                            </div>
                            <div className="font-medium text-gray-700">
                              {formatCurrency(item.totalPrice)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-900 block text-[11px]">
                            Guest Special Instructions:
                          </span>
                          <span className="text-[11px] text-amber-800 leading-relaxed">
                            {order.specialInstructions}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span>Payment:</span>
                        <span className="font-medium capitalize text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                          {order.paymentMethod.replace(/_/g, ' ')}
                        </span>
                        <span>({order.paymentStatus})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 mr-2">Total Amount</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Workflow */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrintOrder(order)}
                      className="text-xs h-8 px-2.5 cursor-pointer bg-white border-gray-200 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      KOT Slip
                    </Button>

                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelModalOrder(order)}
                        className="text-xs h-8 px-2 cursor-pointer text-gray-500 hover:text-red-600 rounded-md"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Stage Transition Buttons */}
                  <div className="flex items-center gap-1.5">
                    {order.status === 'placed' && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 rounded-md cursor-pointer font-medium"
                      >
                        <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                        Accept &amp; Start Prep
                      </Button>
                    )}

                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
                        className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 px-3 rounded-md cursor-pointer font-medium"
                      >
                        <Bike className="h-3.5 w-3.5 mr-1.5" />
                        Out for Delivery
                      </Button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, 'delivered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-md cursor-pointer font-medium"
                      >
                        <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                        Mark Delivered &amp; Settle
                      </Button>
                    )}

                    {order.status === 'delivered' && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        Completed &bull; Billed to Room
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      <Dialog open={!!cancelModalOrder} onOpenChange={(open) => !open && setCancelModalOrder(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Cancel Food Request</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to cancel order #{cancelModalOrder?.orderNumber} for Room{' '}
              {cancelModalOrder?.roomNumber}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOrder(null)}
              className="text-xs cursor-pointer rounded-md"
            >
              Keep Order
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (cancelModalOrder) {
                  handleStatusChange(cancelModalOrder.id, 'cancelled')
                  setCancelModalOrder(null)
                }
              }}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-md font-medium"
            >
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KOT SLIP / RECEIPT PRINT MODAL */}
      <Dialog open={!!printOrder} onOpenChange={(open) => !open && setPrintOrder(null)}>
        <DialogContent className="max-w-sm rounded-md font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold font-sora text-center">
              KITCHEN ORDER TICKET (KOT)
            </DialogTitle>
          </DialogHeader>

          {printOrder && (
            <div className="space-y-3 pt-2 text-gray-800">
              <div className="text-center pb-2 border-b border-dashed border-gray-300">
                <div className="font-bold text-base">ROOM {printOrder.roomNumber}</div>
                <div className="text-[11px] text-gray-500">
                  Order #{printOrder.orderNumber} &bull; {new Date(printOrder.createdAt).toLocaleTimeString()}
                </div>
                <div className="text-[11px] font-semibold text-gray-700">Guest: {printOrder.guestName}</div>
              </div>

              <div className="space-y-1.5 py-1">
                {printOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.itemName}
                    </span>
                    <span className="font-semibold">{formatCurrency(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              {printOrder.specialInstructions && (
                <div className="p-2 bg-gray-100 rounded text-[11px]">
                  <strong>Notes:</strong> {printOrder.specialInstructions}
                </div>
              )}

              <div className="pt-2 border-t border-dashed border-gray-300 flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span>{formatCurrency(printOrder.totalAmount)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintOrder(null)}
              className="text-xs cursor-pointer rounded-md"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.print()
              }}
              className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print KOT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
