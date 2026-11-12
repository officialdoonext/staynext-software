import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Receipt, Save, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Log Expense | StayNext' }

export default function NewExpensePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/expenses">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Record Operational Expense
            </h1>
            <p className="text-xs text-gray-500">
              Log hotel procurement, utility charges, vendor payments, or maintenance costs.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-6">
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-indigo-600" />
              Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Commercial Laundry Detergent &amp; Fabric Softener"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  defaultValue="Commercial Linen Supply &amp; Bedding Restock"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expense Category *</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="housekeeping">Housekeeping &amp; Laundry</option>
                  <option value="fb">Food &amp; Beverage Inventory</option>
                  <option value="utilities">Utilities (Water, Power, Gas)</option>
                  <option value="maintenance">Repairs &amp; Engineering</option>
                  <option value="marketing">Marketing &amp; OTA Commissions</option>
                  <option value="admin">Administrative &amp; Software Licenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount ($) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  defaultValue="450.00"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Pacific Linen Supply Co."
                  defaultValue="Apex Hospitality Wholesale"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option value="card">Company Corporate Credit Card</option>
                  <option value="wire">Bank Wire / ACH</option>
                  <option value="petty_cash">Front Desk Petty Cash</option>
                  <option value="vendor_credit">Net 30 Vendor Credit Terms</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  defaultValue="2026-11-11"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Invoice / Receipt Number</label>
                <input
                  type="text"
                  placeholder="INV-99238"
                  defaultValue="INV-APEX-7781"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Attach Receipt / Invoice PDF</label>
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer bg-gray-50/50">
                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 font-medium">Click or drag file here to attach document</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/expenses">
            <Button variant="outline" type="button" className="text-xs h-9">
              Cancel
            </Button>
          </Link>
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9">
            <Save className="h-4 w-4 mr-1.5" />
            Record Expense
          </Button>
        </div>
      </form>
    </div>
  )
}
