import { createClient } from '@/lib/supabase/server'
import { getTenantPropertyIds } from '@/services/tenant.service'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(
    url &&
    key &&
    !url.includes('placeholder') &&
    !url.includes('example') &&
    url.startsWith('https://')
  )
}

export interface DashboardStats {
  totalReservations: number
  todayCheckIns: number
  todayCheckOuts: number
  upcomingReservations: number
  pendingReservations: number
  cancelledReservations: number
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  reservedRooms: number
  dirtyRooms: number
  cleaningRooms: number
  maintenanceRooms: number
  outOfOrderRooms: number
  todayRevenue: number
  monthlyRevenue: number
  totalPaymentsReceived: number
  pendingPayments: number
  outstandingBalance: number
  todayExpenses: number

  // India Specific & Operations Compliance Metrics:
  walkInGuests: number
  foreignGuestArrivals: number
  formIIIPending: number
  formIIISubmitted: number
  idVerificationPending: number
  gstRevenue: number
  cgstCollected: number
  sgstCollected: number
  igstCollected: number
  cashCollection: number
  upiCollection: number
  cardCollection: number
  payLaterBalance: number
  pendingRoomCleaning: number
  roomMaintenance: number
  nightAuditCompleted: boolean
}

const emptyStats: DashboardStats = {
  totalReservations: 0,
  todayCheckIns: 0,
  todayCheckOuts: 0,
  upcomingReservations: 0,
  pendingReservations: 0,
  cancelledReservations: 0,
  totalRooms: 0,
  availableRooms: 0,
  occupiedRooms: 0,
  reservedRooms: 0,
  dirtyRooms: 0,
  cleaningRooms: 0,
  maintenanceRooms: 0,
  outOfOrderRooms: 0,
  todayRevenue: 0,
  monthlyRevenue: 0,
  totalPaymentsReceived: 0,
  pendingPayments: 0,
  outstandingBalance: 0,
  todayExpenses: 0,

  walkInGuests: 0,
  foreignGuestArrivals: 0,
  formIIIPending: 0,
  formIIISubmitted: 0,
  idVerificationPending: 0,
  gstRevenue: 0,
  cgstCollected: 0,
  sgstCollected: 0,
  igstCollected: 0,
  cashCollection: 0,
  upiCollection: 0,
  cardCollection: 0,
  payLaterBalance: 0,
  pendingRoomCleaning: 0,
  roomMaintenance: 0,
  nightAuditCompleted: false,
}

