'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Wrench,
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle2,
  Bell,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  NotificationRecipientItem,
  addNotificationRecipient,
  toggleNotificationRecipient,
  deleteNotificationRecipient,
} from '@/services/notification-settings.service'
import { sendTestSmtpEmail } from '@/services/email.service'

interface NotificationsClientProps {
  propertyId: string
  initialRecipients: NotificationRecipientItem[]
}

export function NotificationsClient({
  propertyId,
  initialRecipients,
}: NotificationsClientProps) {
  const [recipients, setRecipients] = useState<NotificationRecipientItem[]>(initialRecipients)
  const [selectedCategory, setSelectedCategory] = useState<'housekeeping' | 'maintenance'>('housekeeping')
  const [selectedChannel, setSelectedChannel] = useState<'mail' | 'whatsapp' | 'sms'>('mail')

  // Form Inputs
  const [recipientInput, setRecipientInput] = useState('')
  const [templateIdInput, setTemplateIdInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [isActiveInput, setIsActiveInput] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Handle Send Test Email via Gmail SMTP
  const handleSendTestEmail = async () => {
    if (!recipientInput.trim()) {
      toast.error('Please enter an email address to receive the test email')
      return
    }

    setIsSendingTestEmail(true)
    try {
      const res = await sendTestSmtpEmail(recipientInput.trim())
      if (res.success) {
        toast.success(`Test email dispatched successfully to ${recipientInput}!`)
      } else {
        toast.error(res.error || 'SMTP delivery failed')
      }
    } finally {
      setIsSendingTestEmail(false)
    }
  }

  // Filtered recipients for current category & channel
  const currentList = recipients.filter(
    (r) => r.category === selectedCategory && r.channel === selectedChannel
  )

  // Counts for sidebar badges
  const hkCount = recipients.filter((r) => r.category === 'housekeeping').length
  const maintCount = recipients.filter((r) => r.category === 'maintenance').length

  // Channel counts for current category
  const mailCount = recipients.filter(
    (r) => r.category === selectedCategory && r.channel === 'mail'
  ).length
  const waCount = recipients.filter(
    (r) => r.category === selectedCategory && r.channel === 'whatsapp'
  ).length
  const smsCount = recipients.filter(
    (r) => r.category === selectedCategory && r.channel === 'sms'
  ).length

  // Handle Add Recipient
  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) {
      toast.error('No property selected')
      return
    }

    if (!recipientInput.trim()) {
      toast.error(
        selectedChannel === 'mail'
          ? 'Please enter a valid email address'
          : selectedChannel === 'whatsapp'
          ? 'Please enter a WhatsApp mobile number'
          : 'Please enter a mobile phone number'
      )
      return
    }

    if (selectedChannel === 'whatsapp' && !templateIdInput.trim()) {
      toast.error('Template ID is required for WhatsApp notifications')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await addNotificationRecipient({
        property_id: propertyId,
        category: selectedCategory,
        channel: selectedChannel,
        recipient: recipientInput.trim(),
        template_id: templateIdInput.trim() || undefined,
        label: labelInput.trim() || undefined,
        is_active: isActiveInput,
      })

      if (res.success && res.data) {
        toast.success(
          `Added ${selectedChannel.toUpperCase()} notification recipient for ${selectedCategory}`
        )
        setRecipients([res.data, ...recipients])
        setRecipientInput('')
        setTemplateIdInput('')
        setLabelInput('')
        setIsActiveInput(true)
      } else {
        toast.error(res.error || 'Failed to add notification recipient')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Toggle Active
  const handleToggleActive = async (item: NotificationRecipientItem) => {
    setActionLoading(`toggle-${item.id}`)
    try {
      const newStatus = !item.is_active
      const res = await toggleNotificationRecipient(item.id, propertyId, newStatus)
      if (res.success) {
        setRecipients(recipients.map((r) => (r.id === item.id ? { ...r, is_active: newStatus } : r)))
        toast.success(`Recipient marked ${newStatus ? 'Active' : 'Inactive'}`)
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Delete Recipient
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this notification recipient?')) return

    setActionLoading(`delete-${id}`)
    try {
      const res = await deleteNotificationRecipient(id, propertyId)
      if (res.success) {
        setRecipients(recipients.filter((r) => r.id !== id))
        toast.success('Recipient removed successfully')
      } else {
        toast.error(res.error || 'Failed to delete recipient')
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sora">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer rounded-md text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Notification Channels &amp; Staff Alerts
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure Mail, WhatsApp, and SMS channels to automatically notify on-duty staff when guests raise QR requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings/integrations">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8.5 rounded-md cursor-pointer border-[#5e2b9d]/30 text-[#5e2b9d] hover:bg-[#f7f2fd]"
            >
              Configure WhatsApp &amp; Media API &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Container with Sidebar + Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* ================================================================= */}
        {/* LEFT SIDEBAR: Housekeeping & Maintenance                          */}
        {/* ================================================================= */}
        <div className="md:col-span-3 bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-3 bg-gray-50/80 border-b border-gray-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Departments
            </span>
          </div>

          <div className="p-2 space-y-1">
            {/* 1. Housekeeping */}
            <button
              type="button"
              onClick={() => setSelectedCategory('housekeeping')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === 'housekeeping'
                  ? 'bg-[#5e2b9d] text-white shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4" />
                <span>Housekeeping</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedCategory === 'housekeeping'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {hkCount}
              </span>
            </button>

            {/* 2. Maintenance */}
            <button
              type="button"
              onClick={() => setSelectedCategory('maintenance')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === 'maintenance'
                  ? 'bg-[#5e2b9d] text-white shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="h-4 w-4" />
                <span>Maintenance</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedCategory === 'maintenance'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {maintCount}
              </span>
            </button>
          </div>

          {/* Helper notice */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
            <div className="font-semibold text-gray-700 flex items-center gap-1">
              <Bell className="h-3.5 w-3.5 text-[#5e2b9d]" />
              <span>Instant Triggers</span>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">
              When a guest scans the room QR and requests a {selectedCategory === 'housekeeping' ? 'cleaning or supply item' : 'repair or maintenance'}, alerts are immediately dispatched to all active channels configured here.
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT CONTENT: Mail, WhatsApp, SMS Tabs + Add Form + List         */}
        {/* ================================================================= */}
        <div className="md:col-span-9 space-y-5">
          {/* Department Header */}
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {selectedCategory === 'housekeeping' ? (
                  <Sparkles className="h-5 w-5 text-[#5e2b9d]" />
                ) : (
                  <Wrench className="h-5 w-5 text-[#5e2b9d]" />
                )}
                <h2 className="text-base font-semibold text-gray-900 capitalize">
                  {selectedCategory} Notification Rules
                </h2>
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-[#5e2b9d] border-[#dfcef6]">
                  {selectedCategory === 'housekeeping' ? 'Turnover & Cleaning' : 'Engineering & Repairs'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure email inboxes, WhatsApp mobile numbers with templates, and SMS alert recipients.
              </p>
            </div>

            {/* CHANNEL TABS: Mail | WhatsApp | SMS */}
            <div className="inline-flex rounded-md p-1 bg-gray-100 border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedChannel('mail')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                  selectedChannel === 'mail'
                    ? 'bg-white text-[#5e2b9d] shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Mail</span>
                <span className="text-[10px] px-1 py-0.1 bg-gray-100 text-gray-600 rounded">
                  {mailCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel('whatsapp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                  selectedChannel === 'whatsapp'
                    ? 'bg-white text-[#5e2b9d] shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
                <span className="text-[10px] px-1 py-0.1 bg-gray-100 text-gray-600 rounded">
                  {waCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel('sms')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                  selectedChannel === 'sms'
                    ? 'bg-white text-[#5e2b9d] shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>SMS</span>
                <span className="text-[10px] px-1 py-0.1 bg-gray-100 text-gray-600 rounded">
                  {smsCount}
                </span>
              </button>
            </div>
          </div>

          {/* 1. ADD RECIPIENT FORM */}
          <Card className="border-gray-200 shadow-2xs rounded-md">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-xs font-semibold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                <Plus className="h-3.5 w-3.5 text-[#5e2b9d]" />
                Add New {selectedChannel === 'mail' ? 'Email' : selectedChannel === 'whatsapp' ? 'WhatsApp Number' : 'SMS Mobile'} for {selectedCategory}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleAddRecipient} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                  {/* Recipient Input */}
                  <div className={selectedChannel === 'whatsapp' ? 'sm:col-span-4' : 'sm:col-span-6'}>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      {selectedChannel === 'mail'
                        ? 'Email Address *'
                        : selectedChannel === 'whatsapp'
                        ? 'WhatsApp Number (with country code) *'
                        : 'Mobile Phone Number *'}
                    </label>
                    <input
                      type={selectedChannel === 'mail' ? 'email' : 'text'}
                      placeholder={
                        selectedChannel === 'mail'
                          ? 'e.g. housekeeping@hotel.com'
                          : selectedChannel === 'whatsapp'
                          ? 'e.g. +919876543210'
                          : 'e.g. +919876543210'
                      }
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      required
                    />
                  </div>

                  {/* WhatsApp Template ID (Only for WhatsApp tab) */}
                  {selectedChannel === 'whatsapp' && (
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        WhatsApp Template ID *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. hk_request_alert, maint_issue_v1"
                        value={templateIdInput}
                        onChange={(e) => setTemplateIdInput(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                        required
                      />
                    </div>
                  )}

                  {/* SMS Template / Sender ID (Optional for SMS tab) */}
                  {selectedChannel === 'sms' && (
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Sender / DLT Template ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. STAYNX, 10072..."
                        value={templateIdInput}
                        onChange={(e) => setTemplateIdInput(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  )}

                  {/* Recipient Label / Staff Name */}
                  <div className={selectedChannel === 'whatsapp' ? 'sm:col-span-4' : selectedChannel === 'sms' ? 'sm:col-span-3' : 'sm:col-span-6'}>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Recipient Label / Staff Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Housekeeper, Shift Lead"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                    />
                  </div>
                </div>

                {/* Footer Controls: Active switch + Save Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activeCheckbox"
                      checked={isActiveInput}
                      onChange={(e) => setIsActiveInput(e.target.checked)}
                      className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
                    />
                    <label htmlFor="activeCheckbox" className="text-xs text-gray-700 cursor-pointer">
                      Enable immediately for live QR request dispatches
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedChannel === 'mail' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendTestEmail}
                        disabled={isSendingTestEmail}
                        size="sm"
                        className="text-xs h-8.5 font-medium rounded-md cursor-pointer px-3 border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <Mail className="h-3.5 w-3.5 mr-1 text-[#5e2b9d]" />
                        {isSendingTestEmail ? 'Sending Test...' : 'Send Test Email'}
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="sm"
                      className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8.5 font-medium rounded-md cursor-pointer px-4 shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Save &amp; Add Recipient
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 2. RECIPIENT LIST TABLE */}
          <div className="bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Configured {selectedChannel === 'mail' ? 'Email Inboxes' : selectedChannel === 'whatsapp' ? 'WhatsApp Numbers' : 'SMS Recipients'} ({currentList.length})
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Receiving automatic alerts when guests request {selectedCategory}.
                </p>
              </div>
            </div>

            {currentList.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <div className="text-xs font-medium text-gray-700">
                  No {selectedChannel} recipients added for {selectedCategory} yet
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Use the form above to add an {selectedChannel === 'mail' ? 'email address' : selectedChannel === 'whatsapp' ? 'WhatsApp number with template ID' : 'SMS mobile number'}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[10px] font-medium tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Recipient Address / Number</th>
                      {selectedChannel === 'whatsapp' && <th className="px-4 py-3">Template ID</th>}
                      {selectedChannel === 'sms' && <th className="px-4 py-3">Sender / DLT ID</th>}
                      <th className="px-4 py-3">Label / Staff Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* 1. Recipient */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.channel === 'mail' ? (
                              <Mail className="h-4 w-4 text-[#5e2b9d] shrink-0" />
                            ) : item.channel === 'whatsapp' ? (
                              <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Smartphone className="h-4 w-4 text-blue-600 shrink-0" />
                            )}
                            <span className="font-semibold text-gray-900 font-mono text-[11px]">
                              {item.recipient}
                            </span>
                          </div>
                        </td>

                        {/* 2. Template ID (WhatsApp) */}
                        {selectedChannel === 'whatsapp' && (
                          <td className="px-4 py-3">
                            {item.template_id ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-mono">
                                {item.template_id}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">Direct Text Alert</span>
                            )}
                          </td>
                        )}

                        {/* 2. Sender ID (SMS) */}
                        {selectedChannel === 'sms' && (
                          <td className="px-4 py-3">
                            <span className="font-mono text-gray-600 text-[11px]">
                              {item.template_id || 'STAYNX'}
                            </span>
                          </td>
                        )}

                        {/* 3. Label */}
                        <td className="px-4 py-3 text-gray-600">
                          {item.label || <span className="text-gray-300 italic">None</span>}
                        </td>

                        {/* 4. Status Toggle */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            disabled={actionLoading === `toggle-${item.id}`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${
                              item.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_active ? (
                              <>
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <X className="h-2.5 w-2.5" />
                                <span>Paused</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* 5. Delete Action */}
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={actionLoading === `delete-${item.id}`}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-sm"
                            title="Delete Recipient"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
