import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerTenantProfile } from '@/services/auth.server'
import OnboardingClient from './OnboardingClient'

export const metadata: Metadata = {
  title: 'Property Onboarding & Status | StayNext',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getServerTenantProfile()

  // If already active and valid, redirect to the software dashboard!
  if (profile && profile.isActive && !profile.isExpired) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b border-gray-200 bg-white py-4 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            SN
          </div>
          <div>
            <span className="font-bold text-base text-gray-900 tracking-tight">StayNext</span>
            <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 uppercase">
              Multi-Tenant
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 my-auto">
        <OnboardingClient profile={profile} userEmail={user.email} />
      </main>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-200 bg-white">
        StayNext Hotel, Lodge &amp; Resort Multi-Tenant Management Platform &bull; All Rights Reserved
      </footer>
    </div>
  )
}