export async function getDashboardStats(propertyId?: string): Promise<DashboardStats> {
  if (!isSupabaseConfigured()) {
    return emptyStats
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) {
    return emptyStats
  }

  if (propertyId && !allowedPropertyIds.includes(propertyId)) {
    return emptyStats
  }

  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]

    // Count reservations
    const totalQuery = supabase.from('reservations').select('*', { count: 'exact', head: true }).in('property_id', targetPropertyIds)
    const { count: totalReservations } = await totalQuery

    const checkInsQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('check_in_date', today)
      .in('status', ['confirmed', 'checked_in'])
      .in('property_id', targetPropertyIds)
    const { count: todayCheckIns } = await checkInsQuery

    const checkOutsQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('check_out_date', today)
      .eq('status', 'checked_in')
      .in('property_id', targetPropertyIds)
    const { count: todayCheckOuts } = await checkOutsQuery

    const upcomingQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .gt('check_in_date', today)
      .eq('status', 'confirmed')
      .in('property_id', targetPropertyIds)
    const { count: upcomingReservations } = await upcomingQuery

    const pendingQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('property_id', targetPropertyIds)
    const { count: pendingReservations } = await pendingQuery

    const cancelledQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .in('property_id', targetPropertyIds)
    const { count: cancelledReservations } = await cancelledQuery

    // Room counts
    const totalRoomsQuery = supabase.from('rooms').select('*', { count: 'exact', head: true }).in('property_id', targetPropertyIds)
    const { count: totalRooms } = await totalRoomsQuery

    const availableQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .in('property_id', targetPropertyIds)
    const { count: availableRooms } = await availableQuery

    const occupiedQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'occupied')
      .in('property_id', targetPropertyIds)
    const { count: occupiedRooms } = await occupiedQuery

    const reservedQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reserved')
      .in('property_id', targetPropertyIds)
    const { count: reservedRooms } = await reservedQuery

    const dirtyQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dirty')
      .in('property_id', targetPropertyIds)
    const { count: dirtyRooms } = await dirtyQuery

    const cleaningQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cleaning')
      .in('property_id', targetPropertyIds)
    const { count: cleaningRooms } = await cleaningQuery

    const maintenanceQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'maintenance')
      .in('property_id', targetPropertyIds)
    const { count: maintenanceRooms } = await maintenanceQuery

    const outOfOrderQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'out_of_order')
      .in('property_id', targetPropertyIds)
    const { count: outOfOrderRooms } = await outOfOrderQuery

    // Financial aggregation
    const todayPaymentsQuery = supabase
      .from('payments')
      .select('amount')
      .gte('created_at', `${today}T00:00:00`)
      .eq('status', 'completed')
      .in('property_id', targetPropertyIds)
    const { data: todayPayments } = await todayPaymentsQuery

    const monthlyPaymentsQuery = supabase
      .from('payments')
      .select('amount')
      .gte('created_at', `${monthStart}T00:00:00`)
      .eq('status', 'completed')
      .in('property_id', targetPropertyIds)
    const { data: monthlyPayments } = await monthlyPaymentsQuery

    const pendingPaymentsQuery = supabase
      .from('guest_folios')
      .select('balance')
      .gt('balance', 0)
      .in('property_id', targetPropertyIds)
    const { data: pendingPaymentsData } = await pendingPaymentsQuery

    const todayExpensesQuery = supabase
      .from('expenses')
      .select('amount')
      .gte('created_at', `${today}T00:00:00`)
      .in('property_id', targetPropertyIds)
    const { data: todayExpensesData } = await todayExpensesQuery

    const todayRevenue = (todayPayments || []).reduce(
      (sum: number, p: { amount: number }) => sum + (p.amount || 0),
      0
    )
    const monthlyRevenue = (monthlyPayments || []).reduce(
      (sum: number, p: { amount: number }) => sum + (p.amount || 0),
      0
    )
    const pendingPayments = (pendingPaymentsData || []).reduce(
      (sum: number, p: { balance?: number; amount?: number }) =>
        sum + (p.balance || p.amount || 0),
      0
    )
    const todayExpenses = (todayExpensesData || []).reduce(
      (sum: number, e: { amount: number }) => sum + (e.amount || 0),
      0
    )

    // India Specific Operational Metrics Queries
    let walkInGuests = 0
    let foreignGuestArrivals = 0
    let formIIIPending = 0
    let formIIISubmitted = 0
    let idVerificationPending = 0
    let cashCollection = 0
    let upiCollection = 0
    let cardCollection = 0
    let cgstCollected = 0
    let sgstCollected = 0
    let igstCollected = 0
    let gstRevenue = 0
    let nightAuditCompleted = false

    try {
      const walkInsQuery = supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('check_in_date', today)
        .eq('booking_type', 'Walk-in')
        .in('property_id', targetPropertyIds)
      const { count } = await walkInsQuery
      walkInGuests = count || 0
    } catch {}

    try {
      const foreignQuery = supabase
        .from('foreign_guest_details')
        .select('id, reservations!inner(property_id)', { count: 'exact', head: true })
        .eq('arrival_date_in_india', today)
        .in('reservations.property_id', targetPropertyIds)
      const { count } = await foreignQuery
      foreignGuestArrivals = count || 0
    } catch {}

    try {
      const formIIIPendingQuery = supabase
        .from('form_iii_reports')
        .select('*', { count: 'exact', head: true })
        .eq('report_status', 'Pending')
        .in('property_id', targetPropertyIds)
      const { count } = await formIIIPendingQuery
      formIIIPending = count || 0
    } catch {}

    try {
      const formIIISubmittedQuery = supabase
        .from('form_iii_reports')
        .select('*', { count: 'exact', head: true })
        .eq('report_status', 'Submitted')
        .in('property_id', targetPropertyIds)
      const { count } = await formIIISubmittedQuery
      formIIISubmitted = count || 0
    } catch {}

    try {
      const idVerifyQuery = supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('id_verification_status', 'Pending')
        .in('property_id', targetPropertyIds)
      const { count } = await idVerifyQuery
      idVerificationPending = count || 0
    } catch {}

    try {
      const paymentsMethodQuery = supabase
        .from('payments')
        .select('amount, payment_method')
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'completed')
        .in('property_id', targetPropertyIds)
      const { data: todayPaymentMethods } = await paymentsMethodQuery

      ;(todayPaymentMethods || []).forEach((p: any) => {
        const amt = Number(p.amount) || 0
        const method = (p.payment_method || '').toLowerCase()
        if (method.includes('cash')) cashCollection += amt
        else if (method.includes('upi')) upiCollection += amt
        else cardCollection += amt
      })
    } catch {}

    try {
      const taxQuery = supabase
        .from('reservations')
        .select('cgst_amount, sgst_amount, igst_amount')
        .eq('check_in_date', today)
        .in('property_id', targetPropertyIds)
      const { data: taxData } = await taxQuery

      ;(taxData || []).forEach((t: any) => {
        cgstCollected += Number(t.cgst_amount) || 0
        sgstCollected += Number(t.sgst_amount) || 0
        igstCollected += Number(t.igst_amount) || 0
      })
      gstRevenue = cgstCollected + sgstCollected + igstCollected
    } catch {}

    try {
      const nightAuditQuery = supabase
        .from('night_audit_records')
        .select('id')
        .eq('audit_date', today)
        .eq('status', 'Completed')
        .in('property_id', targetPropertyIds)
        .limit(1)
      const { data: auditRows } = await nightAuditQuery
      nightAuditCompleted = !!(auditRows && auditRows.length > 0)
    } catch {}

    return {
      totalReservations: totalReservations || 0,
      todayCheckIns: todayCheckIns || 0,
      todayCheckOuts: todayCheckOuts || 0,
      upcomingReservations: upcomingReservations || 0,
      pendingReservations: pendingReservations || 0,
      cancelledReservations: cancelledReservations || 0,
      totalRooms: totalRooms || 0,
      availableRooms: availableRooms || 0,
      occupiedRooms: occupiedRooms || 0,
      reservedRooms: reservedRooms || 0,
      dirtyRooms: dirtyRooms || 0,
      cleaningRooms: cleaningRooms || 0,
      maintenanceRooms: maintenanceRooms || 0,
      outOfOrderRooms: outOfOrderRooms || 0,
      todayRevenue,
      monthlyRevenue,
      totalPaymentsReceived: monthlyRevenue,
      pendingPayments,
      outstandingBalance: pendingPayments,
      todayExpenses,

      walkInGuests,
      foreignGuestArrivals,
      formIIIPending,
      formIIISubmitted,
      idVerificationPending,
      gstRevenue,
      cgstCollected,
      sgstCollected,
      igstCollected,
      cashCollection,
      upiCollection,
      cardCollection,
      payLaterBalance: pendingPayments,
      pendingRoomCleaning: (dirtyRooms || 0) + (cleaningRooms || 0),
      roomMaintenance: (maintenanceRooms || 0) + (outOfOrderRooms || 0),
      nightAuditCompleted,
    }
  } catch {
    return emptyStats
  }
}

