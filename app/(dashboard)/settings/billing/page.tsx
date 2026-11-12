import React from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, CheckCircle2, Zap, Shield, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'SaaS Subscription & Plan | StayNext' }

const billingHistory = [
  { id: 'sub-inv-01', date: '2026-11-01', plan: 'Enterprise Hospitality Suite (Up to 100 Rooms)', amount: 249.00, status: 'paid' },
  { id: 'sub-inv-02', date: '2026-10-01', plan: 'Enterprise Hospitality Suite (Up to 100 Rooms)', amount: 249.00, status: 'paid' },
  { id: 'sub-inv-03', date: '2026-09-01', plan: 'Enterprise Hospitality Suite (Up to 100 Rooms)', amount: 249.00, status: 'paid' },
]

export default function SettingsBillingPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              SaaS Subscription &amp; Licenses
            </h1>
            <p className="text-xs text-gray-500">
              Manage your StayNext PMS enterprise plan, room capacity tier, payment method, and invoices.
            </p>
          </div>
        </div>
      </div>

      {/* Active Plan Card */}
      <Card className="border-indigo-100 bg-indigo-50/20 shadow-2xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-600 text-white text-xs">Active Subscription</Badge>
                <span className="text-xs text-gray-500">Renews Dec 01, 2026</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-2">Enterprise Hospitality Suite</h2>
              <p className="text-xs text-gray-600 mt-1">
                64 of 100 licensed rooms in active use &bull; Unlimited front desk users &bull; 2-way OTA synchronization
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-2xl font-black font-mono text-gray-900">$249.00</div>
              <span className="text-xs text-gray-400">/ month billed monthly</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-700">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span>Billed to <strong>Visa ending in 4242</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs bg-white">
                Update Card
              </Button>
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Upgrade Room Tier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Invoice History */}
      <Card className="border-gray-200 shadow-2xs">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-900">
            Subscription Invoices &amp; Receipts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 divide-y divide-gray-100">
          {billingHistory.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-gray-900">{item.plan}</p>
                <p className="text-[11px] text-gray-500 font-mono">{item.date} &bull; {item.id}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                <Badge variant="success" className="text-[10px]">Paid</Badge>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 font-semibold px-2">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
