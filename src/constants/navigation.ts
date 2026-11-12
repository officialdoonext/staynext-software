import type { NavSection } from '@/types'

export const navigationSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
      },
    ],
  },
  {
    title: 'Front Office',
    items: [
      {
        title: 'Front Desk',
        href: '/front-desk',
        icon: 'ConciergeBell',
      },
      {
        title: 'Reservations',
        href: '/reservations',
        icon: 'CalendarCheck',
        children: [
          { title: 'All Reservations', href: '/reservations' },
          { title: 'New Reservation', href: '/reservations/new' },
          { title: 'Calendar View', href: '/reservations/calendar' },
        ],
      },
      {
        title: 'Guests',
        href: '/guests',
        icon: 'Users',
        children: [
          { title: 'Guest Directory', href: '/guests' },
          { title: 'Add Guest', href: '/guests/new' },
          { title: 'VIP Guests', href: '/guests?filter=vip' },
        ],
      },
    ],
  },
  {
    title: 'Property',
    items: [
      {
        title: 'Properties',
        href: '/properties',
        icon: 'Building2',
        children: [
          { title: 'All Properties', href: '/properties' },
          { title: 'Add Property', href: '/properties/new' },
        ],
      },
      {
        title: 'Rooms',
        href: '/rooms',
        icon: 'BedDouble',
        children: [
          { title: 'Room List', href: '/rooms' },
          { title: 'Room Types', href: '/rooms/types' },
          { title: 'Floor Plan', href: '/rooms/floor-plan' },
        ],
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Housekeeping',
        href: '/housekeeping',
        icon: 'Sparkles',
        children: [
          { title: 'Task Board', href: '/housekeeping' },
          { title: 'Schedule', href: '/housekeeping/schedule' },
          { title: 'Reports', href: '/housekeeping/reports' },
        ],
      },
      {
        title: 'Maintenance',
        href: '/maintenance',
        icon: 'Wrench',
        children: [
          { title: 'Requests', href: '/maintenance' },
          { title: 'New Request', href: '/maintenance/new' },
          { title: 'Reports', href: '/maintenance/reports' },
        ],
      },
    ],
  },
  {
    title: 'Revenue',
    items: [
      {
        title: 'Rates & Plans',
        href: '/rates',
        icon: 'Tag',
        children: [
          { title: 'Rate Plans', href: '/rates' },
          { title: 'Seasonal Rates', href: '/rates/seasonal' },
          { title: 'Promotions', href: '/rates/promotions' },
        ],
      },
      {
        title: 'Billing',
        href: '/billing',
        icon: 'CreditCard',
        children: [
          { title: 'Folios', href: '/billing' },
          { title: 'Invoices', href: '/billing/invoices' },
          { title: 'Payments', href: '/billing/payments' },
        ],
      },
      {
        title: 'Expenses',
        href: '/expenses',
        icon: 'Receipt',
        children: [
          { title: 'All Expenses', href: '/expenses' },
          { title: 'Add Expense', href: '/expenses/new' },
          { title: 'Categories', href: '/expenses/categories' },
        ],
      },
    ],
  },
  {
    title: 'Food & Beverage',
    items: [
      {
        title: 'Restaurant',
        href: '/restaurant',
        icon: 'UtensilsCrossed',
        children: [
          { title: 'Orders', href: '/restaurant' },
          { title: 'Menu', href: '/restaurant/menu' },
          { title: 'Tables', href: '/restaurant/tables' },
          { title: 'Reports', href: '/restaurant/reports' },
        ],
      },
      {
        title: 'Inventory',
        href: '/inventory',
        icon: 'Package',
        children: [
          { title: 'Stock', href: '/inventory' },
          { title: 'Purchase Orders', href: '/inventory/purchase-orders' },
          { title: 'Suppliers', href: '/inventory/suppliers' },
        ],
      },
    ],
  },
  {
    title: 'People',
    items: [
      {
        title: 'Employees',
        href: '/employees',
        icon: 'UserCog',
        children: [
          { title: 'Staff Directory', href: '/employees' },
          { title: 'Add Employee', href: '/employees/new' },
          { title: 'Departments', href: '/employees/departments' },
          { title: 'Schedules', href: '/employees/schedules' },
        ],
      },
      {
        title: 'Corporate',
        href: '/corporate',
        icon: 'Briefcase',
        children: [
          { title: 'Companies', href: '/corporate' },
          { title: 'Contracts', href: '/corporate/contracts' },
          { title: 'Travel Agents', href: '/corporate/travel-agents' },
        ],
      },
    ],
  },
  {
    title: 'Sales',
    items: [
      {
        title: 'Booking Engine',
        href: '/booking-engine',
        icon: 'Globe',
        children: [
          { title: 'Settings', href: '/booking-engine' },
          { title: 'Channel Manager', href: '/booking-engine/channels' },
          { title: 'Promotions', href: '/booking-engine/promotions' },
        ],
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        title: 'Reports',
        href: '/reports',
        icon: 'BarChart3',
        children: [
          { title: 'Overview', href: '/reports' },
          { title: 'Occupancy', href: '/reports/occupancy' },
          { title: 'Revenue', href: '/reports/revenue' },
          { title: 'Guest Analytics', href: '/reports/guests' },
          { title: 'Financial Reports', href: '/reports/financial' },
        ],
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: 'Settings',
        children: [
          { title: 'General', href: '/settings' },
          { title: 'Users & Roles', href: '/settings/users' },
          { title: 'Integrations', href: '/settings/integrations' },
          { title: 'Notifications', href: '/settings/notifications' },
          { title: 'Billing', href: '/settings/billing' },
        ],
      },
    ],
  },
]