export interface ReservationRow {
  id: string
  reservation_number: string
  guest_first_name: string
  guest_last_name: string
  guest_phone?: string
  room_number?: string
  room_type?: string
  check_in_date: string
  check_out_date: string
  check_in_time?: string
  check_out_time?: string
  adults: number
  children: number
  status: string
  payment_status: string
  total_amount: number
  outstanding_balance?: number
  booking_source?: string
}

export async function getTodayArrivals(propertyId?: string): Promise<ReservationRow[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return []
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return []
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        check_in_date,
        check_out_date,
        status,
        payment_status,
        total_amount,
        guests (
          first_name,
          last_name,
          phone
        ),
        room_types (
          name
        )
      `)
      .eq('check_in_date', today)
      .in('status', ['confirmed', 'pending'])
      .in('property_id', targetPropertyIds)

    const { data, error } = await query
    if (error || !data) return []

    return data.map((r: any) => ({
      id: r.id,
      reservation_number: r.reservation_number,
      guest_first_name: r.guests?.first_name || 'Guest',
      guest_last_name: r.guests?.last_name || '',
      guest_phone: r.guests?.phone,
      room_type: r.room_types?.name || 'Standard Room',
      check_in_date: r.check_in_date,
      check_out_date: r.check_out_date,
      check_in_time: '14:00',
      adults: 1,
      children: 0,
      status: r.status,
      payment_status: r.payment_status,
      total_amount: r.total_amount || 0,
    }))
  } catch {
    return []
  }
}

export async function getTodayDepartures(propertyId?: string): Promise<ReservationRow[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return []
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return []
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        check_in_date,
        check_out_date,
        status,
        payment_status,
        total_amount,
        guests (
          first_name,
          last_name
        ),
        room_types (
          name
        )
      `)
      .eq('check_out_date', today)
      .eq('status', 'checked_in')
      .in('property_id', targetPropertyIds)

    const { data, error } = await query
    if (error || !data) return []

    return data.map((r: any) => ({
      id: r.id,
      reservation_number: r.reservation_number,
      guest_first_name: r.guests?.first_name || 'Guest',
      guest_last_name: r.guests?.last_name || '',
      room_type: r.room_types?.name || 'Standard',
      check_in_date: r.check_in_date,
      check_out_date: r.check_out_date,
      check_out_time: '11:00 AM',
      adults: 1,
      children: 0,
      status: r.status,
      payment_status: r.payment_status,
      total_amount: r.total_amount || 0,
      outstanding_balance: 0,
    }))
  } catch {
    return []
  }
}

