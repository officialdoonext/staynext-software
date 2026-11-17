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
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-md">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-gray-200 bg-white">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reservation ID, guest name, mobile, room, invoice..."
            className="w-full px-3 py-4 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400 font-normal"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-80 overflow-y-auto p-4 space-y-4">
          {query.trim().length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">
                Quick Navigation &amp; Search
              </p>
              <div className="grid grid-cols-2 gap-2 text-left mt-3">
                <Link
                  href="/reservations"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700 cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-[#5e2b9d]" />
                  <span>All Reservations</span>
                </Link>
                <Link
                  href="/front-desk"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700 cursor-pointer"
                >
                  <DoorClosed className="h-4 w-4 text-[#5e2b9d]" />
                  <span>Front Desk Check-in</span>
                </Link>
                <Link
                  href="/guests"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700 cursor-pointer"
                >
                  <Users className="h-4 w-4 text-[#5e2b9d]" />
                  <span>Guest Directory</span>
                </Link>
                <Link
                  href="/billing"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-xs text-gray-700 cursor-pointer"
                >
                  <Receipt className="h-4 w-4 text-[#5e2b9d]" />
                  <span>Guest Folios &amp; Invoices</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Matches for &quot;{query}&quot;
              </div>
              <div className="divide-y divide-gray-100">
                <Link
                  href={`/reservations?search=${encodeURIComponent(query)}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f7f2fd]/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-[#5e2b9d]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-[#5e2b9d]">
                        Search reservations for &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-gray-500">Search by Reservation ID or Stay Dates</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#5e2b9d]" />
                </Link>

                <Link
                  href={`/guests?search=${encodeURIComponent(query)}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f7f2fd]/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-[#5e2b9d]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-[#5e2b9d]">
                        Search guests for &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-gray-500">Search by Name, Email, or Phone</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#5e2b9d]" />
                </Link>

                <Link
                  href={`/billing?search=${encodeURIComponent(query)}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f7f2fd]/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[#5e2b9d]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-[#5e2b9d]">
                        Search invoices &amp; folios for &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-gray-500">Search by Invoice Number or Folio ID</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#5e2b9d]" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
