import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const safeAmount = Number(amount) || 0
  const curr = (currency || 'INR').toUpperCase()
  const locale = curr === 'INR' ? 'en-IN' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
    maximumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
  }).format(safeAmount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function generateReservationNumber(): string {
  const prefix = 'RES'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatTimeString(timeStr?: string): string {
  if (!timeStr) return '12:00 PM'
  const clean = timeStr.trim().slice(0, 5)
  const parts = clean.split(':').map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return timeStr
  const hour = parts[0]
  const minute = String(parts[1]).padStart(2, '0')
  const period = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12
  return `${formattedHour}:${minute} ${period}`
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-orange-100 text-orange-800',
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-blue-100 text-blue-800',
    reserved: 'bg-purple-100 text-purple-800',
    dirty: 'bg-yellow-100 text-yellow-800',
    cleaning: 'bg-cyan-100 text-cyan-800',
    maintenance: 'bg-orange-100 text-orange-800',
    out_of_order: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    refunded: 'bg-purple-100 text-purple-800',
    failed: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

export function amountToWordsIndian(amount: number): string {
  const a = Math.floor(Math.abs(amount))
  if (a === 0) return 'Rupees Zero Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const numToWords = (n: number): string => {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim()
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${numToWords(n % 100)}`.trim()
    return ''
  }

  let words = ''
  const crore = Math.floor(a / 10000000)
  const lakh = Math.floor((a % 10000000) / 100000)
  const thousand = Math.floor((a % 100000) / 1000)
  const remainder = a % 1000

  if (crore > 0) words += `${numToWords(crore)} Crore `
  if (lakh > 0) words += `${numToWords(lakh)} Lakh `
  if (thousand > 0) words += `${numToWords(thousand)} Thousand `
  if (remainder > 0) words += `${numToWords(remainder)} `

  return `Rupees ${words.trim()} Only`
}
