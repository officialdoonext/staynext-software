'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Utensils,
  Sparkles,
  PhoneCall,
  RotateCcw,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'

interface GuestTrackingClientProps {
  requestData?: any
  orderData?: any
}

export default function GuestTrackingClient({
  requestData,
  orderData,
}: GuestTrackingClientProps) {
  const [rating, setRating] = useState<number>(5)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  if (!requestData && !orderData) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-base font-semibold text-gray-900">Request Not Found</h2>
        <p className="text-xs text-gray-500">
          The tracking link is invalid or may have expired after completion.
        </p>
      </div>
    )
  }

  const isOrder = !!orderData
  const hotelName = isOrder ? orderData.hotel_name : requestData.hotel_name
  const hotelPhone = isOrder ? orderData.hotel_phone : requestData.hotel_phone
  const roomNumber = isOrder ? orderData.room_number : requestData.room_number

  // Status mapping
  const orderSteps = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']
  const requestSteps = ['pending', 'acknowledged', 'in_progress', 'completed']

  const currentStep = isOrder ? orderData.status : requestData.status

  const getStepIndex = (steps: string[], status: string) => {
    const idx = steps.indexOf(status)
    return idx === -1 ? 0 : idx
  }

  const activeIndex = isOrder
    ? getStepIndex(orderSteps, currentStep)
    : getStepIndex(requestSteps, currentStep)

  const stepsList = isOrder
    ? [
        { key: 'placed', label: 'Order Placed' },
        { key: 'confirmed', label: 'Kitchen Confirmed' },
        { key: 'preparing', label: 'Preparing Food' },
        { key: 'out_for_delivery', label: 'Tray on the Way' },
        { key: 'delivered', label: 'Delivered to Room' },
      ]
    : [
        { key: 'pending', label: 'Request Queued' },
        { key: 'acknowledged', label: 'Staff Acknowledged' },
        { key: 'in_progress', label: 'Work in Progress' },
        { key: 'completed', label: 'Completed' },
      ]

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <span className="text-xs font-semibold text-[#5e2b9d] uppercase tracking-wider block">
            {hotelName}
          </span>
          <h1 className="text-sm font-semibold text-gray-900">
            {isOrder ? `Dining Order #${orderData.order_number}` : `Room Service: ${requestData.request_type}`}
          </h1>
          <span className="text-[10px] text-gray-500">Room #{roomNumber}</span>
        </div>

        {hotelPhone && (
          <a
            href={`tel:${hotelPhone}`}
            className="p-2 bg-white border border-gray-200 rounded-md text-gray-700 hover:text-[#5e2b9d] cursor-pointer"
            title="Call Front Desk"
          >
            <PhoneCall className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Live Timeline Tracker */}
      <Card className="border-[#dfcef6] bg-white rounded-md shadow-2xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-[#f7f2fd]/40">
          <CardTitle className="text-xs font-semibold text-gray-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#5e2b9d]">
              <Clock className="h-4 w-4" />
              Live Status Timeline
            </span>
            <Badge variant="purple" className="text-[10px] rounded-xs capitalize">
              {currentStep.replace(/_/g, ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {stepsList.map((st, idx) => {
              const isPast = idx <= activeIndex
              const isCurrent = idx === activeIndex

              return (
                <div key={st.key} className="flex items-center gap-3 relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 transition-colors ${
                      isPast
                        ? 'bg-[#5e2b9d] text-white shadow-xs'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <div>
                    <span
                      className={`text-xs block ${
                        isCurrent
                          ? 'font-bold text-[#5e2b9d]'
                          : isPast
                          ? 'font-medium text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {st.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-gray-500">Currently in progress</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-2 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs h-7 px-3 rounded-md cursor-pointer border-gray-200"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Item Details */}
      {isOrder ? (
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardHeader className="pb-2.5 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-900">
              Ordered Items ({orderData.items?.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs">
            {orderData.items?.map((it: any) => (
              <div key={it.id} className="flex justify-between items-center text-gray-700">
                <span>{it.quantity}x {it.name}</span>
                <span className="font-medium text-gray-900">{formatCurrency(it.total_price)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px] text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(orderData.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes:</span>
                <span>{formatCurrency(orderData.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-xs text-gray-900 pt-1 border-t border-gray-100">
                <span>Total:</span>
                <span className="text-[#5e2b9d]">{formatCurrency(orderData.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardHeader className="pb-2.5 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-900">Request Description</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-gray-700">
            <p>{requestData.description}</p>
            {requestData.updates?.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Staff Notes &amp; Updates
                </span>
                {requestData.updates.map((u: any) => (
                  <div key={u.id} className="p-2 bg-gray-50 rounded text-[11px] text-gray-600 border border-gray-100">
                    <div>{u.message}</div>
                    <span className="text-[9px] text-gray-400 block mt-0.5">{u.updated_by} &bull; {formatDate(u.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completion Rating */}
      {currentStep === 'completed' || currentStep === 'delivered' ? (
        <Card className="border-emerald-200 bg-emerald-50/40 rounded-md p-4 text-center space-y-2 shadow-2xs">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
          <h3 className="text-xs font-semibold text-emerald-900">Service Completed!</h3>
          <p className="text-[11px] text-emerald-700">
            How was your service experience?
          </p>
          {!feedbackSubmitted ? (
            <div className="pt-2 flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star)
                    setFeedbackSubmitted(true)
                  }}
                  className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star className={`h-5 w-5 ${star <= rating ? 'fill-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-emerald-800 font-semibold pt-1">
              Thank you for your rating! We hope you enjoy your stay.
            </div>
          )}
        </Card>
      ) : null}
    </div>
  )
}

