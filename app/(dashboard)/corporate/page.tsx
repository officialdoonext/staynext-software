import React from 'react'
import { Briefcase, Plus, Building, Percent, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Corporate & Travel Partners | StayNext' }

const corporateClients = [
  { id: 'corp-1', name: 'Deloitte Consulting LLP', contact: 'travel@deloitte.com', rateCode: 'CORP-DELOITTE', bookedNights: 240, commission: '0% (Direct Bill)', creditLimit: 25000, balance: 4200 },
  { id: 'corp-2', name: 'Expedia Partner Solutions', contact: 'hotel-connect@expedia.com', rateCode: 'OTA-EXPEDIA', bookedNights: 512, commission: '15% Net', creditLimit: 50000, balance: 12400 },
  { id: 'corp-3', name: 'Booking.com B.V.', contact: 'support@booking.com', rateCode: 'OTA-BOOKING', bookedNights: 780, commission: '18% Commission', creditLimit: 80000, balance: 18900 },
  { id: 'corp-4', name: 'McKinsey & Company', contact: 'traveldesk@mckinsey.com', rateCode: 'CORP-MCKINSEY', bookedNights: 180, commission: '0% (Direct Bill)', creditLimit: 30000, balance: 2100 },
]

export default function CorporatePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Corporate Clients &amp; Travel Agencies
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Corporate accounts, corporate billing credit terms, agent commissions, and contract rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Corporate Account
          </Button>
        </div>
      </div>

      {/* Corporate List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {corporateClients.map((client) => (
          <div key={client.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-indigo-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{client.name}</h3>
                    <p className="text-[11px] text-gray-400">{client.contact}</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {client.rateCode}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-[10px] text-gray-400">YTD Room Nights</p>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">{client.bookedNights} nts</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-[10px] text-gray-400">Commission</p>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">{client.commission}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-[10px] text-gray-400">Current Balance</p>
                  <p className="text-xs font-bold text-rose-600 mt-0.5">{formatCurrency(client.balance)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Credit Limit: <strong>{formatCurrency(client.creditLimit)}</strong></span>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                View Contract
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

