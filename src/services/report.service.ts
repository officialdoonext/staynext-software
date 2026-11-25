'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedTenantId, getTenantPropertyIds } from '@/services/tenant.service'

export interface ExecutiveReportData {
  totalRooms: number
  occupiedRooms: number
  occupancyPercent: number
  totalRevenue: number
  roomRevenue: number
  fbRevenue: number
  totalExpenses: number
  netProfit: number
  adr: number
  revPar: number
  totalReservations: number
  completedCheckouts: number
  directBookingRatio: number
}

export interface RoomTypeOccupancyData {
  roomTypeId: string
  roomTypeName: string
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  maintenanceRooms: number
  occupancyPercent: number
  basePrice: number
}

export interface FinancialPnlData {
  roomRevenue: number
  fbRevenue: number
  otherRevenue: number
  grossRevenue: number
  taxCollected: number
  totalExpenses: number
  expensesByCategory: Array<{ category: string; amount: number }>
  netOperatingIncome: number
  profitMarginPercent: number
}

export interface GuestAnalyticsData {
  totalGuests: number
  vipCount: number
  topGuests: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    totalStays: number
    isVip: boolean
  }>
}

/**
 * Fetch Executive KPIs
 */
export async function getExecutiveReport(propertyId: string): Promise<ExecutiveReportData> {
  try {
    const supabase = await createClient()

    // 1. Rooms count & status
    const { data: rooms } = await supabase
      .from('rooms')
      .select('status')
      .eq('property_id', propertyId)

    const totalRooms = rooms ? rooms.length : 0
    const occupiedRooms = rooms ? rooms.filter((r: any) => r.status === 'occupied').length : 0
    const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    // 2. Revenue from completed payments
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('property_id', propertyId)
      .eq('status', 'completed')

    const totalRevenue = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)

    // 3. Folio breakdown
    const { data: folios } = await supabase
      .from('guest_folios')
      .select('id, folio_items(item_type, total_price, is_void)')
      .eq('property_id', propertyId)

    let roomRevenue = 0
    let fbRevenue = 0
    ;(folios || []).forEach((f: any) => {
      ;(f.folio_items || []).forEach((i: any) => {
        if (!i.is_void) {
          if (i.item_type === 'room_charge') roomRevenue += Number(i.total_price || 0)
          else if (i.item_type === 'f_and_b') fbRevenue += Number(i.total_price || 0)
        }
      })
    })

    // If no folio item posted, fallback to totalRevenue
    if (roomRevenue === 0 && totalRevenue > 0) {
      roomRevenue = Number((totalRevenue * 0.75).toFixed(2))
      fbRevenue = Number((totalRevenue * 0.25).toFixed(2))
    }

    // 4. Expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('property_id', propertyId)

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const netProfit = totalRevenue - totalExpenses

    // 5. ADR & RevPAR
    const adr = occupiedRooms > 0 ? Number((roomRevenue / Math.max(1, occupiedRooms)).toFixed(2)) : 0
    const revPar = totalRooms > 0 ? Number((roomRevenue / totalRooms).toFixed(2)) : 0

    // 6. Reservations count
    const { data: reservations } = await supabase
      .from('reservations')
      .select('status, booking_source')
      .eq('property_id', propertyId)

    const totalReservations = reservations ? reservations.length : 0
    const completedCheckouts = reservations
      ? reservations.filter((r: any) => r.status === 'checked_out').length
      : 0

    const directCount = reservations
      ? reservations.filter((r: any) => r.booking_source === 'direct' || r.booking_source === 'website').length
      : 0
    const directBookingRatio =
      totalReservations > 0 ? Math.round((directCount / totalReservations) * 100) : 100

    return {
      totalRooms,
      occupiedRooms,
      occupancyPercent,
      totalRevenue,
      roomRevenue,
      fbRevenue,
      totalExpenses,
      netProfit,
      adr,
      revPar,
      totalReservations,
      completedCheckouts,
      directBookingRatio,
    }
  } catch (err) {
    console.error('getExecutiveReport error:', err)
    return {
      totalRooms: 0,
      occupiedRooms: 0,
      occupancyPercent: 0,
      totalRevenue: 0,
      roomRevenue: 0,
      fbRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      adr: 0,
      revPar: 0,
      totalReservations: 0,
      completedCheckouts: 0,
      directBookingRatio: 0,
    }
  }
}

/**
 * Fetch Occupancy Breakdown by Room Type
 */
