import { createClient } from '@/lib/supabase/server'

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
}

export async function getDashboardStats(propertyId?: string): Promise<DashboardStats> {
  if (!isSupabaseConfigured()) {
    return emptyStats
  }

  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]

    // Count reservations
    const totalQuery = supabase.from('reservations').select('*', { count: 'exact', head: true })
    if (propertyId) totalQuery.eq('property_id', propertyId)
    const { count: totalReservations } = await totalQuery

    const checkInsQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('check_in_date', today)
      .in('status', ['confirmed', 'checked_in'])
    if (propertyId) checkInsQuery.eq('property_id', propertyId)
    const { count: todayCheckIns } = await checkInsQuery

    const checkOutsQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('check_out_date', today)
      .eq('status', 'checked_in')
    if (propertyId) checkOutsQuery.eq('property_id', propertyId)
    const { count: todayCheckOuts } = await checkOutsQuery

    const upcomingQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .gt('check_in_date', today)
      .eq('status', 'confirmed')
    if (propertyId) upcomingQuery.eq('property_id', propertyId)
    const { count: upcomingReservations } = await upcomingQuery

    const pendingQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (propertyId) pendingQuery.eq('property_id', propertyId)
    const { count: pendingReservations } = await pendingQuery

    const cancelledQuery = supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
    if (propertyId) cancelledQuery.eq('property_id', propertyId)
    const { count: cancelledReservations } = await cancelledQuery

    // Room counts
    const totalRoomsQuery = supabase.from('rooms').select('*', { count: 'exact', head: true })
    if (propertyId) totalRoomsQuery.eq('property_id', propertyId)
    const { count: totalRooms } = await totalRoomsQuery

    const availableQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
    if (propertyId) availableQuery.eq('property_id', propertyId)
    const { count: availableRooms } = await availableQuery

    const occupiedQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'occupied')
    if (propertyId) occupiedQuery.eq('property_id', propertyId)
    const { count: occupiedRooms } = await occupiedQuery

    const reservedQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reserved')
    if (propertyId) reservedQuery.eq('property_id', propertyId)
    const { count: reservedRooms } = await reservedQuery

    const dirtyQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dirty')
    if (propertyId) dirtyQuery.eq('property_id', propertyId)
    const { count: dirtyRooms } = await dirtyQuery

    const cleaningQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cleaning')
    if (propertyId) cleaningQuery.eq('property_id', propertyId)
    const { count: cleaningRooms } = await cleaningQuery

    const maintenanceQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'maintenance')
    if (propertyId) maintenanceQuery.eq('property_id', propertyId)
    const { count: maintenanceRooms } = await maintenanceQuery

    const outOfOrderQuery = supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'out_of_order')
    if (propertyId) outOfOrderQuery.eq('property_id', propertyId)
    const { count: outOfOrderRooms } = await outOfOrderQuery

    // Financial aggregation
    const todayPaymentsQuery = supabase
      .from('payments')
      .select('amount')
      .gte('created_at', `${today}T00:00:00`)
      .eq('status', 'completed')
    if (propertyId) todayPaymentsQuery.eq('property_id', propertyId)
    const { data: todayPayments } = await todayPaymentsQuery

    const monthlyPaymentsQuery = supabase
      .from('payments')
      .select('amount')
      .gte('created_at', `${monthStart}T00:00:00`)
      .eq('status', 'completed')
    if (propertyId) monthlyPaymentsQuery.eq('property_id', propertyId)
    const { data: monthlyPayments } = await monthlyPaymentsQuery

    const pendingPaymentsQuery = supabase
      .from('guest_folios')
      .select('balance')
      .gt('balance', 0)
    if (propertyId) pendingPaymentsQuery.eq('property_id', propertyId)
    const { data: pendingPaymentsData } = await pendingPaymentsQuery

    const todayExpensesQuery = supabase
      .from('expenses')
      .select('amount')
      .gte('created_at', `${today}T00:00:00`)
    if (propertyId) todayExpensesQuery.eq('property_id', propertyId)
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

    if (propertyId) query = query.eq('property_id', propertyId)

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

    if (propertyId) query = query.eq('property_id', propertyId)

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
      .order('created_at', { ascending: false })
      .limit(limit)

    if (propertyId) query = query.eq('property_id', propertyId)

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
    if (propertyId) paymentsQuery = paymentsQuery.eq('property_id', propertyId)
    const { data: payments } = await paymentsQuery

    let expensesQuery = supabase
      .from('expenses')
      .select('amount, created_at')
      .gte('created_at', `${startStr}T00:00:00`)
    if (propertyId) expensesQuery = expensesQuery.eq('property_id', propertyId)
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

  try {
    const supabase = await createClient()

    let query = supabase
      .from('room_types')
      .select('id, name, total_rooms')

    if (propertyId) query = query.eq('property_id', propertyId)

    const { data, error } = await query
    if (error || !data || data.length === 0) return []

    return data.map((rt: any) => ({
      roomType: rt.name,
      totalRooms: rt.total_rooms || 0,
      occupiedRooms: 0,
      occupancyRate: 0,
      revenue: 0,
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

  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    let pendingQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (propertyId) pendingQ = pendingQ.eq('property_id', propertyId)
    const { count: requiresCleaning } = await pendingQ

    let inProgQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')
    if (propertyId) inProgQ = inProgQ.eq('property_id', propertyId)
    const { count: inProgress } = await inProgQ

    let completedQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    if (propertyId) completedQ = completedQ.eq('property_id', propertyId)
    const { count: completed } = await completedQ

    let awaitingQ = supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'awaiting_inspection')
    if (propertyId) awaitingQ = awaitingQ.eq('property_id', propertyId)
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

  try {
    const supabase = await createClient()
    let query = supabase.from('reservations').select('booking_source')
    if (propertyId) query = query.eq('property_id', propertyId)

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

  try {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().split('T')[0]

    let query = supabase
      .from('reservations')
      .select('created_at')
      .gte('created_at', `${startStr}T00:00:00`)
    if (propertyId) query = query.eq('property_id', propertyId)

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
