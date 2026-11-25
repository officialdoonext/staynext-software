'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageSquare,
  Image as ImageIcon,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  UploadCloud,
  File,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  WhatsAppConfig,
  ImageKitConfig,
  saveWhatsAppConfig,
  saveImageKitConfig,
  testWhatsAppNotification,
  uploadMediaToImageKit,
} from '@/services/integration-settings.service'

interface IntegrationsClientProps {
  propertyId: string
  initialWhatsAppConfig: WhatsAppConfig
  initialImageKitConfig: ImageKitConfig
}

export function IntegrationsClient({
  propertyId,
  initialWhatsAppConfig,
  initialImageKitConfig,
}: IntegrationsClientProps) {
  // Sidebar State: 'whatsapp' | 'media'
  const [selectedSection, setSelectedSection] = useState<'whatsapp' | 'media'>('whatsapp')

  // WhatsApp Form State
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(initialWhatsAppConfig)
  const [showWaToken, setShowWaToken] = useState(false)
  const [isSavingWa, setIsSavingWa] = useState(false)

  // WhatsApp Test State
  const [waTestNumber, setWaTestNumber] = useState('')
  const [waTestTemplate, setWaTestTemplate] = useState('')
  const [isTestingWa, setIsTestingWa] = useState(false)
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Media Tab State: 'imagekit' | 'test_upload'
  const [mediaActiveTab, setMediaActiveTab] = useState<'imagekit' | 'test_upload'>('imagekit')
  const [ikConfig, setIkConfig] = useState<ImageKitConfig>(initialImageKitConfig)
  const [showIkPrivateKey, setShowIkPrivateKey] = useState(false)
  const [isSavingIk, setIsSavingIk] = useState(false)

  // Media Test Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ url?: string; fileId?: string; error?: string } | null>(null)

  // --------------------------------------------------------------------------
  // WHATSAPP HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) {
      toast.error('No property loaded')
      return
    }

    setIsSavingWa(true)
    try {
      const res = await saveWhatsAppConfig(propertyId, waConfig)
      if (res.success) {
        toast.success('WhatsApp API credentials saved successfully')
      } else {
        toast.error(res.error || 'Failed to save WhatsApp credentials')
      }
    } finally {
      setIsSavingWa(false)
    }
  }

  const handleTestWhatsApp = async () => {
    if (!waTestNumber.trim()) {
      toast.error('Please enter a test mobile number with country code')
      return
    }

    setIsTestingWa(true)
    setWaTestResult(null)
    try {
      const res = await testWhatsAppNotification(propertyId, waTestNumber.trim(), waTestTemplate.trim())
      if (res.success) {
        setWaTestResult({
          success: true,
          message: `Test message delivered! Message ID: ${res.messageId}`,
        })
        toast.success('WhatsApp test message sent successfully')
      } else {
        setWaTestResult({
          success: false,
          message: res.error || 'WhatsApp test message failed',
        })
        toast.error(res.error || 'WhatsApp test message failed')
      }
    } finally {
      setIsTestingWa(false)
    }
  }

  // --------------------------------------------------------------------------
  // IMAGEKIT HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveImageKit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) {
      toast.error('No property loaded')
      return
    }

    setIsSavingIk(true)
    try {
      const res = await saveImageKitConfig(propertyId, ikConfig)
      if (res.success) {
        toast.success('ImageKit configuration saved successfully')
      } else {
        toast.error(res.error || 'Failed to save ImageKit credentials')
      }
    } finally {
      setIsSavingIk(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
      setUploadResult(null)
    }
  }

  const handleExecuteUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select an image, document, audio, or video file')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      // Convert file to Base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
      })
      reader.readAsDataURL(uploadFile)
      const base64Data = await base64Promise

      const res = await uploadMediaToImageKit(propertyId, {
        fileBase64: base64Data,
        fileName: uploadFile.name,
        folder: '/staynext/test_uploads',
      })

      if (res.success && res.url) {
        setUploadResult({
          url: res.url,
          fileId: res.fileId,
        })
        toast.success('File uploaded to ImageKit CDN successfully!')
      } else {
        setUploadResult({
          error: res.error || 'ImageKit upload failed',
        })
        toast.error(res.error || 'Upload failed')
      }
    } catch (err: any) {
      setUploadResult({ error: err.message || 'Error processing file' })
      toast.error('Upload error')
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied URL to clipboard!')
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
              API Gateways &amp; Third-Party Integrations
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Connect Meta WhatsApp Cloud API for guest &amp; staff notifications and ImageKit CDN for media uploads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings/notifications">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8.5 rounded-md cursor-pointer border-[#5e2b9d]/30 text-[#5e2b9d] hover:bg-[#f7f2fd]"
            >
              Configure Notification Channels &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Container with Sidebar + Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* ================================================================= */}
        {/* LEFT SIDEBAR: WhatsApp & Media                                   */}
        {/* ================================================================= */}
        <div className="md:col-span-3 bg-white rounded-md border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-3 bg-gray-50/80 border-b border-gray-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Integrations
            </span>
          </div>

          <div className="p-2 space-y-1">
            {/* 1. WhatsApp Button */}
            <button
              type="button"
              onClick={() => setSelectedSection('whatsapp')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedSection === 'whatsapp'
                  ? 'bg-[#5e2b9d] text-white shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0.2 rounded-xs ${
                  selectedSection === 'whatsapp'
                    ? 'bg-white/20 text-white border-white/30'
                    : waConfig.isEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {waConfig.isEnabled ? 'Live' : 'Disabled'}
              </Badge>
            </button>

            {/* 2. Media Button */}
            <button
              type="button"
              onClick={() => setSelectedSection('media')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedSection === 'media'
                  ? 'bg-[#5e2b9d] text-white shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="h-4 w-4" />
                <span>Media (ImageKit)</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0.2 rounded-xs ${
                  selectedSection === 'media'
                    ? 'bg-white/20 text-white border-white/30'
                    : ikConfig.isEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {ikConfig.isEnabled ? 'Active CDN' : 'Disabled'}
              </Badge>
            </button>
          </div>

          {/* Sidebar Info Card */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 space-y-1.5">
            <div className="font-semibold text-gray-700 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#5e2b9d]" />
              <span>Production Credentials</span>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">
              Keys saved here are used automatically to dispatch QR service request alerts and upload guest photos, voice notes, and videos.
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT CONTENT                                                     */}
        {/* ================================================================= */}
        <div className="md:col-span-9 space-y-5">
          {/* =============================================================== */}
          {/* 1. WHATSAPP SECTION                                             */}
          {/* =============================================================== */}
          {selectedSection === 'whatsapp' && (
            <div className="space-y-5">
              {/* Header Card */}
              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Meta WhatsApp Cloud API Integration
                    </h2>
                    <Badge variant={waConfig.isEnabled ? 'success' : 'outline'} className="text-[10px] rounded-xs">
                      {waConfig.isEnabled ? 'Active for Notifications' : 'Integration Paused'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Used to send instant WhatsApp template messages to housekeeping and maintenance staff upon QR request.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-700 font-medium">Status:</label>
                  <input
                    type="checkbox"
                    checked={waConfig.isEnabled}
                    onChange={(e) => setWaConfig({ ...waConfig, isEnabled: e.target.checked })}
                    className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 font-medium">
                    {waConfig.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Configuration Form Card */}
              <Card className="border-gray-200 shadow-2xs rounded-md">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[#5e2b9d]" />
                    API Credentials (Meta for Developers)
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-4">
                  <form onSubmit={handleSaveWhatsApp} className="space-y-4 text-xs">
                    {/* Access Token */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-gray-700">
                          Meta Access Token (System User Permanent Token) *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowWaToken(!showWaToken)}
                          className="text-[11px] text-[#5e2b9d] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {showWaToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {showWaToken ? 'Hide' : 'Reveal Token'}
                        </button>
                      </div>
                      <input
                        type={showWaToken ? 'text' : 'password'}
                        placeholder="EAA..."
                        value={waConfig.accessToken}
                        onChange={(e) => setWaConfig({ ...waConfig, accessToken: e.target.value })}
                        className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                        required
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Requires <code className="text-gray-600">whatsapp_business_messaging</code> and <code className="text-gray-600">whatsapp_business_management</code> permissions.
                      </span>
                    </div>

                    {/* Phone Number ID & Business Account ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          Phone Number ID (Mobile App Number ID) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 104829104928104"
                          value={waConfig.phoneNumberId}
                          onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
                          className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                          required
                        />
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          Found in WhatsApp &rarr; API Setup in Meta Developer Dashboard.
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          WhatsApp Business Account ID (WABA ID) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 102948192039102"
                          value={waConfig.businessAccountId}
                          onChange={(e) => setWaConfig({ ...waConfig, businessAccountId: e.target.value })}
                          className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                          required
                        />
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          Identifier for your WhatsApp Business Account.
                        </span>
                      </div>
                    </div>

                    {/* App ID & Webhook Verify Token */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          Meta App ID (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 192837465019283"
                          value={waConfig.appId || ''}
                          onChange={(e) => setWaConfig({ ...waConfig, appId: e.target.value })}
                          className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          Webhook Verify Token (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. staynext_verify_secret"
                          value={waConfig.webhookVerifyToken || ''}
                          onChange={(e) => setWaConfig({ ...waConfig, webhookVerifyToken: e.target.value })}
                          className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                      <Button
                        type="submit"
                        disabled={isSavingWa}
                        size="sm"
                        className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8.5 font-medium rounded-md cursor-pointer px-4 shadow-2xs"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Save WhatsApp Credentials
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Test Message Tool Card */}
              <Card className="border-gray-200 shadow-2xs rounded-md">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-emerald-600" />
                    Live WhatsApp Dispatch Verification
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-xs">
                  <p className="text-[11px] text-gray-500">
                    Verify that your Meta Cloud API Access Token and Phone Number ID are valid by sending a test alert message to your mobile number.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Test Mobile Number (with country code) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +919876543210"
                        value={waTestNumber}
                        onChange={(e) => setWaTestNumber(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Template Name (Optional, leave blank for direct text)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. hello_world or custom_template"
                        value={waTestTemplate}
                        onChange={(e) => setWaTestTemplate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      type="button"
                      onClick={handleTestWhatsApp}
                      disabled={isTestingWa}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-medium rounded-md cursor-pointer px-3 shadow-2xs"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Send Live Test Message
                    </Button>

                    {waTestResult && (
                      <div
                        className={`text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded ${
                          waTestResult.success
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {waTestResult.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        )}
                        <span>{waTestResult.message}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* =============================================================== */}
          {/* 2. MEDIA SECTION (TAB BASED: ImageKit + Test Upload)            */}
          {/* =============================================================== */}
          {selectedSection === 'media' && (
            <div className="space-y-5">
              {/* Media Header & Tab Switcher */}
              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-[#5e2b9d]" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Media CDN &amp; File Storage (ImageKit)
                    </h2>
                    <Badge variant={ikConfig.isEnabled ? 'success' : 'outline'} className="text-[10px] rounded-xs">
                      {ikConfig.isEnabled ? 'Active CDN' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Allows guests and staff to upload photos, maintenance inspection videos, audio notes, and documents.
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="inline-flex rounded-md p-1 bg-gray-100 border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMediaActiveTab('imagekit')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                      mediaActiveTab === 'imagekit'
                        ? 'bg-white text-[#5e2b9d] shadow-2xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    <span>ImageKit Config</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaActiveTab('test_upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                      mediaActiveTab === 'test_upload'
                        ? 'bg-white text-[#5e2b9d] shadow-2xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Test Media Upload</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: ImageKit Configuration Form */}
              {mediaActiveTab === 'imagekit' && (
                <Card className="border-gray-200 shadow-2xs rounded-md">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-[#5e2b9d]" />
                        ImageKit API Keys &amp; Endpoint
                      </span>
                      <div className="flex items-center gap-2 font-normal text-xs normal-case">
                        <span>Active:</span>
                        <input
                          type="checkbox"
                          checked={ikConfig.isEnabled}
                          onChange={(e) => setIkConfig({ ...ikConfig, isEnabled: e.target.checked })}
                          className="h-4 w-4 rounded text-[#5e2b9d] focus:ring-[#5e2b9d] cursor-pointer"
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <form onSubmit={handleSaveImageKit} className="space-y-4 text-xs">
                      {/* Public Key */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          Public Key *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. public_xxxxxxxxxxxxxxxxxxxxxx"
                          value={ikConfig.publicKey}
                          onChange={(e) => setIkConfig({ ...ikConfig, publicKey: e.target.value })}
                          className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                          required
                        />
                      </div>

                      {/* Private Key */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-gray-700">
                            Private Key *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowIkPrivateKey(!showIkPrivateKey)}
                            className="text-[11px] text-[#5e2b9d] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {showIkPrivateKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {showIkPrivateKey ? 'Hide' : 'Reveal Key'}
                          </button>
                        </div>
                        <input
                          type={showIkPrivateKey ? 'text' : 'password'}
                          placeholder="e.g. private_xxxxxxxxxxxxxxxxxxxxxx"
                          value={ikConfig.privateKey}
                          onChange={(e) => setIkConfig({ ...ikConfig, privateKey: e.target.value })}
                          className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                          required
                        />
                      </div>

                      {/* URL Endpoint */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                          URL Endpoint *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. https://ik.imagekit.io/your_hotel_id"
                          value={ikConfig.urlEndpoint}
                          onChange={(e) => setIkConfig({ ...ikConfig, urlEndpoint: e.target.value })}
                          className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                          required
                        />
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          Your ImageKit URL endpoint root. All uploaded photos, audio, and documents will be served from this CDN domain.
                        </span>
                      </div>

                      <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                        <Button
                          type="submit"
                          disabled={isSavingIk}
                          size="sm"
                          className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8.5 font-medium rounded-md cursor-pointer px-4 shadow-2xs"
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Save ImageKit Configuration
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* TAB 2: Live Test Upload */}
              {mediaActiveTab === 'test_upload' && (
                <Card className="border-gray-200 shadow-2xs rounded-md">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UploadCloud className="h-3.5 w-3.5 text-[#5e2b9d]" />
                      Live Media Upload &amp; CDN Verification
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4 text-xs">
                    <p className="text-[11px] text-gray-500">
                      Upload any image, document (PDF), audio clip, or video to verify that ImageKit returns a live, accessible CDN link.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-[#5e2b9d] transition-colors bg-gray-50/50">
                      <input
                        type="file"
                        id="mediaFileInput"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="mediaFileInput" className="cursor-pointer block space-y-2">
                        <UploadCloud className="h-8 w-8 mx-auto text-[#5e2b9d]" />
                        <div className="text-xs font-medium text-gray-800">
                          {uploadFile ? uploadFile.name : 'Click to select a file (Image, PDF, Audio, Video)'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {uploadFile
                            ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                            : 'Supports PNG, JPG, WEBP, MP4, MP3, WAV, PDF up to 25MB'}
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        onClick={handleExecuteUpload}
                        disabled={!uploadFile || isUploading}
                        size="sm"
                        className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-8 font-medium rounded-md cursor-pointer px-4 shadow-2xs"
                      >
                        <UploadCloud className="h-3.5 w-3.5 mr-1" />
                        {isUploading ? 'Uploading to ImageKit...' : 'Upload to ImageKit'}
                      </Button>

                      {uploadResult?.error && (
                        <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded">
                          {uploadResult.error}
                        </div>
                      )}
                    </div>

                    {/* Returned CDN URL Display */}
                    {uploadResult?.url && (
                      <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ImageKit Upload Successful!
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(uploadResult.url!)}
                            className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="h-3 w-3" /> Copy URL
                          </button>
                        </div>

                        <div className="bg-white p-2 rounded border border-emerald-200 font-mono text-[10px] text-gray-800 break-all select-all">
                          {uploadResult.url}
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <a
                            href={uploadResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#5e2b9d] font-medium hover:underline inline-flex items-center gap-1"
                          >
                            Open File in ImageKit CDN <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