export async function getRecentReservations(
  propertyId?: string,
  limit = 10
): Promise<ReservationRow[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return []
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return []
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()

    let query = supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        check_in_date,
        check_out_date,
        status,
        payment_status,
        total_amount,
        booking_source,
        guests (
          first_name,
          last_name
        ),
        room_types (
          name
        )
      `)
      .in('property_id', targetPropertyIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query
    if (error || !data) return []

    return data.map((r: any) => ({
      id: r.id,
      reservation_number: r.reservation_number,
      guest_first_name: r.guests?.first_name || 'Guest',
      guest_last_name: r.guests?.last_name || '',
      room_type: r.room_types?.name || 'Standard Room',
      check_in_date: r.check_in_date,
      check_out_date: r.check_out_date,
      adults: 1,
      children: 0,
      status: r.status,
      payment_status: r.payment_status,
      total_amount: r.total_amount || 0,
      booking_source: r.booking_source || 'direct',
    }))
  } catch {
    return []
  }
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  expenses: number
}

export async function getRevenueChartData(
  propertyId?: string,
  days = 14
): Promise<RevenueDataPoint[]> {
  const buckets: Record<string, RevenueDataPoint> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().split('T')[0]
    buckets[key] = { date: key, revenue: 0, expenses: 0 }
  }

  if (!isSupabaseConfigured()) {
    return Object.values(buckets)
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return Object.values(buckets)
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return Object.values(buckets)
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().split('T')[0]

    let paymentsQuery = supabase
      .from('payments')
      .select('amount, created_at')
      .gte('created_at', `${startStr}T00:00:00`)
      .eq('status', 'completed')
      .in('property_id', targetPropertyIds)
    const { data: payments } = await paymentsQuery

    let expensesQuery = supabase
      .from('expenses')
      .select('amount, created_at')
      .gte('created_at', `${startStr}T00:00:00`)
      .in('property_id', targetPropertyIds)
    const { data: expenses } = await expensesQuery

    for (const p of payments || []) {
      const key = p.created_at.split('T')[0]
      if (buckets[key]) buckets[key].revenue += p.amount || 0
    }
    for (const e of expenses || []) {
      const key = e.created_at.split('T')[0]
      if (buckets[key]) buckets[key].expenses += e.amount || 0
    }

    return Object.values(buckets)
  } catch {
    return Object.values(buckets)
  }
}

export interface RoomTypePerformance {
  id: string
  roomType: string
  totalRooms: number
  occupiedRooms: number
  occupancyRate: number
  revenue: number
}

export async function getRoomTypePerformance(propertyId?: string): Promise<RoomTypePerformance[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return []
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return []
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()

    let rtQuery = supabase
      .from('room_types')
      .select('id, name, base_rate, property_id')
      .in('property_id', targetPropertyIds)

    let roomsQuery = supabase
      .from('rooms')
      .select('id, room_type_id, status, property_id')
      .in('property_id', targetPropertyIds)

    let resQuery = supabase
      .from('reservations')
      .select('id, room_type_id, total_amount, status')
      .neq('status', 'cancelled')
      .in('property_id', targetPropertyIds)

    const [rtRes, roomsRes, resRes] = await Promise.all([
      rtQuery,
      roomsQuery,
      resQuery,
    ])

    const roomTypes = rtRes.data || []
    if (roomTypes.length === 0) return []

    const rooms = roomsRes.data || []
    const reservations = resRes.data || []

    const map = new Map<string, RoomTypePerformance>()

    for (const rt of roomTypes) {
      const typeName = (rt.name || 'Standard').trim()
      const rtRooms = rooms.filter((r: any) => r.room_type_id === rt.id)
      const total = rtRooms.length
      const occupied = rtRooms.filter((r: any) => r.status === 'occupied').length
      const rtReservations = reservations.filter((res: any) => res.room_type_id === rt.id)
      const rev = rtReservations.reduce((sum: number, res: any) => sum + (Number(res.total_amount) || 0), 0)

      if (map.has(typeName)) {
        const existing = map.get(typeName)!
        existing.totalRooms += total
        existing.occupiedRooms += occupied
        existing.revenue += rev
      } else {
        map.set(typeName, {
          id: rt.id,
          roomType: typeName,
          totalRooms: total,
          occupiedRooms: occupied,
          occupancyRate: 0,
          revenue: rev,
        })
      }
    }

    return Array.from(map.values()).map((item) => ({
      ...item,
      occupancyRate: item.totalRooms > 0 ? Math.round((item.occupiedRooms / item.totalRooms) * 100) : 0,
    }))
  } catch {
    return []
  }
}

export interface HousekeepingOverview {
  requiresCleaning: number
  inProgress: number
  completed: number
  awaitingInspection: number
  assignedStaffCount: number
}

export async function getHousekeepingOverview(propertyId?: string): Promise<HousekeepingOverview> {
  const emptyOverview: HousekeepingOverview = {
    requiresCleaning: 0,
    inProgress: 0,
    completed: 0,
    awaitingInspection: 0,
    assignedStaffCount: 0,
  }

  if (!isSupabaseConfigured()) {
    return emptyOverview
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return emptyOverview
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return emptyOverview
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()

    let pendingQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('property_id', targetPropertyIds)
    const { count: requiresCleaning } = await pendingQ

    let inProgQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')
      .in('property_id', targetPropertyIds)
    const { count: inProgress } = await inProgQ

    let completedQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .in('property_id', targetPropertyIds)
    const { count: completed } = await completedQ

    let awaitingQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'awaiting_inspection')
      .in('property_id', targetPropertyIds)
    const { count: awaitingInspection } = await awaitingQ

    return {
      requiresCleaning: requiresCleaning || 0,
      inProgress: inProgress || 0,
      completed: completed || 0,
      awaitingInspection: awaitingInspection || 0,
      assignedStaffCount: 0,
    }
  } catch {
    return emptyOverview
  }
}

export interface BookingSourceData {
  name: string
  value: number
}

export async function getBookingSourcesData(propertyId?: string): Promise<BookingSourceData[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return []
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return []
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()
    let query = supabase
      .from('reservations')
      .select('booking_source')
      .in('property_id', targetPropertyIds)

    const { data } = await query
    if (!data || data.length === 0) return []

    const counts: Record<string, number> = {}
    for (const r of data) {
      const src = r.booking_source || 'direct'
      counts[src] = (counts[src] || 0) + 1
    }

    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    }))
  } catch {
    return []
  }
}

export interface BookingTrendData {
  date: string
  count: number
}

export async function getBookingTrendsData(
  propertyId?: string,
  days = 14
): Promise<BookingTrendData[]> {
  const buckets: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().split('T')[0]
    buckets[key] = 0
  }

  if (!isSupabaseConfigured()) {
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  }

  const allowedPropertyIds = await getTenantPropertyIds()
  if (allowedPropertyIds.length === 0) return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  if (propertyId && !allowedPropertyIds.includes(propertyId)) return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  const targetPropertyIds = propertyId ? [propertyId] : allowedPropertyIds

  try {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().split('T')[0]

    let query = supabase
      .from('reservations')
      .select('created_at')
      .gte('created_at', `${startStr}T00:00:00`)
      .in('property_id', targetPropertyIds)

    const { data } = await query
    for (const r of data || []) {
      const key = r.created_at.split('T')[0]
      if (buckets[key] !== undefined) buckets[key]++
    }

    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  } catch {
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  }
}
