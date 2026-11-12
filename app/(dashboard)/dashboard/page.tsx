import React, { Suspense } from 'react'
import {
  Calendar,
  DoorOpen,
  DoorClosed,
  Clock,
  AlertCircle,
  XCircle,
  BedDouble,
  CheckSquare,
  Users,
  Hotel,
  AlertTriangle,
  Wrench,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Building,
} from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import ArrivalsTable from '@/components/dashboard/ArrivalsTable'
import DeparturesTable from '@/components/dashboard/DeparturesTable'
import RecentReservationsTable from '@/components/dashboard/RecentReservationsTable'
import HousekeepingWidget from '@/components/dashboard/HousekeepingWidget'
import AlertsWidget from '@/components/dashboard/AlertsWidget'
import QuickActions from '@/components/dashboard/QuickActions'
import RevenueChart from '@/components/charts/RevenueChart'
import OccupancyChart from '@/components/charts/OccupancyChart'
import BookingSourcesChart from '@/components/charts/BookingSourcesChart'
import BookingTrendsChart from '@/components/charts/BookingTrendsChart'
import {
  getDashboardStats,
  getTodayArrivals,
  getTodayDepartures,
  getRecentReservations,
  getRevenueChartData,
  getRoomTypePerformance,
  getHousekeepingOverview,
  getBookingSourcesData,
  getBookingTrendsData,
} from '@/services/dashboard.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard | StayNext Hotel Management',
}

