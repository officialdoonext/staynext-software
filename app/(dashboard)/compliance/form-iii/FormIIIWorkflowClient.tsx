'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  User,
  ShieldCheck,
  Send,
  Save,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ForeignGuestRecord, submitFormIIIAcknowledgment } from '@/services/compliance.service'
import { formatDate } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface FormIIIWorkflowClientProps {
  foreignGuests: ForeignGuestRecord[]
  initialSelectedGuestId?: string
}

export default function FormIIIWorkflowClient({
  foreignGuests,
  initialSelectedGuestId,
}: FormIIIWorkflowClientProps) {
  const [selectedGuestId, setSelectedGuestId] = useState<string>(
    initialSelectedGuestId || foreignGuests[0]?.id || ''
  )
  const [reportType, setReportType] = useState<'Arrival' | 'Departure'>('Arrival')
  const [refNumberInput, setRefNumberInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const activeGuest = foreignGuests.find((g) => g.id === selectedGuestId) || foreignGuests[0]

  const handleDownloadJSON = () => {
    if (!activeGuest) return
    const payload = {
      formVersion: 'Form_III_2025_v1',
      hotelDetails: {
        hotelName: 'StayNext Hotel & Suites',
        hotelCode: 'HOTEL-HYD-0492',
        stateCode: '36',
      },
      reportType,
      submissionTimestamp: new Date().toISOString(),
      guestDetails: {
        fullName: activeGuest.guest_name,
        nationality: activeGuest.passport_issue_country,
        roomAllocated: activeGuest.room_number,
        mobileNumber: activeGuest.mobile_number,
        passport: {
          number: activeGuest.passport_number,
          issueCountry: activeGuest.passport_issue_country,
          issueDate: activeGuest.passport_issue_date,
          expiryDate: activeGuest.passport_expiry_date,
        },
        visa: {
          number: activeGuest.visa_number,
          type: activeGuest.visa_type,
          expiryDate: activeGuest.visa_expiry_date,
          isOCI: activeGuest.is_oci,
        },
        travel: {
          arrivalDateInIndia: activeGuest.arrival_date,
          arrivedFrom: activeGuest.arrived_from,
          proceedingTo: activeGuest.proceeding_to,
          purposeOfVisit: activeGuest.purpose_of_visit,
        },
        addresses: {
          permanentOverseas: activeGuest.permanent_overseas_address,
          addressInIndia: activeGuest.address_in_india,
        },
      },
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `Form_III_${activeGuest.passport_number}_${reportType}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleRecordSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refNumberInput.trim()) {
      setErrorMsg('Please enter the acknowledgment / reference number returned by the FRRO portal.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await submitFormIIIAcknowledgment(activeGuest.id, refNumberInput.trim(), 'Acknowledged')
      if (res.success) {
        setSuccessMsg(`Form III filing recorded with reference #${refNumberInput.trim()}!`)
        activeGuest.form_iii_status = 'Acknowledged'
        activeGuest.form_iii_reference_number = refNumberInput.trim()
        activeGuest.form_iii_submitted_at = new Date().toISOString()
      } else {
        throw new Error(res.error || 'Failed to update submission status')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/compliance">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-gray-900 font-sora">
                Form III 24-Hour Statutory Filing Console
              </h1>
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                Rule 17 Bureau of Immigration
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Foreigners &amp; Immigration Rules 2025: All foreign guest arrivals and departures must be filed within 24 hours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://indianfrro.gov.in/frro/FormC/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 cursor-pointer rounded-md border-[#dfcef6] text-[#5e2b9d] hover:bg-[#f7f2fd]"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open Official FRRO Portal
            </Button>
          </a>
        </div>
      </div>

      {/* Guest Selector & Report Type Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-md border border-gray-200 shadow-2xs">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Foreign Guest Manifest</label>
          <SearchableSelect
            value={selectedGuestId}
            onChange={(val) => setSelectedGuestId(val)}
            options={foreignGuests.map((g) => ({
              value: g.id,
              label: `${g.guest_name} (${g.passport_issue_country}) - Passport: ${g.passport_number} - Status: ${g.form_iii_status}`,
            }))}
            placeholder="Select guest manifest..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Statutory Report Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setReportType('Arrival')}
              className={`py-1.5 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                reportType === 'Arrival'
                  ? 'bg-[#5e2b9d] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Arrival (24h)
            </button>
            <button
              type="button"
              onClick={() => setReportType('Departure')}
              className={`py-1.5 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                reportType === 'Departure'
                  ? 'bg-[#5e2b9d] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Departure (24h)
            </button>
          </div>
        </div>
      </div>

      {activeGuest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Official Form III Printable / Verified Manifest Sheet */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-gray-200 rounded-md shadow-2xs bg-white">
              <CardHeader className="pb-3 border-b border-gray-100 bg-[#f7f2fd]/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-[#5e2b9d] block">
                      Government of India &bull; Ministry of Home Affairs
                    </span>
                    <CardTitle className="text-sm font-bold text-gray-900 mt-0.5">
                      FORM III – Foreign Guest {reportType} Report
                    </CardTitle>
                    <span className="text-[10px] text-gray-500">
                      Rule 17 of Immigration and Foreigners Rules 2025
                    </span>
                  </div>
                  <Badge
                    variant={activeGuest.form_iii_status === 'Acknowledged' ? 'success' : 'warning'}
                    className="text-[10px] rounded-xs"
                  >
                    {activeGuest.form_iii_status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs">
                {/* 1. Guest Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#5e2b9d]" />
                    1. Foreign Guest Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Full Name:</span>
                      <span className="font-medium text-gray-900">{activeGuest.guest_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Nationality:</span>
                      <span className="font-medium text-gray-900">{activeGuest.passport_issue_country}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Contact in India:</span>
                      <span className="font-medium text-gray-900">{activeGuest.mobile_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Allocated Hotel Unit:</span>
                      <span className="font-medium text-purple-700">Room #{activeGuest.room_number || '304'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Passport & Visa Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#5e2b9d]" />
                    2. Passport &amp; Immigration Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Passport Number:</span>
                      <span className="font-mono font-medium text-gray-900">{activeGuest.passport_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Passport Expiry:</span>
                      <span className="font-medium text-gray-900">
                        {activeGuest.passport_expiry_date ? formatDate(activeGuest.passport_expiry_date) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Visa / OCI Number:</span>
                      <span className="font-mono font-medium text-gray-900">
                        {activeGuest.visa_number || (activeGuest.is_oci ? 'OCI Holder' : 'Exempt')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Visa Type &amp; Expiry:</span>
                      <span className="font-medium text-gray-900">
                        {activeGuest.visa_type || 'Tourist'} &bull; {activeGuest.visa_expiry_date ? formatDate(activeGuest.visa_expiry_date) : 'Valid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Travel Route */}
                <div>
                  <h4 className="font-semibold text-gray-900 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#5e2b9d]" />
                    3. Travel Route &amp; Purpose
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Date of Arrival in India:</span>
                      <span className="font-medium text-gray-900">{formatDate(activeGuest.arrival_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Arrived From:</span>
                      <span className="font-medium text-gray-900">{activeGuest.arrived_from}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Proceeding To (Next Destination):</span>
                      <span className="font-medium text-gray-900">{activeGuest.proceeding_to}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Purpose of Visit:</span>
                      <span className="font-medium text-gray-900">{activeGuest.purpose_of_visit}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Addresses */}
                <div>
                  <h4 className="font-semibold text-gray-900 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-[#5e2b9d]" />
                    4. Residential Addresses
                  </h4>
                  <div className="space-y-2 pt-2">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Permanent Address in Home Country:</span>
                      <span className="text-gray-800">{activeGuest.permanent_overseas_address || 'Address registered on file'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Address / Accommodation in India:</span>
                      <span className="text-gray-800">{activeGuest.address_in_india || 'StayNext Hotel & Suites, Room ' + (activeGuest.room_number || '304')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission & Action Panel */}
          <div className="space-y-5">
            <Card className="border-[#dfcef6] bg-[#f7f2fd]/30 rounded-md shadow-2xs">
              <CardHeader className="pb-3 border-b border-[#eee4fa]">
                <CardTitle className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-[#5e2b9d]" />
                  Step 1: Download FRRO Manifest Payload
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3.5 space-y-3">
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Export the pre-formatted Form III document payload formatted for submission to the Bureau of Immigration portal.
                </p>
                <Button
                  onClick={handleDownloadJSON}
                  size="sm"
                  className="w-full bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download Form III JSON
                </Button>
                <div className="text-[10px] text-gray-400">
                  Upload this file or manually verify on <a href="https://indianfrro.gov.in/frro/FormC/" target="_blank" rel="noopener noreferrer" className="text-[#5e2b9d] underline">indianfrro.gov.in</a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 rounded-md shadow-2xs">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Step 2: Record Official FRRO Acknowledgment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3.5 space-y-3">
                {errorMsg && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-700">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleRecordSubmission} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      FRRO Acknowledgment / Ref # *
                    </label>
                    <input
                      type="text"
                      value={refNumberInput}
                      onChange={(e) => setRefNumberInput(e.target.value)}
                      placeholder="e.g. FRRO/HYD/2026/89421"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] font-mono"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 cursor-pointer rounded-md font-medium"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {isSubmitting ? 'Recording...' : 'Mark Form III as Acknowledged'}
                  </Button>
                </form>

                {activeGuest.form_iii_reference_number && (
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                    <span className="font-semibold text-gray-800">Current Filing:</span>
                    <div className="font-mono text-purple-700 mt-0.5 font-medium">
                      {activeGuest.form_iii_reference_number}
                    </div>
                    {activeGuest.form_iii_submitted_at && (
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Logged on: {formatDate(activeGuest.form_iii_submitted_at)}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
