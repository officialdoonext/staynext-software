import React from 'react'
import { Plus, Building2, MapPin, Phone, Mail, Globe, BedDouble, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Property Management | StayNext' }

export default async function PropertiesPage() {
  const supabase = await createClient()

  let properties: any[] = []
  try {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      properties = data
    }
  } catch {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Property Portfolio
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage multi-property configurations, buildings, floors, and hotel facilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/properties/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Property
            </Button>
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Properties Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Your tenant organization does not have any active property branches registered yet.
          </p>
          <div className="mt-6">
            <Link href="/properties/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                Register First Property
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Grid of properties */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <Card key={prop.id} className="border-gray-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{prop.name}</CardTitle>
                      <Badge variant="purple" className="mt-1 text-[10px]">
                        {prop.property_type || 'Hotel'}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={prop.is_active ? 'success' : 'secondary'}>
                    {prop.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 flex-1">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{prop.address || 'Address not set'}, {prop.city}</span>
                  </div>
                  {prop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{prop.phone}</span>
                    </div>
                  )}
                  {prop.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{prop.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Currency: {prop.currency || 'INR'}</span>
                  <Link href={`/properties/${prop.id}/settings`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 p-0 font-medium">
                      Configure &rarr;
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
