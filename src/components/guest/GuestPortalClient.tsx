'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Utensils,
  Sparkles,
  Package,
  Shirt,
  Wrench,
  Car,
  Bell,
  MessageSquare,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  PhoneCall,
  Loader2,
  X,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  GuestRoomContext,
  GuestServiceCategoryWithItems,
  submitGuestOrder,
  submitGuestServiceRequest
} from '@/services/guest.service'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  dietary_type?: string
  special_requests?: string
}

interface SubmittedActivity {
  id: string
  type: 'order' | 'request'
  tracking_token: string
  title: string
  status: string
  timestamp: string
}

interface GuestPortalClientProps {
  context: GuestRoomContext
  catalog: GuestServiceCategoryWithItems[]
  qrToken?: string
}

export default function GuestPortalClient({
  context,
  catalog,
  qrToken,
}: GuestPortalClientProps) {
  const { property, room, guestName, isValid, errorMessage } = context

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('food-beverage')
  const [dietaryFilter, setDietaryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [guestPhone, setGuestPhone] = useState('')
  const [guestNameInput, setGuestNameInput] = useState(guestName || '')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pay_at_checkout')

  // Request Form modal state (for non-food services)
  const [selectedServiceItem, setSelectedServiceItem] = useState<{
    name: string
    category: string
    price: number
  } | null>(null)
  const [requestNotes, setRequestNotes] = useState('')
  const [requestPriority, setRequestPriority] = useState('medium')

  // Submission loading & success states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
    trackingToken?: string
  } | null>(null)

  // Local storage for tracking tokens
  const [recentActivities, setRecentActivities] = useState<SubmittedActivity[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`staynext_guest_${room.id}_activities`)
      if (stored) {
        setRecentActivities(JSON.parse(stored))
      }
    } catch {}
  }, [room.id])

  const saveActivity = (activity: SubmittedActivity) => {
    try {
      const updated = [activity, ...recentActivities]
      setRecentActivities(updated)
      localStorage.setItem(`staynext_guest_${room.id}_activities`, JSON.stringify(updated))
    } catch {}
  }

  // Cart operations
  const addToCart = (item: { id: string; name: string; price: number; dietary_type?: string }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const cartSubtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0)
  const cartTax = Math.round(cartSubtotal * 0.05 * 100) / 100
  const cartTotal = cartSubtotal + cartTax
  const cartTotalItems = cart.reduce((acc, it) => acc + it.quantity, 0)

  // Handle Order Submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    setIsSubmitting(true)
    setNotification(null)

    try {
      const res = await submitGuestOrder({
        property_id: property.id,
        room_id: room.id,
        guest_name: guestNameInput.trim() || 'Guest',
        guest_phone: guestPhone.trim(),
        payment_method: paymentMethod,
        special_instructions: specialInstructions,
        items: cart.map((it) => ({
          item_name: it.name,
          quantity: it.quantity,
          unit_price: it.price,
          dietary_type: it.dietary_type,
          special_requests: it.special_requests,
        })),
      })

      if (!res.success) throw new Error(res.error || 'Failed to place order')

      setCart([])
      setIsCartOpen(false)
      setNotification({
        type: 'success',
        message: `Order #${res.order?.order_number} confirmed! The kitchen has started preparation.`,
        trackingToken: res.tracking_token,
      })

      if (res.tracking_token) {
        saveActivity({
          id: res.order?.id || Date.now().toString(),
          type: 'order',
          tracking_token: res.tracking_token,
          title: `Dining Order #${res.order?.order_number}`,
          status: 'placed',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error submitting order.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Non-Dining Service Request Submit
  const handleSendServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceItem) return

    setIsSubmitting(true)
    setNotification(null)

    try {
      const res = await submitGuestServiceRequest({
        property_id: property.id,
        room_id: room.id,
        guest_name: guestNameInput.trim() || 'Guest',
        guest_phone: guestPhone.trim(),
        category_slug: selectedServiceItem.category,
        request_type: selectedServiceItem.name,
        description: requestNotes.trim() || selectedServiceItem.name,
        priority: requestPriority,
      })

      if (!res.success) throw new Error(res.error || 'Failed to submit request')

      const token = res.tracking_token
      setSelectedServiceItem(null)
      setRequestNotes('')
      setNotification({
        type: 'success',
        message: `Your request for "${selectedServiceItem.name}" was received and alerted to staff.`,
        trackingToken: token,
      })

      if (token) {
        saveActivity({
          id: res.request_id || Date.now().toString(),
          type: 'request',
          tracking_token: token,
          title: selectedServiceItem.name,
          status: 'pending',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error submitting request.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-gray-200 rounded-md p-6 text-center space-y-4 shadow-md bg-white">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">QR Code Verification Notice</h2>
          <p className="text-xs text-gray-500">{errorMessage || 'Invalid or revoked QR code token.'}</p>
          <div className="pt-2">
            <div className="text-[11px] text-gray-400">
              Please contact the front desk or scan the updated QR code inside your guest room.
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const activeCategory = catalog.find((c) => c.slug === activeCategorySlug) || catalog[0]

  // Filter category items
  const filteredItems = (activeCategory?.items || []).filter((it) => {
    const matchesSearch =
      searchQuery === '' ||
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (it.description && it.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDietary =
      dietaryFilter === 'all' ||
      it.dietary_type?.toLowerCase() === dietaryFilter.toLowerCase()

    return matchesSearch && matchesDietary
  })

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto min-h-screen flex flex-col justify-between">
      {/* 1. BRANDED HOTEL HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#5e2b9d] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {property.name.substring(0, 1)}
            </div>
            <div>
              <h1 className="text-xs font-semibold text-gray-900 line-clamp-1 leading-tight">
                {property.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                <span className="font-semibold text-[#5e2b9d]">ROOM {room.room_number}</span>
                <span>•</span>
                <span>{room.room_type_name}</span>
                {guestName && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">Hello, {guestName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {property.phone && (
              <a
                href={`tel:${property.phone}`}
                className="p-1.5 text-gray-600 hover:text-[#5e2b9d] rounded-md border border-gray-200 cursor-pointer"
                title="Call Front Desk"
              >
                <PhoneCall className="h-4 w-4" />
              </a>
            )}

            {cartTotalItems > 0 && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#5e2b9d] text-white rounded-md text-xs font-medium cursor-pointer shadow-xs"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{cartTotalItems}</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`mt-2.5 p-2.5 rounded-md text-xs flex items-start justify-between gap-2 border ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start gap-1.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              )}
              <div>
                <div>{notification.message}</div>
                {notification.trackingToken && (
                  <Link
                    href={`/guest/track/${notification.trackingToken}`}
                    className="inline-flex items-center gap-1 font-medium text-[#5e2b9d] underline text-[11px] mt-1 cursor-pointer"
                  >
                    Track Live Status &rarr;
                  </Link>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      {/* 2. CATEGORY HORIZONTAL BAR */}
      <nav className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none sticky top-14 z-20">
        {[
          { slug: 'food-beverage', label: 'Dining', icon: Utensils },
          { slug: 'housekeeping', label: 'Housekeeping', icon: Sparkles },
          { slug: 'amenities', label: 'Amenities', icon: Package },
          { slug: 'laundry', label: 'Laundry', icon: Shirt },
          { slug: 'maintenance', label: 'Repairs', icon: Wrench },
          { slug: 'transportation', label: 'Taxi', icon: Car },
          { slug: 'concierge', label: 'Reception', icon: Bell },
          { slug: 'feedback', label: 'Manager', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeCategorySlug === tab.slug
          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => {
                setActiveCategorySlug(tab.slug)
                setSearchQuery('')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#5e2b9d] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* 3. MAIN CONTENT BODY */}
      <main className="p-4 space-y-4 flex-1">
        {/* Category Description Banner */}
        <div className="bg-[#f7f2fd]/60 border border-[#dfcef6] rounded-md p-3 text-xs flex items-center justify-between">
          <div>
            <span className="font-semibold text-[#5e2b9d] block">{activeCategory.name}</span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">{activeCategory.description}</span>
          </div>
          {recentActivities.length > 0 && (
            <Link
              href={`/guest/track/${recentActivities[0].tracking_token}`}
              className="text-[10px] bg-white border border-[#dfcef6] text-[#5e2b9d] font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#eee4fa] shrink-0"
            >
              Track Active ({recentActivities.length})
            </Link>
          )}
        </div>

        {/* Dietary & Search Filters (For Dining) */}
        {activeCategorySlug === 'food-beverage' && (
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search food items, drinks, snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'veg', label: '🟢 Pure Veg' },
                { id: 'non-veg', label: '🔴 Non-Veg' },
                { id: 'beverage', label: '☕ Drinks' },
              ].map((df) => (
                <button
                  key={df.id}
                  type="button"
                  onClick={() => setDietaryFilter(df.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                    dietaryFilter === df.id
                      ? 'bg-gray-900 text-white font-medium'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ITEMS CATALOG LIST */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isDining = activeCategorySlug === 'food-beverage'
            const inCart = cart.find((c) => c.id === item.id)

            return (
              <Card
                key={item.id}
                className="border-gray-200 rounded-md shadow-2xs hover:border-[#dfcef6] transition-all bg-white"
              >
                <CardContent className="p-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      {item.dietary_type === 'veg' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" title="Vegetarian" />
                      )}
                      {item.dietary_type === 'non-veg' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" title="Non-Vegetarian" />
                      )}
                      <h3 className="text-xs font-semibold text-gray-900">{item.name}</h3>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-500">
                      {item.price > 0 ? (
                        <span className="font-semibold text-gray-900 text-xs">
                          {formatCurrency(item.price)}
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                          Complimentary
                        </span>
                      )}

                      {item.preparation_time_mins > 0 && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-3 w-3" />
                          ~{item.preparation_time_mins} mins
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions depending on Dining vs Service Request */}
                  <div className="shrink-0 flex items-center">
                    {isDining ? (
                      inCart ? (
                        <div className="flex items-center gap-1 bg-[#f7f2fd] border border-[#dfcef6] rounded-md px-1.5 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-[#5e2b9d] font-bold px-1 hover:opacity-80 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold text-[#5e2b9d] px-1.5">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-[#5e2b9d] font-bold px-1 hover:opacity-80 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-7 px-2.5 rounded-md cursor-pointer font-medium"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedServiceItem({
                            name: item.name,
                            category: activeCategorySlug,
                            price: item.price,
                          })
                        }}
                        className="text-xs h-7 px-2.5 rounded-md cursor-pointer border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]"
                      >
                        Request &rarr;
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      {/* 4. FLOATING CART BAR (WHEN ITEMS IN CART) */}
      {cartTotalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-3 inset-x-3 max-w-md sm:max-w-2xl mx-auto z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#5e2b9d] text-white p-3 rounded-md shadow-lg flex items-center justify-between cursor-pointer hover:bg-[#4d2282] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                {cartTotalItems} items
              </div>
              <span className="text-xs font-semibold">View Dining Tray</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>{formatCurrency(cartTotal)}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* 5. CART DRAWER / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-xl sm:rounded-md max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Your In-Room Order</h3>
                <span className="text-[10px] text-gray-500">Delivering to Room #{room.room_number}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 divide-y divide-gray-100">
              {cart.map((it) => (
                <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-gray-900">{it.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {formatCurrency(it.price)} x {it.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                    <div className="flex items-center gap-1 bg-gray-100 rounded px-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.id, -1)}
                        className="text-gray-600 hover:text-gray-900 font-bold px-1 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold px-1">{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.id, 1)}
                        className="text-gray-600 hover:text-gray-900 font-bold px-1 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Bill Details */}
              <div className="pt-3 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>GST / Tax (5%)</span>
                  <span>{formatCurrency(cartTax)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>Room Delivery Fee</span>
                  <span className="text-emerald-700 font-medium">FREE</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 text-sm pt-2 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span className="text-[#5e2b9d]">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              {/* Guest & Contact Info */}
              <div className="pt-3 space-y-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    placeholder="Guest Name"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                    Mobile Number (For Delivery SMS / Call)
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                    Chef / Kitchen Instructions
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Less spicy, extra ketchup, serve water"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                    Payment Preference
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="pay_at_checkout">Bill to Room (Pay at Checkout)</option>
                    <option value="cash_on_delivery">Cash on Room Delivery</option>
                    <option value="upi_qr_on_delivery">UPI / Card Machine on Delivery</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Order Action */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-10 font-semibold rounded-md cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transmitting Order to Kitchen...
                  </>
                ) : (
                  <>
                    Place Order &bull; {formatCurrency(cartTotal)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SERVICE REQUEST MODAL (FOR HOUSEKEEPING, AMENITIES, REPAIRS) */}
      {selectedServiceItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-xs font-semibold text-gray-900">{selectedServiceItem.name}</h3>
                <span className="text-[10px] text-gray-400 capitalize">
                  Room #{room.room_number} &bull; {selectedServiceItem.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServiceItem(null)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendServiceRequest} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                  Specific Request Notes
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Please send by 4:00 PM, extra 2 towels please."
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={requestPriority}
                  onChange={(e) => setRequestPriority(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                >
                  <option value="low">Standard (Within 30-45 mins)</option>
                  <option value="medium">Prompt (Within 15-20 mins)</option>
                  <option value="urgent">Urgent Assistance Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedServiceItem(null)}
                  className="text-xs h-8 rounded-md cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
                >
                  {isSubmitting ? 'Sending Request...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. RECENT REQUESTS FOOTER BAR */}
      {recentActivities.length > 0 && (
        <footer className="mt-8 pt-4 border-t border-gray-200 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-700">Your Active Room Requests</span>
            <span className="text-[10px] text-gray-400">Live Updates</span>
          </div>

          <div className="space-y-2">
            {recentActivities.slice(0, 3).map((act) => (
              <Link
                key={act.tracking_token}
                href={`/guest/track/${act.tracking_token}`}
                className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-md hover:border-[#5e2b9d] transition-all cursor-pointer text-xs shadow-2xs"
              >
                <div>
                  <div className="font-medium text-gray-900">{act.title}</div>
                  <div className="text-[10px] text-gray-400">Placed at {act.timestamp}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="purple" className="text-[9px] rounded-xs capitalize">
                    {act.status}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </footer>
      )}
    </div>
  )
}

