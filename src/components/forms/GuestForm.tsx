'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Crown,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createGuest } from '@/services/crm.service'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'

export default function GuestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    salutation: 'Mr',
    first_name: '',
    last_name: '',
    gender: 'Male',
    dob: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    guest_category: 'Indian',
    nationality: 'India',
    id_type: 'aadhaar',
    id_number: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    country: 'India',
    company_name: '',
    company_gstin: '',
    preferred_meal_plan: 'EP',
    preferred_language: 'English',
    is_vip: false,
    vip_tier: 'Gold VIP',
    preferences: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMsg('First name and last name are required.')
      return
    }

    setLoading(true)

    try {
      const res = await createGuest(formData)
      if (!res.success) throw new Error(res.error || 'Failed to save guest')

      setSuccessMsg(`Guest profile for ${formData.first_name} ${formData.last_name} created successfully!`)
      setTimeout(() => {
        router.push('/guests')
        router.refresh()
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving guest profile.')
    } finally {
      setLoading(false)
    }
  }

  const salutationOptions = [
    { value: 'Mr', label: 'Mr.' },
    { value: 'Mrs', label: 'Mrs.' },
    { value: 'Ms', label: 'Ms.' },
    { value: 'Dr', label: 'Dr.' },
    { value: 'CA', label: 'CA' },
    { value: 'Prof', label: 'Prof.' },
  ]

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ]

  const guestCategoryOptions = [
    { value: 'Indian', label: 'Indian Resident' },
    { value: 'Foreign', label: 'Foreign National (Form III)' },
    { value: 'OCI', label: 'OCI Cardholder' },
  ]

  const idTypeOptions = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'voter_id', label: 'Voter ID' },
    { value: 'pan_card', label: 'PAN Card' },
  ]

  const mealPlanOptions = [
    { value: 'EP', label: 'EP - Room Only' },
    { value: 'CP', label: 'CP - Bed & Breakfast' },
    { value: 'MAP', label: 'MAP - Half Board' },
    { value: 'AP', label: 'AP - Full Board' },
  ]

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Kannada', label: 'Kannada' },
    { value: 'Bengali', label: 'Bengali' },
  ]

  const vipTierOptions = [
    { value: 'Silver VIP', label: 'Silver VIP' },
    { value: 'Gold VIP', label: 'Gold VIP' },
    { value: 'Platinum VIP', label: 'Platinum VIP' },
    { value: 'Celebrity / VVIP', label: 'Celebrity / VVIP' },
  ]

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/guests">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Register Guest Profile
            </h1>
            <p className="text-xs text-gray-500">
              Save contact details, identity proof, loyalty tier, and personalized room preferences.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-gray-200 rounded-md shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-[#5e2b9d]" />
              Personal &amp; Identity Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Salutation</label>
                <SearchableSelect
                  value={formData.salutation}
                  onChange={(val) => setFormData((prev) => ({ ...prev, salutation: val }))}
                  options={salutationOptions}
                  allowAdd={true}
                  addNewLabel="Add Salutation"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Rahul"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Sharma"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                <SearchableSelect
                  value={formData.gender}
                  onChange={(val) => setFormData((prev) => ({ ...prev, gender: val }))}
                  options={genderOptions}
                  allowAdd={true}
                  addNewLabel="Add Gender"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                <CustomDatePicker
                  value={formData.dob}
                  onChange={(val) => setFormData((prev) => ({ ...prev, dob: val }))}
                  placeholder="Select birth date..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mobile (+91) *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul.sharma@example.com"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Guest Category</label>
                <SearchableSelect
                  value={formData.guest_category}
                  onChange={(val) => setFormData((prev) => ({ ...prev, guest_category: val }))}
                  options={guestCategoryOptions}
                  allowAdd={true}
                  addNewLabel="Add Category"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Identity Proof Type</label>
                <SearchableSelect
                  value={formData.id_type}
                  onChange={(val) => setFormData((prev) => ({ ...prev, id_type: val }))}
                  options={idTypeOptions}
                  allowAdd={true}
                  addNewLabel="Add ID Type"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Document ID Number</label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              {/* Address Section */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Flat / House #, Street Name, Area"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State &amp; PIN Code</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="400001"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                  />
                </div>
              </div>

              {/* B2B / Corporate Billing */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Tata Consultancy Services"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Company GSTIN (For B2B Tax Invoice)</label>
                <input
                  type="text"
                  name="company_gstin"
                  value={formData.company_gstin}
                  onChange={handleChange}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Meal Plan</label>
                <SearchableSelect
                  value={formData.preferred_meal_plan}
                  onChange={(val) => setFormData((prev) => ({ ...prev, preferred_meal_plan: val }))}
                  options={mealPlanOptions}
                  allowAdd={true}
                  addNewLabel="Add Meal Plan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Language</label>
                <SearchableSelect
                  value={formData.preferred_language}
                  onChange={(val) => setFormData((prev) => ({ ...prev, preferred_language: val }))}
                  options={languageOptions}
                  allowAdd={true}
                  addNewLabel="Add Language"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    name="is_vip"
                    checked={formData.is_vip}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
                  />
                  <span className="font-medium text-amber-700 flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5" />
                    Mark as VIP Guest
                  </span>
                </label>
              </div>

              {formData.is_vip && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">VIP Tier</label>
                  <SearchableSelect
                    value={formData.vip_tier}
                    onChange={(val) => setFormData((prev) => ({ ...prev, vip_tier: val }))}
                    options={vipTierOptions}
                    allowAdd={true}
                    addNewLabel="Add VIP Tier"
                  />
                </div>
              )}

              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Guest Preferences &amp; Special Requirements
                </label>
                <textarea
                  name="preferences"
                  value={formData.preferences}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Vegetarian diet, high floor room, feather-free pillows."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Link href="/guests">
            <Button variant="outline" type="button" className="text-xs h-9 rounded-md cursor-pointer">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium text-xs h-9 rounded-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save Guest Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

