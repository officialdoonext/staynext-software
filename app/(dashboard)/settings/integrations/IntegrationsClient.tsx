'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Cpu,
  Key,
  CheckCircle2,
  Lock,
  MessageSquare,
  CreditCard,
  Mail,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  IntegrationItem,
  saveIntegrationConfig,
} from '@/services/settings.service'
import { toast } from 'sonner'

interface IntegrationsClientProps {
  propertyId: string
  integrations: IntegrationItem[]
}

export function IntegrationsClient({
  propertyId,
  integrations: initialIntegrations,
}: IntegrationsClientProps) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations)
  const [activeItem, setActiveItem] = useState<IntegrationItem | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [isEnabledInput, setIsEnabledInput] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenConfig = (item: IntegrationItem) => {
    setActiveItem(item)
    setApiKeyInput(item.apiKey || '')
    setIsEnabledInput(item.isEnabled)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem || !propertyId) return

    setIsSaving(true)
    const res = await saveIntegrationConfig(propertyId, activeItem.id, {
      isEnabled: isEnabledInput,
      apiKey: apiKeyInput,
    })
    setIsSaving(false)

    if (res.success) {
      toast.success(`${activeItem.name} configuration updated`)
      setIntegrations(
        integrations.map((i) =>
          i.id === activeItem.id
            ? {
                ...i,
                isEnabled: isEnabledInput,
                apiKey: apiKeyInput,
                status: isEnabledInput ? 'connected' : 'disabled',
              }
            : i
        )
      )
      setActiveItem(null)
    } else {
      toast.error(res.error || 'Failed to save configuration')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sora">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900">
              Integrations &amp; API Gateways
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Connect payment gateways, WhatsApp business messaging, email dispatch, and RFID keycard hardware.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((intg) => (
          <div
            key={intg.id}
            className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-[#5e2b9d]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{intg.name}</h3>
                  <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 mt-1 rounded-sm">
                    {intg.category}
                  </Badge>
                </div>
                <Badge
                  variant={intg.isEnabled ? 'success' : 'outline'}
                  className="text-[10px] rounded-sm"
                >
                  {intg.isEnabled ? 'Live & Active' : 'Disabled'}
                </Badge>
              </div>

              <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed">
                {intg.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-mono text-[11px]">{intg.provider}</span>
              <Button
                variant={intg.isEnabled ? 'ghost' : 'outline'}
                size="sm"
                onClick={() => handleOpenConfig(intg)}
                className="h-8 text-xs font-medium px-3 cursor-pointer rounded-md text-[#5e2b9d] hover:bg-[#f7f2fd]"
              >
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Configure Dialog */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="sm:max-w-[460px] font-sora rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-gray-900">
              Configure {activeItem?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                API Key / Secret Token
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter production API key..."
                  className="text-xs rounded-md font-mono pr-8"
                />
                <Key className="h-3.5 w-3.5 text-gray-400 absolute right-2.5 top-2.5" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Stored encrypted in Supabase tenant settings partition.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="toggleIntegration"
                checked={isEnabledInput}
                onChange={(e) => setIsEnabledInput(e.target.checked)}
                className="h-4 w-4 text-[#5e2b9d] rounded border-gray-300 focus:ring-[#5e2b9d] cursor-pointer"
              />
              <label htmlFor="toggleIntegration" className="text-xs text-gray-700 cursor-pointer">
                Enable this gateway for live PMS transactions
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveItem(null)}
                className="text-xs rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs rounded-md font-medium cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

