// ============================================================
// Enums
// ============================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  FRONT_DESK = 'front_desk',
  HOUSEKEEPING = 'housekeeping',
  MAINTENANCE = 'maintenance',
  RESTAURANT = 'restaurant',
  ACCOUNTANT = 'accountant',
  EMPLOYEE = 'employee',
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  DIRTY = 'dirty',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum BookingSource {
  DIRECT = 'direct',
  WALK_IN = 'walk_in',
  WEBSITE = 'website',
  PHONE = 'phone',
  TRAVEL_AGENT = 'travel_agent',
  OTA = 'ota',
  OTHER = 'other',
}

export enum HousekeepingTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum MaintenanceStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum PropertyType {
  HOTEL = 'hotel',
  LODGE = 'lodge',
  RESORT = 'resort',
  GUEST_HOUSE = 'guest_house',
  SERVICE_APARTMENT = 'service_apartment',
}

export enum SubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

// ============================================================
// Core Entities
// ============================================================

export interface Tenant {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  subscription_plan: SubscriptionPlan
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Property {
  id: string
  tenant_id: string
  name: string
  property_type: PropertyType
  address: string
  city: string
  state?: string
  country: string
  postal_code?: string
  phone?: string
  email?: string
  website?: string
  currency: string
  timezone: string
  check_in_time: string
  check_out_time: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Building {
  id: string
  property_id: string
  name: string
  floors_count: number
  description?: string
  is_active: boolean
  created_at: string
}

export interface Floor {
  id: string
  building_id: string
  property_id: string
  floor_number: number
  name: string
  is_active: boolean
  created_at: string
}

export interface RoomType {
  id: string
  property_id: string
  name: string
  description?: string
  base_rate: number
  max_occupancy: number
  bed_type?: string
  size_sqft?: number
  amenities?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  property_id: string
  room_number: string
  floor_id?: string
  building_id?: string
  room_type_id: string
  status: RoomStatus
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  // Joined fields
  room_type?: RoomType
  floor?: Floor
  building?: Building
}

export interface RoomAmenity {
  id: string
  name: string
  icon?: string
  category?: string
  created_at: string
}

export interface Guest {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  nationality?: string
  id_type?: string
  id_number?: string
  date_of_birth?: string
  address?: string
  city?: string
  country?: string
  is_vip: boolean
  blacklisted: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface RatePlan {
  id: string
  property_id: string
  name: string
  description?: string
  is_default: boolean
  meal_plan?: string
  cancellation_policy?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoomRate {
  id: string
  property_id: string
  room_type_id: string
  rate_plan_id: string
  rate_date: string
  rate_amount: number
  min_stay?: number
  max_stay?: number
  created_at: string
}

export interface Reservation {
  id: string
  reservation_number: string
  property_id: string
  guest_id: string
  room_type_id: string
  check_in_date: string
  check_out_date: string
  num_adults: number
  num_children: number
  status: ReservationStatus
  booking_source: BookingSource
  rate_plan_id?: string
  total_amount: number
  paid_amount: number
  payment_status: PaymentStatus
  special_requests?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  guest?: Guest
  room_type?: RoomType
  rooms?: ReservationRoom[]
}

export interface ReservationRoom {
  id: string
  reservation_id: string
  room_id: string
  check_in_date: string
  check_out_date: string
  rate_per_night: number
  created_at: string
  room?: Room
}

export interface ReservationGuest {
  id: string
  reservation_id: string
  guest_id: string
  is_primary: boolean
  created_at: string
  guest?: Guest
}

export interface GuestFolio {
  id: string
  reservation_id: string
  property_id: string
  guest_id: string
  folio_number: string
  status: string
  total_charges: number
  total_payments: number
  balance: number
  created_at: string
  updated_at: string
  items?: FolioItem[]
}

export interface FolioItem {
  id: string
  folio_id: string
  description: string
  item_type: string
  quantity: number
  unit_price: number
  total_price: number
  date: string
  created_by?: string
  created_at: string
}

export interface Payment {
  id: string
  folio_id?: string
  reservation_id?: string
  property_id: string
  guest_id: string
  amount: number
  payment_method: string
  payment_reference?: string
  status: string
  notes?: string
  processed_by?: string
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  folio_id: string
  property_id: string
  guest_id: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  status: string
  issued_at: string
  due_date?: string
  paid_at?: string
  created_at: string
}

export interface HousekeepingTask {
  id: string
  property_id: string
  room_id: string
  task_type: string
  status: HousekeepingTaskStatus
  priority: string
  assigned_to?: string
  notes?: string
  scheduled_date: string
  completed_at?: string
  created_at: string
  updated_at: string
  room?: Room
}

export interface MaintenanceRequest {
  id: string
  property_id: string
  room_id?: string
  title: string
  description: string
  priority: string
  status: MaintenanceStatus
  assigned_to?: string
  reported_by: string
  resolved_at?: string
  created_at: string
  updated_at: string
  room?: Room
}

export interface Department {
  id: string
  property_id: string
  name: string
  description?: string
  manager_id?: string
  created_at: string
}

export interface Employee {
  id: string
  tenant_id: string
  property_id?: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: UserRole
  department_id?: string
  is_active: boolean
  hire_date?: string
  created_at: string
  updated_at: string
  department?: Department
}

export interface ExpenseCategory {
  id: string
  property_id: string
  name: string
  description?: string
  created_at: string
}

export interface Expense {
  id: string
  property_id: string
  category_id: string
  description: string
  amount: number
  expense_date: string
  payment_method?: string
  receipt_url?: string
  approved_by?: string
  status: string
  created_by: string
  created_at: string
  updated_at: string
  category?: ExpenseCategory
}

export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  related_id?: string
  related_type?: string
  created_at: string
}

export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ============================================================
// UI / App types
// ============================================================

export interface NavItem {
  title: string
  href?: string
  icon?: string
  badge?: string | number
  children?: NavItem[]
  disabled?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface DashboardStats {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyRate: number
  todayCheckIns: number
  todayCheckOuts: number
  totalRevenue: number
  monthlyRevenue: number
  pendingReservations: number
  confirmedReservations: number
  housekeepingPending: number
  maintenanceOpen: number
}

export interface OccupancyData {
  date: string
  occupancyRate: number
  revenue: number
}

export interface RevenueData {
  month: string
  revenue: number
  expenses: number
}

export interface TableColumn<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface FilterState {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  propertyId?: string
  [key: string]: string | undefined
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}