export default async function DashboardPage() {
  const [
    stats,
    arrivals,
    departures,
    recentReservations,
    revenueData,
    roomTypePerf,
    housekeeping,
    bookingSources,
    bookingTrends,
  ] = await Promise.all([
    getDashboardStats(),
    getTodayArrivals(),
    getTodayDepartures(),
    getRecentReservations(undefined, 8),
    getRevenueChartData(),
    getRoomTypePerformance(),
    getHousekeepingOverview(),
    getBookingSourcesData(),
    getBookingTrendsData(),
  ])

  const today = new Date()

  // Room status data formatted for the donut chart
  const occupancyChartData = [
    { name: 'Occupied', value: stats.occupiedRooms, color: '#4f46e5' },
    { name: 'Available', value: stats.availableRooms, color: '#10b981' },
    { name: 'Reserved', value: stats.reservedRooms, color: '#8b5cf6' },
    { name: 'Dirty / Cleaning', value: stats.dirtyRooms + stats.cleaningRooms, color: '#f59e0b' },
    { name: 'Maintenance', value: stats.maintenanceRooms + stats.outOfOrderRooms, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Hotel Operations Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time occupancy, revenue streams, and front-desk logistics &bull; {formatDate(today)}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* 2. Booking Statistics Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Reservation Metrics
          </h2>
          <Link href="/reservations" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            View All Reservations &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Reservations"
            value={stats.totalReservations}
            icon={Calendar}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            href="/reservations"
          />
          <StatCard
            title="Today's Check-ins"
            value={stats.todayCheckIns}
            icon={DoorOpen}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            href="/front-desk"
          />
          <StatCard
            title="Today's Check-outs"
            value={stats.todayCheckOuts}
            icon={DoorClosed}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            href="/front-desk"
          />
          <StatCard
            title="Upcoming Bookings"
            value={stats.upcomingReservations}
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            href="/reservations?filter=upcoming"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingReservations}
            icon={AlertCircle}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            href="/reservations?status=pending"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelledReservations}
            icon={XCircle}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
            href="/reservations?status=cancelled"
          />
        </div>
      </section>

      {/* 3. Room Inventory & Availability Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Room Inventory Status
          </h2>
          <Link href="/rooms" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Room Management &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5 sm:gap-3">
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={BedDouble}
            iconColor="text-gray-700"
            iconBg="bg-gray-100"
            href="/rooms"
          />
          <StatCard
            title="Available"
            value={stats.availableRooms}
            icon={CheckSquare}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            href="/rooms?status=available"
          />
          <StatCard
            title="Occupied"
            value={stats.occupiedRooms}
            icon={Users}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            href="/rooms?status=occupied"
          />
          <StatCard
            title="Reserved"
            value={stats.reservedRooms}
            icon={Hotel}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            href="/rooms?status=reserved"
          />
          <StatCard
            title="Dirty"
            value={stats.dirtyRooms}
            icon={AlertTriangle}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            href="/housekeeping?status=pending"
          />
          <StatCard
            title="Cleaning"
            value={stats.cleaningRooms}
            icon={Clock}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-50"
            href="/housekeeping?status=in_progress"
          />
          <StatCard
            title="Maintenance"
            value={stats.maintenanceRooms}
            icon={Wrench}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            href="/maintenance"
          />
          <StatCard
            title="Out of Order"
            value={stats.outOfOrderRooms}
            icon={XCircle}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
            href="/rooms?status=out_of_order"
          />
        </div>
      </section>

      {/* 4. Financial Statistics Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Financial Ledger &amp; Revenue
          </h2>
          <Link href="/billing" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Billing &amp; Payments &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(stats.todayRevenue)}
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            href="/billing/payments"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={TrendingUp}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            href="/reports/revenue"
          />
          <StatCard
            title="Payments Received"
            value={formatCurrency(stats.totalPaymentsReceived)}
            icon={CreditCard}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            href="/billing/payments"
          />
          <StatCard
            title="Pending Payments"
            value={formatCurrency(stats.pendingPayments)}
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            href="/billing?filter=pending"
          />
          <StatCard
            title="Outstanding Balances"
            value={formatCurrency(stats.outstandingBalance)}
            icon={AlertCircle}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
            href="/billing?filter=unpaid"
          />
          <StatCard
            title="Today's Expenses"
            value={formatCurrency(stats.todayExpenses)}
            icon={Receipt}
            iconColor="text-gray-600"
            iconBg="bg-gray-100"
            href="/expenses"
          />
        </div>
      </section>

      {/* 5. Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview (Line chart) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue &amp; Expense Velocity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Daily cash flow trends for past 30 days</p>
            </div>
            <Link href="/reports/revenue" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Detailed Report
            </Link>
          </div>
          <RevenueChart data={revenueData} />
        </div>

        {/* Occupancy Overview (Donut chart) */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Occupancy Distribution</h3>
              <span className="text-xs px-2 py-0.5 font-semibold bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                {stats.totalRooms > 0
                  ? `${Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}% Occupied`
                  : '0% Occupancy'}
              </span>
            </div>
            <OccupancyChart data={occupancyChartData} />
          </div>
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Total Capacity: <strong>{stats.totalRooms} rooms</strong></span>
            <span>Sellable: <strong>{stats.availableRooms + stats.occupiedRooms}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Sources (Donut/Pie chart) */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Channel &amp; Booking Sources</h3>
            <span className="text-xs text-gray-400">Distribution</span>
          </div>
          <BookingSourcesChart data={bookingSources} />
        </div>

        {/* Booking Trends (Bar chart) */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">14-Day Reservation Volume</h3>
            <span className="text-xs text-gray-400">Bookings / day</span>
          </div>
          <BookingTrendsChart data={bookingTrends} />
        </div>

        {/* Room Type Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Room Type Performance</h3>
            <Link href="/rooms" className="text-xs text-indigo-600 hover:text-indigo-800">
              Manage
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {roomTypePerf && roomTypePerf.length > 0 ? (
              roomTypePerf.map((rt) => (
                <div key={rt.roomType} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{rt.roomType}</p>
                    <p className="text-[11px] text-gray-500">
                      {rt.occupiedRooms}/{rt.totalRooms} Occupied ({rt.occupancyRate}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(rt.revenue)}</p>
                    <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, rt.occupancyRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">
                <Building className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                No room type revenue metrics recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Today's Arrivals Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Today&apos;s Arrivals ({arrivals.length})
            </h3>
          </div>
          <Link href="/front-desk" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Front Desk View All &rarr;
          </Link>
        </div>
        <ArrivalsTable arrivals={arrivals} />
      </div>

      {/* 7. Today's Departures Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <DoorClosed className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Today&apos;s Departures ({departures.length})
            </h3>
          </div>
          <Link href="/front-desk" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Front Desk View All &rarr;
          </Link>
        </div>
        <DeparturesTable departures={departures} />
      </div>

      {/* 8. Recent Reservations Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Recent Reservations
            </h3>
          </div>
          <Link href="/reservations" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Reservations Ledger &rarr;
          </Link>
        </div>
        <RecentReservationsTable reservations={recentReservations} />
      </div>

      {/* 9. Bottom Row: Housekeeping Overview + Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Housekeeping Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Housekeeping &amp; Room Turnover</h3>
            <Link href="/housekeeping" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Task Board &rarr;
            </Link>
          </div>
          <HousekeepingWidget data={housekeeping} />
        </div>

        {/* Pending Tasks & Operational Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Operational Alerts &amp; Critical Actions</h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
              Live Feed
            </span>
          </div>
          <AlertsWidget stats={stats} />
        </div>
      </div>
    </div>
  )
}

