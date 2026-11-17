'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface FolioItem {
  id: string
  folioId: string
  description: string
  itemType: 'room_charge' | 'f_and_b' | 'tax' | 'service' | 'discount'
  quantity: number
  unitPrice: number
  totalPrice: number
  itemDate: string
  isVoid: boolean
  createdAt: string
}

export interface FolioRecord {
  id: string
  propertyId: string
  reservationId: string
  guestId: string
  folioNumber: string
  status: 'open' | 'closed' | 'settled'
  totalCharges: number
  totalPayments: number
  balance: number
  closedAt: string | null
  createdAt: string
  updatedAt: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  reservationNumber?: string
  roomNumber?: string
  items?: FolioItem[]
}

export interface PaymentRecord {
  id: string
  folioId?: string | null
  reservationId?: string | null
  propertyId: string
  guestId?: string | null
  amount: number
  paymentMethod: string
  paymentReference?: string | null
  status: string
  notes?: string | null
  createdAt: string
  guestName?: string
  folioNumber?: string
}

export interface InvoiceRecord {
  id: string
  invoiceNumber: string
  folioId?: string | null
  propertyId: string
  guestId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  customerGstin?: string | null
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  status: string
  issuedAt: string
  dueDate?: string | null
  paidAt?: string | null
  notes?: string | null
  createdAt: string
  items?: any[]
  guestName?: string
}

/**
 * Fetch all folios for a property with optional status/search filters
 */
export async function getFolios(
  propertyId: string,
  options?: { status?: string; search?: string }
): Promise<FolioRecord[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('guest_folios')
      .select(`
        id,
        property_id,
        reservation_id,
        guest_id,
        folio_number,
        status,
        total_charges,
        total_payments,
        balance,
        closed_at,
        created_at,
        updated_at,
        guests (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        reservations (
          id,
          reservation_number,
          reservation_rooms (
            rooms (
              room_number
            )
          )
        )
      `)
      .eq('property_id', propertyId)
      .order('updated_at', { ascending: false })

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query

    if (error || !data) {
      console.error('Error fetching folios:', error)
      return []
    }

    let records: FolioRecord[] = data.map((f: any) => {
      const g = f.guests
      const r = f.reservations
      const guestName = g ? `${g.first_name} ${g.last_name}`.trim() : 'Guest'
      const roomNumber = r?.reservation_rooms?.[0]?.rooms?.room_number || '-'

      return {
        id: f.id,
        propertyId: f.property_id,
        reservationId: f.reservation_id,
        guestId: f.guest_id,
        folioNumber: f.folio_number,
        status: f.status,
        totalCharges: Number(f.total_charges || 0),
        totalPayments: Number(f.total_payments || 0),
        balance: Number(f.balance || 0),
        closedAt: f.closed_at,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
        guestName,
        guestEmail: g?.email,
        guestPhone: g?.phone,
        reservationNumber: r?.reservation_number,
        roomNumber,
      }
    })

    if (options?.search) {
      const q = options.search.toLowerCase()
      records = records.filter(
        (f) =>
          f.folioNumber.toLowerCase().includes(q) ||
          f.guestName.toLowerCase().includes(q) ||
          (f.reservationNumber && f.reservationNumber.toLowerCase().includes(q)) ||
          (f.roomNumber && f.roomNumber.toLowerCase().includes(q))
      )
    }

    return records
  } catch (err) {
    console.error('getFolios exception:', err)
    return []
  }
}

/**
 * Get detailed folio by ID including itemized line items and payments
 */
