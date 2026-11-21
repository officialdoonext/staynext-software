'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  FileCheck,
  Save,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PropertyLicenseRecord, savePropertyLicense } from '@/services/compliance.service'
import { formatDate } from '@/lib/utils'

interface PropertyLicensesClientProps {
  initialLicenses: PropertyLicenseRecord[]
}

export default function PropertyLicensesClient({ initialLicenses }: PropertyLicensesClientProps) {
  const [licenses, setLicenses] = useState<PropertyLicenseRecord[]>(initialLicenses)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const oneYearLaterStr = new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    license_type: 'Municipal Corporation Trade Licence',
    license_number: '',
    issuing_authority: '',
    issue_date: todayStr,
    expiry_date: oneYearLaterStr,
    alert_days: 60,
    status: 'Active' as const,
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.license_number.trim() || !formData.issuing_authority.trim()) {
      setErrorMsg('License number and issuing authority are required.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await savePropertyLicense(formData)
      if (!res.success) throw new Error(res.error || 'Failed to save license')

      setLicenses((prev) => [
        {
          id: `lic-${Date.now()}`,
          ...formData,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])

      setSuccessMsg('Property statutory permit registered successfully!')
      setTimeout(() => {
        setShowAddModal(false)
        setSuccessMsg('')
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving permit')
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
                Property Licenses &amp; Statutory Permits
              </h1>
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                Operating Permits
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Track renewal timelines and statutory compliance across Municipal, Fire, Food Safety, Lift, and Pollution permits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Statutory Permit
          </Button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Card className="border-[#dfcef6] bg-[#f7f2fd]/30 rounded-md shadow-sm">
          <CardHeader className="pb-3 border-b border-[#eee4fa]">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>Register Property Statutory Permit</span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {errorMsg && (
              <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 mb-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Permit / License Type *</label>
                  <select
                    value={formData.license_type}
                    onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="Municipal Corporation Trade Licence">Municipal Corporation Trade Licence</option>
                    <option value="Fire Safety NOC (Form 15)">Fire Safety NOC (Form 15)</option>
                    <option value="FSSAI Food Business Operator Licence">FSSAI Food Business Licence</option>
                    <option value="State Pollution Control Board Consent (CTO)">Pollution Control Board Consent (CTO)</option>
                    <option value="Lift Safety & Maintenance Certificate">Lift Safety &amp; Inspectorate Certificate</option>
                    <option value="State Tourism Department Registration">State Tourism Department Registration</option>
                    <option value="Bar / Liquor Service Licence (Form 2B)">Bar / Liquor Service Licence</option>
                    <option value="Swimming Pool Safety NOC">Swimming Pool Safety NOC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Permit / License Number *</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="e.g. GHMC/TL/2025/9421"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issuing Department / Authority *</label>
                  <input
                    type="text"
                    value={formData.issuing_authority}
                    onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                    placeholder="e.g. Food Safety and Standards Authority"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Issue</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Expiry</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Alert Days Before Expiry</label>
                  <select
                    value={formData.alert_days}
                    onChange={(e) => setFormData({ ...formData, alert_days: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] cursor-pointer"
                  >
                    <option value="30">30 Days Prior</option>
                    <option value="60">60 Days Prior</option>
                    <option value="90">90 Days Prior</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs h-8 rounded-md cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="bg-[#5e2b9d] text-white text-xs h-8 rounded-md cursor-pointer font-medium"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Statutory Permit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid of Licenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {licenses.map((lic) => {
          const daysLeft = getDaysRemaining(lic.expiry_date)
          const isExpiringSoon = daysLeft <= (lic.alert_days || 60) && daysLeft > 0
          const isExpired = daysLeft <= 0

          return (
            <Card
              key={lic.id}
              className={`border rounded-md shadow-2xs transition-all flex flex-col justify-between ${
                isExpired
                  ? 'border-red-300 bg-red-50/20'
                  : isExpiringSoon
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{lic.license_type}</h3>
                    <span className="font-mono text-[10px] text-gray-500 font-medium block mt-0.5">
                      {lic.license_number}
                    </span>
                  </div>
                  <Badge
                    variant={isExpired ? 'destructive' : isExpiringSoon ? 'warning' : 'outline'}
                    className="text-[10px] rounded-xs shrink-0"
                  >
                    {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Issuing Department:</span>
                    <span className="font-medium text-gray-800">{lic.issuing_authority}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="text-gray-400">Issued On:</span>
                    <span>{formatDate(lic.issue_date)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="text-gray-400">Valid Until:</span>
                    <span className="font-semibold text-gray-900">{formatDate(lic.expiry_date)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className={`font-medium ${isExpired ? 'text-red-700' : isExpiringSoon ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {isExpired ? 'Action: Immediate renewal required' : `${daysLeft} days remaining`}
                  </span>
                  <Badge variant="outline" className="text-[9px] border-gray-200 text-gray-500">
                    Alert: {lic.alert_days || 30}d
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
