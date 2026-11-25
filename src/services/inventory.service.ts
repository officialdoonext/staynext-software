'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTenantPropertyIds } from '@/services/tenant.service'

export interface InventoryCategoryRecord {
  id: string
  propertyId: string
  name: string
  description?: string
}

export interface SupplierRecord {
  id: string
  propertyId: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  paymentTerms?: string
  createdAt: string
}

export interface InventoryItemRecord {
  id: string
  propertyId: string
  categoryId?: string | null
  categoryName?: string
  supplierId?: string | null
  supplierName?: string
  name: string
  sku: string
  description?: string
  unit: string
  unitPrice: number
  currentStock: number
  minimumStock: number
  reorderQuantity: number
  isLowStock: boolean
  createdAt: string
}

export interface InventoryTransactionRecord {
  id: string
  itemId: string
  itemName?: string
  transactionType: 'in' | 'out' | 'adjustment'
  quantity: number
  unitPrice: number
  totalCost: number
  referenceNumber?: string
  notes?: string
  createdAt: string
}

/**
 * Fetch inventory categories
 */
export async function getInventoryCategories(propertyId: string): Promise<InventoryCategoryRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (error || !data) return []

    return data.map((c: any) => ({
      id: c.id,
      propertyId: c.property_id,
      name: c.name,
      description: c.description,
    }))
  } catch (err) {
    console.error('getInventoryCategories error:', err)
    return []
  }
}

/**
 * Create inventory category
 */
export async function createInventoryCategory(data: {
  propertyId: string
  name: string
  description?: string
}): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: cat, error } = await supabase
      .from('inventory_categories')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        description: data.description || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    return { success: true, categoryId: cat?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create category' }
  }
}

/**
 * Fetch suppliers
 */
export async function getSuppliers(propertyId: string): Promise<SupplierRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (error || !data) return []

    return data.map((s: any) => ({
      id: s.id,
      propertyId: s.property_id,
      name: s.name,
      contactPerson: s.contact_person,
      email: s.email,
      phone: s.phone,
      address: s.address,
      taxId: s.tax_id,
      paymentTerms: s.payment_terms || 'Net 30',
      createdAt: s.created_at,
    }))
  } catch (err) {
    console.error('getSuppliers error:', err)
    return []
  }
}

/**
 * Create supplier
 */
export async function createSupplier(data: {
  propertyId: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  paymentTerms?: string
}): Promise<{ success: boolean; supplierId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: s, error } = await supabase
      .from('suppliers')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        contact_person: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        tax_id: data.taxId || null,
        payment_terms: data.paymentTerms || 'Net 30',
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory/suppliers')
    return { success: true, supplierId: s?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create supplier' }
  }
}

/**
 * Delete supplier
 */
export async function deleteSupplier(supplierId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('suppliers').delete().eq('id', supplierId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory/suppliers')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete supplier' }
  }
}

/**
 * Fetch inventory items
 */