export async function getFolioById(folioId: string): Promise<FolioRecord | null> {
  try {
    const supabase = await createClient()

    const { data: f, error } = await supabase
      .from('guest_folios')
      .select(`
        id,
        property_id,
        reservation_id,
        guest_id,
        folio_number,
        status,
        total_charges,
        total_payments,
        balance,
        closed_at,
        created_at,
        updated_at,
        guests (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        reservations (
          id,
          reservation_number,
          check_in_date,
          check_out_date,
          reservation_rooms (
            rooms (
              room_number
            )
          )
        )
      `)
      .eq('id', folioId)
      .single()

    if (error || !f) return null

    // Fetch line items
    const { data: itemsData } = await supabase
      .from('folio_items')
      .select('*')
      .eq('folio_id', folioId)
      .order('created_at', { ascending: true })

    const items: FolioItem[] = (itemsData || []).map((item: any) => ({
      id: item.id,
      folioId: item.folio_id,
      description: item.description,
      itemType: item.item_type,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unit_price || 0),
      totalPrice: Number(item.total_price || 0),
      itemDate: item.item_date,
      isVoid: Boolean(item.is_void),
      createdAt: item.created_at,
    }))

    const g: any = (f as any).guests
    const r: any = (f as any).reservations
    const guestName = g ? `${g.first_name || ''} ${g.last_name || ''}`.trim() : 'Guest'
    const roomNumber = r?.reservation_rooms?.[0]?.rooms?.room_number || '-'

    return {
      id: f.id,
      propertyId: f.property_id,
      reservationId: f.reservation_id,
      guestId: f.guest_id,
      folioNumber: f.folio_number,
      status: f.status,
      totalCharges: Number(f.total_charges || 0),
      totalPayments: Number(f.total_payments || 0),
      balance: Number(f.balance || 0),
      closedAt: f.closed_at,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
      guestName,
      guestEmail: g?.email,
      guestPhone: g?.phone,
      reservationNumber: r?.reservation_number,
      roomNumber,
      items,
    }
  } catch (err) {
    console.error('getFolioById exception:', err)
    return null
  }
}

/**
 * Add a charge or incidental item to a folio
 */
