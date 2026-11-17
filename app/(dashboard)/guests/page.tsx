import React from 'react'
import { Plus, Search, Crown, Phone, Mail, MapPin, Star, MoreHorizontal, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Guests Directory | StayNext' }

export default async function GuestsPage() {
  const supabase = await createClient()

  let guests: any[] = []
  try {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      guests = data.map((g: any) => ({
        id: g.id,
        name: `${g.first_name || ''} ${g.last_name || ''}`.trim() || 'Guest',
        email: g.email || 'N/A',
        phone: g.phone || 'N/A',
        nationality: g.nationality || 'Not specified',
        isVip: g.is_vip || false,
        vipTier: g.vip_tier || 'Standard',
        totalStays: g.total_stays || 0,
        totalSpent: Number(g.total_spent || 0),
        preferences: g.preferences || 'None',
      }))
    }
  } catch {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Guest CRM &amp; Profiles
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Guest history, VIP recognition, stay counts, preferences, and contact records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/guests/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Guest Profile
            </Button>
          </Link>
        </div>
      </div>

      {guests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Guests Registered</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Guest profiles will automatically be created when bookings are placed, or you can register a new guest manually.
          </p>
          <div className="mt-6">
            <Link href="/guests/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                Register First Guest
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Guest Directory Table */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>VIP Status</TableHead>
                <TableHead>Total Stays</TableHead>
                <TableHead>Lifetime Spend</TableHead>
                <TableHead>Special Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {guest.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{guest.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-gray-900">{guest.phone}</p>
                    <p className="text-[11px] text-gray-400">{guest.email}</p>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{guest.nationality}</TableCell>
                  <TableCell>
                    {guest.isVip ? (
                      <Badge variant="purple" className="text-[10px]">
                        VIP {guest.vipTier}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Standard
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{guest.totalStays} stays</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900">
                    {formatCurrency(guest.totalSpent)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                    {guest.preferences}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