export async function getOccupancyReport(propertyId: string): Promise<RoomTypeOccupancyData[]> {
  try {
    const supabase = await createClient()

    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('id, name, base_price, rooms(status)')
      .eq('property_id', propertyId)

    if (!roomTypes) return []

    return roomTypes.map((rt: any) => {
      const rooms: any[] = rt.rooms || []
      const total = rooms.length
      const occ = rooms.filter((r) => r.status === 'occupied').length
      const avail = rooms.filter((r) => r.status === 'available' || r.status === 'clean').length
      const maint = rooms.filter((r) => r.status === 'maintenance' || r.status === 'out_of_order').length
      const percent = total > 0 ? Math.round((occ / total) * 100) : 0

      return {
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        totalRooms: total,
        occupiedRooms: occ,
        availableRooms: avail,
        maintenanceRooms: maint,
        occupancyPercent: percent,
        basePrice: Number(rt.base_price || 0),
      }
    })
  } catch (err) {
    console.error('getOccupancyReport error:', err)
    return []
  }
}

/**
 * Fetch Financial Profit & Loss Statement
 */
export async function getFinancialReport(propertyId: string): Promise<FinancialPnlData> {
  try {
    const supabase = await createClient()

    // 1. Folio items for revenues
    const { data: folios } = await supabase
      .from('guest_folios')
      .select('folio_items(item_type, total_price, is_void)')
      .eq('property_id', propertyId)

    let roomRevenue = 0
    let fbRevenue = 0
    let otherRevenue = 0
    ;(folios || []).forEach((f: any) => {
      ;(f.folio_items || []).forEach((i: any) => {
        if (!i.is_void) {
          const amt = Number(i.total_price || 0)
          if (i.item_type === 'room_charge') roomRevenue += amt
          else if (i.item_type === 'f_and_b') fbRevenue += amt
          else otherRevenue += amt
        }
      })
    })

    // If folio items empty, check invoices
    if (roomRevenue === 0 && fbRevenue === 0) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, tax_amount')
        .eq('property_id', propertyId)

      const invTotal = (invoices || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      roomRevenue = Number((invTotal * 0.75).toFixed(2))
      fbRevenue = Number((invTotal * 0.25).toFixed(2))
    }

    const grossRevenue = roomRevenue + fbRevenue + otherRevenue
    const taxCollected = Number((grossRevenue * 0.12).toFixed(2))

    // 2. Expenses breakdown
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, expense_categories(name)')
      .eq('property_id', propertyId)

    let totalExpenses = 0
    const catMap: Record<string, number> = {}
    ;(expenses || []).forEach((e: any) => {
      const amt = Number(e.amount || 0)
      totalExpenses += amt
      const catName = e.expense_categories?.name || 'General Operations'
      catMap[catName] = (catMap[catName] || 0) + amt
    })

    const expensesByCategory = Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
    }))

    const netOperatingIncome = grossRevenue - totalExpenses
    const profitMarginPercent =
      grossRevenue > 0 ? Math.round((netOperatingIncome / grossRevenue) * 100) : 0

    return {
      roomRevenue,
      fbRevenue,
      otherRevenue,
      grossRevenue,
      taxCollected,
      totalExpenses,
      expensesByCategory,
      netOperatingIncome,
      profitMarginPercent,
    }
  } catch (err) {
    console.error('getFinancialReport error:', err)
    return {
      roomRevenue: 0,
      fbRevenue: 0,
      otherRevenue: 0,
      grossRevenue: 0,
      taxCollected: 0,
      totalExpenses: 0,
      expensesByCategory: [],
      netOperatingIncome: 0,
      profitMarginPercent: 0,
    }
  }
}

/**
 * Fetch Guest CRM Analytics
 */
export async function getGuestsReport(propertyId: string): Promise<GuestAnalyticsData> {
  try {
    const tenantId = await getAuthenticatedTenantId()
    if (!tenantId) return { totalGuests: 0, vipCount: 0, topGuests: [] }

    const supabase = await createClient()

    const { data: guests } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, phone, is_vip, total_stays')
      .eq('tenant_id', tenantId)
      .order('total_stays', { ascending: false })
      .limit(50)

    if (!guests) return { totalGuests: 0, vipCount: 0, topGuests: [] }

    const topGuests = guests.map((g: any) => ({
      id: g.id,
      name: `${g.first_name || ''} ${g.last_name || ''}`.trim() || 'Guest',
      email: g.email,
      phone: g.phone,
      totalStays: Number(g.total_stays || 1),
      isVip: Boolean(g.is_vip),
    }))

    const vipCount = guests.filter((g: any) => g.is_vip).length

    return {
      totalGuests: guests.length,
      vipCount,
      topGuests,
    }
  } catch (err) {
    console.error('getGuestsReport error:', err)
    return { totalGuests: 0, vipCount: 0, topGuests: [] }
  }
}

