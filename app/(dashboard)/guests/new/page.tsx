'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Mail, MapPin, Crown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AddGuestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: 'United States',
    idType: 'Passport',
    idNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    country: 'United States',
    isVip: false,
    vipTier: 'Standard',
    preferences: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData((prev) => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      toast.success(`Guest profile for ${formData.firstName} ${formData.lastName} created!`)
      setLoading(false)
      router.push('/guests')
    }, 500)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <Link href="/guests">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Guest Directory
          </Button>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-semibold text-gray-900">Add New Guest</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Register Guest Profile
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Store contact details, identity documentation, loyalty classification, and personalized preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Personal &amp; Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Marcus"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Vance"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="m.vance@chicago.com"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (312) 555-9012"
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Identification &amp; VIP Loyalty Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="idType" className="text-xs">ID Document Type</Label>
              <select
                id="idType"
                name="idType"
                value={formData.idType}
                onChange={handleChange}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Passport">Passport</option>
                <option value="Drivers License">Driver&apos;s License</option>
                <option value="National ID">National Identity Card</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idNumber" className="text-xs">Document Number</Label>
              <Input
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="P9842109"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vipTier" className="text-xs">VIP Loyalty Tier</Label>
              <select
                id="vipTier"
                name="vipTier"
                value={formData.vipTier}
                onChange={handleChange}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Standard">Standard Guest</option>
                <option value="Gold">Gold VIP</option>
                <option value="Platinum">Platinum VIP</option>
                <option value="Diamond">Diamond Elite</option>
              </select>
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="preferences" className="text-xs">Personal Stay Preferences</Label>
              <textarea
                id="preferences"
                name="preferences"
                rows={2}
                value={formData.preferences}
                onChange={handleChange}
                placeholder="High floor, extra hypoallergenic pillows, late checkout preference..."
                className="w-full p-2.5 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
          <Link href="/guests">
            <Button type="button" variant="outline" className="text-xs h-9">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-6 font-semibold shadow-sm"
          >
            {loading ? 'Saving...' : 'Save Guest Profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}

