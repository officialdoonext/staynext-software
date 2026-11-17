'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { signUpTenantAction, signInTenantAction } from '@/services/auth.server'
import Link from 'next/link'

interface AuthFormProps {
  initialTab?: 'signin' | 'signup'
}

export default function AuthForm({ initialTab = 'signin' }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(
    tabParam === 'signup' ? 'signup' : initialTab
  )

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Signup State
  const [signupData, setSignupData] = useState({
    propertyName: '',
    mobileNumber: '',
    username: '',
    email: '',
    password: '',
    city: '',
    address: '',
  })
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)

  const handleSignupChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    })
  }

  // Handle Sign In Submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    try {
      const res = await signInTenantAction(
        loginIdentifier.trim(),
        loginPassword
      )

      if (!res.success) {
        setLoginError(res.error || 'Failed to sign in. Please verify credentials.')
        setLoginLoading(false)
        return
      }

      if (res.access?.isAllowed) {
        toast.success('Login successful! Welcome back.')
        router.push('/dashboard')
      } else {
        toast.warning(
          'Account is inactive or subscription expired. Redirecting to onboarding...'
        )
        router.push(res.redirectTo || '/onboarding')
      }
      router.refresh()
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials. Please verify and try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Sign Up Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError(null)

    if (signupData.password.length < 6) {
      setSignupError('Password must be at least 6 characters.')
      return
    }

    setSignupLoading(true)

    try {
      const res = await signUpTenantAction({
        propertyName: signupData.propertyName.trim(),
        mobileNumber: signupData.mobileNumber.trim(),
        username: signupData.username.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        city: signupData.city.trim(),
        address: signupData.address.trim(),
      })

      if (!res.success) {
        setSignupError(res.error || 'Registration failed. Please check details and try again.')
        setSignupLoading(false)
        return
      }

      toast.info('Account registered with status: Inactive (Expired).')
      toast.success('Redirecting to Onboarding Verification...')
      router.push(res.redirectTo || '/onboarding')
      router.refresh()
    } catch (err: any) {
      setSignupError(
        err.message || 'Registration failed. Please check details and try again.'
      )
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-md mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('signin')
            setLoginError(null)
          }}
          className={`py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'signin'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('signup')
            setSignupError(null)
          }}
          className={`py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'signup'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Register Property</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SIGN IN FORM */}
      {/* ======================================================== */}
      {activeTab === 'signin' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          {loginError && (
            <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="loginIdentifier">Email or Username</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="loginIdentifier"
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="pl-9 h-10 text-sm rounded-md"
                placeholder="manager@hotel.com or username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="loginPassword">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#5e2b9d] hover:text-[#4d2282] font-medium cursor-pointer"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="loginPassword"
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="pl-9 pr-10 h-10 text-sm rounded-md"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showLoginPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loginLoading}
            className="w-full h-10 bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-sm shadow-sm transition-all rounded-md cursor-pointer"
          >
            {loginLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Sign In to Software
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="pt-2 text-center text-xs text-gray-500">
            Need to register a new property?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="text-[#5e2b9d] hover:underline font-medium cursor-pointer"
            >
              Sign up here
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* SIGN UP FORM (MULTI-TENANT SIGNUP) */}
      {/* ======================================================== */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-3.5">
          {signupError && (
            <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{signupError}</span>
            </div>
          )}

          {/* Property Name */}
          <div className="space-y-1">
            <Label htmlFor="propertyName">Property Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="propertyName"
                name="propertyName"
                type="text"
                required
                value={signupData.propertyName}
                onChange={handleSignupChange}
                className="pl-9 h-9 text-sm rounded-md"
                placeholder="Grand Horizon Hotel & Suites"
              />
            </div>
          </div>

          {/* Mobile Number & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  required
                  value={signupData.mobileNumber}
                  onChange={handleSignupChange}
                  className="pl-9 h-9 text-sm rounded-md"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={signupData.username}
                  onChange={handleSignupChange}
                  className="pl-9 h-9 text-sm rounded-md"
                  placeholder="hotel_admin"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <Label htmlFor="signupEmail">Work Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="signupEmail"
                name="email"
                type="email"
                required
                value={signupData.email}
                onChange={handleSignupChange}
                className="pl-9 h-9 text-sm rounded-md"
                placeholder="manager@property.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="signupPassword">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="signupPassword"
                name="password"
                type={showSignupPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={signupData.password}
                onChange={handleSignupChange}
                className="pl-9 pr-10 h-9 text-sm rounded-md"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showSignupPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* City */}
          <div className="space-y-1">
            <Label htmlFor="city">City</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="city"
                name="city"
                type="text"
                required
                value={signupData.city}
                onChange={handleSignupChange}
                className="pl-9 h-9 text-sm rounded-md"
                placeholder="e.g. Mumbai, New Delhi, Bengaluru"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label htmlFor="address">Property Address</Label>
            <textarea
              id="address"
              name="address"
              rows={2}
              required
              value={signupData.address}
              onChange={handleSignupChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] focus:border-[#5e2b9d] resize-none"
              placeholder="Full street address, area / landmark"
            />
          </div>

          {/* Policy notice */}
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              New property accounts are registered with <strong>Inactive</strong> status and an expired trial. Administrator activation is required before software access is granted.
            </span>
          </div>

          <Button
            type="submit"
            disabled={signupLoading}
            className="w-full h-10 bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-sm shadow-sm transition-all rounded-md cursor-pointer"
          >
            {signupLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Registering Tenant...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Register Property Account
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="pt-1 text-center text-xs text-gray-500">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className="text-[#5e2b9d] hover:underline font-medium cursor-pointer"
            >
              Sign in to your property
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
