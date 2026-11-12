'use client'

import React, { useState } from 'react'
import { Search, Calendar, Users, DoorClosed, Receipt, FileText, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-gray-200 bg-white">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reservation ID, guest name, mobile, room, invoice..."
            className="w-full px-3 py-4 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-80 overflow-y-auto p-4 space-y-4">
          {query.trim().length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                Quick Navigation & Search
              </p>
              <div className="grid grid-cols-2 gap-2 text-left mt-3">
                <Link
                  href="/reservations"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700"
                >
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>All Reservations</span>
                </Link>
                <Link
                  href="/front-desk"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700"
                >
                  <DoorClosed className="h-4 w-4 text-indigo-600" />
                  <span>Front Desk Check-in</span>
                </Link>
                <Link
                  href="/guests"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700"
                >
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>Guest Directory</span>
                </Link>
                <Link
                  href="/billing"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700"
                >
                  <Receipt className="h-4 w-4 text-indigo-600" />
                  <span>Guest Folios & Invoices</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Matches for &quot;{query}&quot;
              </div>
              <div className="divide-y divide-gray-100">
                <Link
                  href={`/reservations?search=${encodeURIComponent(query)}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-indigo-50/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                        Search reservations for &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-gray-500">Search by Reservation ID or Stay Dates</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                </Link>

                <Link
                  href={`/guests?search=${encodeURIComponent(query)}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-indigo-50/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                        Search guests for &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-gray-500">Search by Name, Email, or Phone</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                </Link>

                <Link
                  href={`/billing?search=${encodeURIComponent(query)}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-indigo-50/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                        Search invoices & folios for &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-gray-500">Search by Invoice Number or Folio ID</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

