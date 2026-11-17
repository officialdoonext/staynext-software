'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Phone,
  User,
  Mail,
  MapPin,
  Home,
  ShieldAlert,
  Clock,
  RefreshCw,
  LogOut,
  Lock,
  CalendarX,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { TenantProfile } from '@/services/auth.service'
import { refreshTenantStatusAction } from '@/services/auth.server'
import { formatDate } from '@/lib/utils'

interface OnboardingClientProps {
  profile: TenantProfile | null
  userEmail?: string
}

export default function OnboardingClient({
  profile,
  userEmail,
}: OnboardingClientProps) {
  const router = useRouter()
  const [currentProfile, setCurrentProfile] = useState<TenantProfile | null>(profile)
  const [checking, setChecking] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const propertyName = currentProfile?.propertyName || 'Registered Property'
  const mobileNumber = currentProfile?.mobileNumber || 'Not provided'
  const username = currentProfile?.username || 'user'
  const email = currentProfile?.email || userEmail || 'user@property.com'
  const city = currentProfile?.city || 'Not provided'
  const address = currentProfile?.address || 'Not provided'
  const status = currentProfile?.status || 'inactive'
  const expiryDate = currentProfile?.expiryDate
    ? new Date(currentProfile.expiryDate)
    : new Date(Date.now() - 86400000)

  const handleRefreshStatus = async () => {
    setChecking(true)
    try {
      const res = await refreshTenantStatusAction()

      if (!res.success || !res.profile) {
        toast.error(res.error || 'Unable to refresh profile status.')
        return
      }

      // Update state instantly with zero lag!
      setCurrentProfile(res.profile)

      if (res.isActivated) {
        toast.success('Your property account has been activated! Unlocking software...')
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.info('Status updated: Account is Inactive & Expired. Waiting for administrator activation.')
      }
    } catch {
      toast.error('Unable to refresh status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('Signed out successfully.')
      router.push('/login')
      router.refresh()
    } catch {
      router.push('/login')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Software Blocked Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-amber-600 rounded-md p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-md backdrop-blur-sm shrink-0">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Access Blocked
                </span>
                <span className="text-xs text-rose-100">Multi-Tenant Guard Active</span>
              </div>
              <h2 className="text-xl font-medium mt-1 text-white">
                Software Access Restricted: Onboarding Review Required
              </h2>
              <p className="text-xs text-rose-100 mt-1 max-w-xl">
                This property account is currently inactive and its subscription period is expired. Direct access to front-desk, reservations, billing, and hotel operations is protected and locked.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center gap-2 shrink-0">
            <Button
              onClick={handleRefreshStatus}
              disabled={checking}
              className="bg-white text-gray-900 hover:bg-gray-100 font-medium text-xs h-9 shadow-sm rounded-md cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking Status...' : 'Refresh Status'}
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={signingOut}
              variant="outline"
              className="bg-black/20 hover:bg-black/30 border-white/30 text-white font-medium text-xs h-9 rounded-md cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Registered Tenant Profile Card */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#5e2b9d]" />
              Registered Property Details
            </h3>
            <p className="text-xs text-gray-500 font-normal">
              Your multi-tenant profile saved in Supabase
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-200 text-xs rounded-md">
              Status: {status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs rounded-md">
              Subscription: Expired
            </Badge>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Name */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Property Name</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{propertyName}</p>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="p-2 bg-green-100 text-green-700 rounded-md shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Mobile Number</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{mobileNumber}</p>
            </div>
          </div>

          {/* Username */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="p-2 bg-[#f7f2fd] text-[#5e2b9d] rounded-md shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Username</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{username}</p>
            </div>
          </div>

          {/* Work Email */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Work Email</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{email}</p>
            </div>
          </div>

          {/* City */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-md shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">City</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{city}</p>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-rose-50/60 border border-rose-100">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-md shrink-0">
              <CalendarX className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-rose-500 uppercase tracking-wider">Subscription Expiry</p>
              <p className="text-sm font-medium text-rose-900 truncate mt-0.5">
                {formatDate(expiryDate)} (Expired Yesterday)
              </p>
            </div>
          </div>

          {/* Address (Full Width) */}
          <div className="md:col-span-2 flex items-start gap-3 p-3.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-md shrink-0">
              <Home className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Property Address</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">{address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Administrator Activation Notice (Strictly no self-activation option) */}
      <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-md shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">
              Administrator Activation &amp; Approval Required
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed font-normal">
              In accordance with multi-tenant security and subscription policies, property activation cannot be toggled directly by the user from this page. An administrator must approve your tenant account and extend your subscription license in the Supabase management database.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Data securely stored in database
              </span>
              <span className="text-gray-300">&bull;</span>
              <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                URLs protected from direct access
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
