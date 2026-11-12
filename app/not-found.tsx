import React from 'react'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, CalendarCheck, ConciergeBell, BedDouble, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Page Not Found | StayNext PMS',
  description: 'The requested page could not be found.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 mb-2">
          <span className="text-2xl font-black font-mono">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-500">
            The page you are looking for does not exist or may have been relocated.
          </p>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 text-left">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-xs font-medium text-gray-700 hover:text-indigo-600"
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/reservations"
              className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-xs font-medium text-gray-700 hover:text-indigo-600"
            >
              <CalendarCheck className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Reservations</span>
            </Link>
            <Link
              href="/front-desk"
              className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-xs font-medium text-gray-700 hover:text-indigo-600"
            >
              <ConciergeBell className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Front Desk</span>
            </Link>
            <Link
              href="/rooms"
              className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-xs font-medium text-gray-700 hover:text-indigo-600"
            >
              <BedDouble className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Rooms</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
