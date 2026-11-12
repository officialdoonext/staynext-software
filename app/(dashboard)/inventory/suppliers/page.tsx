import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Building2, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Supplier & Vendor Directory | StayNext' }

const suppliers = [
  { id: 'sup-1', name: 'Luxe Linen & Textile Co.', category: 'Bedding & Towels', contact: 'Eleanor Vance', email: 'orders@luxelinen.com', phone: '+1 (555) 234-8899', paymentTerms: 'Net 30 Days', activePOs: 1 },
  { id: 'sup-2', name: 'EcoPure Amenity Organics', category: 'Guest Toiletries', contact: 'Marcus Brody', email: 'supply@ecopureamenities.com', phone: '+1 (555) 782-9901', paymentTerms: 'Net 15 Days', activePOs: 1 },
  { id: 'sup-3', name: 'Sysco Foodservice Metro', category: 'Food & Beverage Provisions', contact: 'David Ross', email: 'metro@sysco.com', phone: '+1 (555) 901-2233', paymentTerms: 'Weekly Autopay', activePOs: 2 },
  { id: 'sup-4', name: 'Carrier Commercial HVAC Supply', category: 'Engineering Hardware', contact: 'Tom Jenkins', email: 'hvacparts@carrierparts.net', phone: '+1 (555) 441-0022', paymentTerms: 'Credit Card On Order', activePOs: 0 },
]

export default function SuppliersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Approved Vendors &amp; Suppliers
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Wholesale vendor relationships, negotiated payment terms, contract catalogs, and account representatives.
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Vendor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{s.name}</h3>
                  <Badge variant="outline" className="text-[10px] mt-1 bg-gray-50">
                    {s.category}
                  </Badge>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {s.paymentTerms}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Representative:</span>
                  <strong className="text-gray-800">{s.contact}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <a href={`mailto:${s.email}`} className="text-indigo-600 hover:underline">{s.email}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span>{s.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Active Orders: <strong className="text-gray-900">{s.activePOs} POs</strong></span>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 font-semibold px-2">
                Order History &rarr;
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
