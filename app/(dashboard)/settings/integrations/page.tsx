import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Cpu, CreditCard, Lock, Mail, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Integrations & API Gateways | StayNext' }

const integrations = [
  { id: 'int-1', name: 'Stripe Payments & Terminal', category: 'Payment Processing', description: 'Credit card tokenization, pre-authorization holds, and countertop POS terminals.', status: 'connected', provider: 'Stripe, Inc.' },
  { id: 'int-2', name: 'Assa Abloy / VingCard Keycard System', category: 'Door Lock Hardware', description: 'RFID room key encoder & mobile digital key Bluetooth dispatch.', status: 'connected', provider: 'Assa Abloy Global' },
  { id: 'int-3', name: 'Twilio SMS & WhatsApp Business', category: 'Guest Messaging', description: 'Automated check-in SMS notifications and digital concierge WhatsApp hotline.', status: 'connected', provider: 'Twilio Cloud' },
  { id: 'int-4', name: 'Oracle QuickBooks Online / Xero', category: 'Accounting & General Ledger', description: 'Daily night audit revenue syncing and tax liability journal vouchers.', status: 'connected', provider: 'Intuit QuickBooks' },
  { id: 'int-5', name: 'Oracle Hospitality OPERA PMS Bridge', category: 'Legacy PMS Sync', description: 'Bi-directional guest folio transfer and legacy database sync.', status: 'available', provider: 'Oracle Hospitality' },
  { id: 'int-6', name: 'SendGrid Transactional Email', category: 'Email Delivery', description: 'High-deliverability booking confirmations, folio receipts, and cancellation notices.', status: 'connected', provider: 'Twilio SendGrid' },
]

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Third-Party Integrations &amp; Hardware Hub
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Connect payment gateways, RFID electronic door locks, guest communication APIs, and ERP accounting systems.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((intg) => (
          <div key={intg.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{intg.name}</h3>
                  <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 mt-1">
                    {intg.category}
                  </Badge>
                </div>
                <Badge variant={intg.status === 'connected' ? 'success' : 'outline'} className="text-[10px]">
                  {intg.status === 'connected' ? 'Live & Active' : 'Available'}
                </Badge>
              </div>

              <p className="text-xs text-gray-500 mt-3 line-clamp-3">{intg.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-mono">{intg.provider}</span>
              <Button
                variant={intg.status === 'connected' ? 'ghost' : 'outline'}
                size="sm"
                className="h-8 text-xs font-semibold px-2"
              >
                {intg.status === 'connected' ? 'Configure API' : 'Connect'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
