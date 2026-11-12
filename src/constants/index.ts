export const APP_NAME = 'StayNext'
export const APP_DESCRIPTION = 'Professional Hotel Management SaaS'
export const DEFAULT_CURRENCY = 'USD'
export const DEFAULT_TIMEZONE = 'UTC'
export const DEFAULT_CHECK_IN_TIME = '14:00'
export const DEFAULT_CHECK_OUT_TIME = '11:00'
export const ITEMS_PER_PAGE = 20

export const ROOM_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  dirty: 'Dirty',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  out_of_order: 'Out of Order',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  refunded: 'Refunded',
  failed: 'Failed',
}

export const BOOKING_SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct Booking',
  walk_in: 'Walk-in',
  website: 'Website',
  phone: 'Phone',
  travel_agent: 'Travel Agent',
  ota: 'OTA',
  other: 'Other',
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel',
  lodge: 'Lodge',
  resort: 'Resort',
  guest_house: 'Guest House',
  service_apartment: 'Service Apartment',
}
