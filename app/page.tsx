'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500 text-sm">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span className="font-medium text-gray-700">Redirecting to StayNext Dashboard...</span>
      </div>
    </div>
  )
}
