import React from 'react'

export const metadata = {
  title: 'In-Room Guest Self-Service | StayNext',
  description: 'Digital In-Room Dining, Housekeeping & Concierge Services',
}

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf9fe] text-gray-900 font-sans antialiased selection:bg-[#5e2b9d] selection:text-white pb-16">
      {children}
    </div>
  )
}