export async function addFolioItem(data: {
  folioId: string
  description: string
  itemType: 'room_charge' | 'f_and_b' | 'tax' | 'service' | 'discount'
  quantity: number
  unitPrice: number
  itemDate?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const totalPrice = Number((data.quantity * data.unitPrice).toFixed(2))

    const { error: insertError } = await supabase.from('folio_items').insert({
      folio_id: data.folioId,
      description: data.description,
      item_type: data.itemType,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      total_price: totalPrice,
      item_date: data.itemDate || new Date().toISOString().split('T')[0],
      is_void: false,
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // Recalculate total_charges on guest_folios
    const { data: allItems } = await supabase
      .from('folio_items')
      .select('total_price, is_void')
      .eq('folio_id', data.folioId)

    const newTotal = (allItems || [])
      .filter((i: any) => !i.is_void)
      .reduce((sum: number, i: any) => sum + Number(i.total_price || 0), 0)

    await supabase
      .from('guest_folios')
      .update({ total_charges: newTotal, updated_at: new Date().toISOString() })
      .eq('id', data.folioId)

    revalidatePath('/billing')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add charge' }
  }
}

/**
 * Void a line item on a folio
 */
export async function voidFolioItem(
  itemId: string,
  folioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('folio_items')
      .update({ is_void: true })
      .eq('id', itemId)

    if (error) return { success: false, error: error.message }

    // Recalculate total_charges on guest_folios
    const { data: allItems } = await supabase
      .from('folio_items')
      .select('total_price, is_void')
      .eq('folio_id', folioId)

    const newTotal = (allItems || [])
      .filter((i: any) => !i.is_void)
      .reduce((sum: number, i: any) => sum + Number(i.total_price || 0), 0)

    await supabase
      .from('guest_folios')
      .update({ total_charges: newTotal, updated_at: new Date().toISOString() })
      .eq('id', folioId)

    revalidatePath('/billing')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to void item' }
  }
}

/**
 * Record a payment against a folio or reservation
 */
export async function recordPayment(data: {
  propertyId: string
  folioId?: string
  reservationId?: string
  guestId?: string
  amount: number
  paymentMethod: string
  paymentReference?: string
  notes?: string
}): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  try {
    const supabase = await createClient()

    let guestId = data.guestId
    let reservationId = data.reservationId

    // If folio provided but no guestId, lookup from folio
    if (data.folioId && (!guestId || !reservationId)) {
      const { data: f } = await supabase
        .from('guest_folios')
        .select('guest_id, reservation_id')
        .eq('id', data.folioId)
        .single()

      if (f) {
        guestId = guestId || f.guest_id
        reservationId = reservationId || f.reservation_id
      }
    }

    if (!guestId) {
      // Find fallback or first guest
      const { data: g } = await supabase.from('guests').select('id').limit(1).single()
      guestId = g?.id
    }

    if (!guestId) {
      return { success: false, error: 'A valid guest is required for payment ledger entry.' }
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        property_id: data.propertyId,
        folio_id: data.folioId || null,
        reservation_id: reservationId || null,
        guest_id: guestId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        payment_reference: data.paymentReference || `PAY-${Date.now().toString(36).toUpperCase()}`,
        status: 'completed',
        notes: data.notes || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    // If payment belongs to a folio, recalculate total_payments on guest_folios
    if (data.folioId) {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('folio_id', data.folioId)
        .eq('status', 'completed')

      const sumPayments = (payments || []).reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      )

      // Check current total charges
      const { data: currentFolio } = await supabase
        .from('guest_folios')
        .select('total_charges')
        .eq('id', data.folioId)
        .single()

      const totalCharges = Number(currentFolio?.total_charges || 0)
      const balance = totalCharges - sumPayments

      await supabase
        .from('guest_folios')
        .update({
          total_payments: sumPayments,
          status: balance <= 0 ? 'settled' : 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.folioId)
    }

    revalidatePath('/billing')
    revalidatePath('/billing/payments')
    return { success: true, paymentId: payment?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record payment' }
  }
}

/**
 * Fetch payments ledger for a property
 */
export async function getPayments(
  propertyId: string,
  options?: { method?: string; startDate?: string; endDate?: string }
): Promise<PaymentRecord[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('payments')
      .select(`
        id,
        folio_id,
        reservation_id,
        property_id,
        guest_id,
        amount,
        payment_method,
        payment_reference,
        status,
        notes,
        created_at,
        guests (
          first_name,
          last_name
        ),
        guest_folios (
          folio_number
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (options?.method && options.method !== 'all') {
      query = query.eq('payment_method', options.method)
    }

    if (options?.startDate) {
      query = query.gte('created_at', `${options.startDate}T00:00:00`)
    }

    if (options?.endDate) {
      query = query.lte('created_at', `${options.endDate}T23:59:59`)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((p: any) => {
      const g = p.guests
      const gf = p.guest_folios
      return {
        id: p.id,
        folioId: p.folio_id,
        reservationId: p.reservation_id,
        propertyId: p.property_id,
        guestId: p.guest_id,
        amount: Number(p.amount || 0),
        paymentMethod: p.payment_method,
        paymentReference: p.payment_reference,
        status: p.status,
        notes: p.notes,
        createdAt: p.created_at,
        guestName: g ? `${g.first_name} ${g.last_name}`.trim() : 'Guest',
        folioNumber: gf?.folio_number || 'Direct Payment',
      }
    })
  } catch (err) {
    console.error('getPayments exception:', err)
    return []
  }
}

/**
 * Fetch invoices for a property
 */
export async function getInvoices(
  propertyId: string,
  options?: { status?: string; search?: string }
): Promise<InvoiceRecord[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        folio_id,
        property_id,
        guest_id,
        customer_name,
        customer_email,
        customer_phone,
        customer_gstin,
        subtotal,
        tax_amount,
        discount_amount,
        total,
        status,
        issued_at,
        due_date,
        paid_at,
        notes,
        created_at,
        guests (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('property_id', propertyId)
      .order('issued_at', { ascending: false })

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query

    if (error || !data) return []

    let records: InvoiceRecord[] = data.map((inv: any) => {
      const g = inv.guests
      const guestName = inv.customer_name || (g ? `${g.first_name} ${g.last_name}`.trim() : 'Guest')

      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        folioId: inv.folio_id,
        propertyId: inv.property_id,
        guestId: inv.guest_id,
        customerName: inv.customer_name,
        customerEmail: inv.customer_email || g?.email,
        customerPhone: inv.customer_phone || g?.phone,
        customerGstin: inv.customer_gstin,
        subtotal: Number(inv.subtotal || 0),
        taxAmount: Number(inv.tax_amount || 0),
        discountAmount: Number(inv.discount_amount || 0),
        total: Number(inv.total || 0),
        status: inv.status,
        issuedAt: inv.issued_at,
        dueDate: inv.due_date,
        paidAt: inv.paid_at,
        notes: inv.notes,
        createdAt: inv.created_at,
        guestName,
      }
    })

    if (options?.search) {
      const q = options.search.toLowerCase()
      records = records.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.guestName && inv.guestName.toLowerCase().includes(q)) ||
          (inv.customerEmail && inv.customerEmail.toLowerCase().includes(q))
      )
    }

    return records
  } catch (err) {
    console.error('getInvoices exception:', err)
    return []
  }
}

/**
 * Generate official tax invoice for an active folio
 */
export async function generateInvoiceForFolio(
  folioId: string,
  options?: { notes?: string; dueDays?: number }
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch folio details
    const { data: folio, error: folioErr } = await supabase
      .from('guest_folios')
      .select(`
        id,
        property_id,
        guest_id,
        total_charges,
        total_payments,
        balance,
        guests (
          first_name,
          last_name,
          email,
          phone
        ),
        folio_items (
          description,
          item_type,
          quantity,
          unit_price,
          total_price,
          is_void
        )
      `)
      .eq('id', folioId)
      .single()

    if (folioErr || !folio) {
      return { success: false, error: 'Folio not found' }
    }

    const validItems = (folio.folio_items || []).filter((i: any) => !i.is_void)
    const subtotal = validItems.reduce((acc: number, i: any) => acc + Number(i.total_price || 0), 0)
    // 12% GST standard hotel tax
    const taxAmount = Number((subtotal * 0.12).toFixed(2))
    const total = Number((subtotal + taxAmount).toFixed(2))

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
    const g: any = (folio as any).guests
    const guestName = g ? `${g.first_name || ''} ${g.last_name || ''}`.trim() : 'Guest'

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (options?.dueDays || 7))

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        folio_id: folio.id,
        property_id: folio.property_id,
        guest_id: folio.guest_id,
        customer_name: guestName,
        customer_email: g?.email || null,
        customer_phone: g?.phone || null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: 0.0,
        total,
        status: Number(folio.balance || 0) <= 0 ? 'paid' : 'issued',
        issued_at: new Date().toISOString(),
        due_date: dueDate.toISOString().split('T')[0],
        paid_at: Number(folio.balance || 0) <= 0 ? new Date().toISOString() : null,
        notes: options?.notes || 'Standard Hotel Stay & Guest Charges Invoice',
        items: validItems,
      })
      .select('id')
      .single()

    if (invError) {
      return { success: false, error: invError.message }
    }

    // Mark folio settled if balance is <= 0
    if (Number(folio.balance || 0) <= 0) {
      await supabase
        .from('guest_folios')
        .update({ status: 'settled', closed_at: new Date().toISOString() })
        .eq('id', folio.id)
    }

    revalidatePath('/billing')
    revalidatePath('/billing/invoices')
    return { success: true, invoiceId: invoice?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate invoice' }
  }
}

/**
 * Fetch detailed invoice by ID for printable tax view
 */
export async function getInvoiceById(invoiceId: string) {
  try {
    const supabase = await createClient()

    const { data: inv, error } = await supabase
      .from('invoices')
      .select(`
        *,
        properties (
          id,
          name,
          address,
          city,
          state,
          country,
          postal_code,
          phone,
          email,
          tax_id
        ),
        guests (
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          identification_number
        ),
        guest_folios (
          id,
          folio_number,
          reservations (
            reservation_number,
            check_in_date,
            check_out_date,
            reservation_rooms (
              rooms (
                room_number
              )
            )
          )
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (error || !inv) return null

    return inv
  } catch (err) {
    console.error('getInvoiceById exception:', err)
    return null
  }
}