export async function getInventoryItems(
  propertyId: string,
  options?: { categoryId?: string; lowStockOnly?: boolean; search?: string }
): Promise<InventoryItemRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        property_id,
        category_id,
        supplier_id,
        name,
        sku,
        description,
        unit,
        unit_price,
        current_stock,
        minimum_stock,
        reorder_quantity,
        created_at,
        inventory_categories (
          name
        ),
        suppliers (
          name
        )
      `)
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (options?.categoryId && options.categoryId !== 'all') {
      query = query.eq('category_id', options.categoryId)
    }

    const { data, error } = await query

    if (error || !data) return []

    let items: InventoryItemRecord[] = data.map((item: any) => {
      const cur = Number(item.current_stock || 0)
      const min = Number(item.minimum_stock || 0)
      return {
        id: item.id,
        propertyId: item.property_id,
        categoryId: item.category_id,
        categoryName: item.inventory_categories?.name || 'General',
        supplierId: item.supplier_id,
        supplierName: item.suppliers?.name || 'Local Vendor',
        name: item.name,
        sku: item.sku,
        description: item.description,
        unit: item.unit || 'pcs',
        unitPrice: Number(item.unit_price || 0),
        currentStock: cur,
        minimumStock: min,
        reorderQuantity: Number(item.reorder_quantity || 10),
        isLowStock: cur <= min,
        createdAt: item.created_at,
      }
    })

    if (options?.lowStockOnly) {
      items = items.filter((i) => i.isLowStock)
    }

    if (options?.search) {
      const q = options.search.toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          (i.categoryName && i.categoryName.toLowerCase().includes(q))
      )
    }

    return items
  } catch (err) {
    console.error('getInventoryItems error:', err)
    return []
  }
}

/**
 * Create inventory item
 */
export async function createInventoryItem(data: {
  propertyId: string
  categoryId?: string
  supplierId?: string
  name: string
  sku: string
  unit: string
  unitPrice: number
  currentStock: number
  minimumStock: number
  reorderQuantity?: number
  description?: string
}): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        property_id: data.propertyId,
        category_id: data.categoryId || null,
        supplier_id: data.supplierId || null,
        name: data.name,
        sku: data.sku,
        unit: data.unit,
        unit_price: data.unitPrice,
        current_stock: data.currentStock,
        minimum_stock: data.minimumStock,
        reorder_quantity: data.reorderQuantity || 10,
        description: data.description || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    // Log opening transaction
    if (data.currentStock > 0) {
      await supabase.from('inventory_transactions').insert({
        item_id: item.id,
        transaction_type: 'in',
        quantity: data.currentStock,
        unit_price: data.unitPrice,
        total_cost: Number((data.currentStock * data.unitPrice).toFixed(2)),
        reference_number: 'OPENING-STOCK',
        notes: 'Initial opening stock intake',
      })
    }

    revalidatePath('/inventory')
    return { success: true, itemId: item?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create item' }
  }
}

/**
 * Adjust stock (+ intake, - deduction/waste)
 */
export async function adjustStock(data: {
  itemId: string
  transactionType: 'in' | 'out' | 'adjustment'
  quantity: number
  notes?: string
  referenceNumber?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch current item
    const { data: item, error: itemErr } = await supabase
      .from('inventory_items')
      .select('current_stock, unit_price')
      .eq('id', data.itemId)
      .single()

    if (itemErr || !item) return { success: false, error: 'Item not found' }

    let newStock = Number(item.current_stock || 0)
    if (data.transactionType === 'in') {
      newStock += data.quantity
    } else if (data.transactionType === 'out') {
      newStock = Math.max(0, newStock - data.quantity)
    } else {
      newStock = data.quantity
    }

    // 2. Update stock
    await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', data.itemId)

    // 3. Record transaction
    const unitPrice = Number(item.unit_price || 0)
    await supabase.from('inventory_transactions').insert({
      item_id: data.itemId,
      transaction_type: data.transactionType,
      quantity: data.quantity,
      unit_price: unitPrice,
      total_cost: Number((data.quantity * unitPrice).toFixed(2)),
      reference_number: data.referenceNumber || `ADJ-${Date.now().toString(36).toUpperCase()}`,
      notes: data.notes || null,
    })

    revalidatePath('/inventory')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to adjust stock' }
  }
}

/**
 * Delete inventory item
 */
export async function deleteInventoryItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete item' }
  }
}


export interface PurchaseOrderRecord {
  id: string
  propertyId: string
  poNumber: string
  supplierId?: string | null
  supplierName?: string
  status: 'draft' | 'ordered' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  expectedDelivery?: string | null
  deliveredAt?: string | null
  itemsSummary: string
  notes?: string | null
  createdAt: string
}

/**
 * Fetch purchase orders
 */
export async function getPurchaseOrders(
  propertyId: string,
  status?: string
): Promise<PurchaseOrderRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    let query = supabase
      .from('purchase_orders')
      .select(`
        id,
        property_id,
        po_number,
        supplier_id,
        status,
        total_amount,
        expected_delivery,
        delivered_at,
        items_summary,
        notes,
        created_at,
        suppliers (
          name
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((po: any) => ({
      id: po.id,
      propertyId: po.property_id,
      poNumber: po.po_number,
      supplierId: po.supplier_id,
      supplierName: po.suppliers?.name || 'Approved Vendor',
      status: po.status,
      totalAmount: Number(po.total_amount || 0),
      expectedDelivery: po.expected_delivery,
      deliveredAt: po.delivered_at,
      itemsSummary: po.items_summary,
      notes: po.notes,
      createdAt: po.created_at,
    }))
  } catch (err) {
    console.error('getPurchaseOrders error:', err)
    return []
  }
}

/**
 * Create purchase order
 */
export async function createPurchaseOrder(data: {
  propertyId: string
  supplierId?: string
  totalAmount: number
  expectedDelivery?: string
  itemsSummary: string
  notes?: string
}): Promise<{ success: boolean; poId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: po, error } = await supabase
      .from('purchase_orders')
      .insert({
        property_id: data.propertyId,
        po_number: poNumber,
        supplier_id: data.supplierId || null,
        status: 'ordered',
        total_amount: data.totalAmount,
        expected_delivery: data.expectedDelivery || null,
        items_summary: data.itemsSummary,
        notes: data.notes || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory/purchase-orders')
    return { success: true, poId: po?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create purchase order' }
  }
}

/**
 * Update purchase order status
 */
export async function updatePurchaseOrderStatus(
  orderId: string,
  status: 'draft' | 'ordered' | 'shipped' | 'delivered' | 'cancelled'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const updates: any = { status, updated_at: new Date().toISOString() }
    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory/purchase-orders')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update PO status' }
  }
}
