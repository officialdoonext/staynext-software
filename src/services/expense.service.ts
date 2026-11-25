'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTenantPropertyIds } from '@/services/tenant.service'

export interface ExpenseCategoryRecord {
  id: string
  propertyId: string
  name: string
  code?: string
  description?: string
  budget: number
  spent: number
  transactionCount: number
  createdAt: string
}

export interface ExpenseRecord {
  id: string
  propertyId: string
  categoryId?: string | null
  categoryName?: string
  description: string
  amount: number
  expenseDate: string
  paymentMethod?: string | null
  vendorName?: string | null
  receiptUrl?: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

/**
 * Fetch all expense categories for a property, with aggregated spend
 */
export async function getExpenseCategories(propertyId: string): Promise<ExpenseCategoryRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (error || !categories) return []

    // Fetch all expenses to compute spent per category
    const { data: expenses } = await supabase
      .from('expenses')
      .select('category_id, amount')
      .eq('property_id', propertyId)

    const spendMap: Record<string, { spent: number; count: number }> = {}
    ;(expenses || []).forEach((e: any) => {
      const catId = e.category_id || 'uncategorized'
      if (!spendMap[catId]) spendMap[catId] = { spent: 0, count: 0 }
      spendMap[catId].spent += Number(e.amount || 0)
      spendMap[catId].count += 1
    })

    return categories.map((cat: any) => ({
      id: cat.id,
      propertyId: cat.property_id,
      name: cat.name,
      code: cat.code || `EXP-${cat.name.slice(0, 3).toUpperCase()}`,
      description: cat.description || '',
      budget: Number(cat.budget || 0),
      spent: spendMap[cat.id]?.spent || 0,
      transactionCount: spendMap[cat.id]?.count || 0,
      createdAt: cat.created_at,
    }))
  } catch (err) {
    console.error('getExpenseCategories exception:', err)
    return []
  }
}

/**
 * Create a new expense category
 */
export async function createExpenseCategory(data: {
  propertyId: string
  name: string
  code?: string
  description?: string
  budget?: number
}): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: newCat, error } = await supabase
      .from('expense_categories')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        code: data.code || `EXP-${data.name.slice(0, 3).toUpperCase()}`,
        description: data.description || null,
        budget: data.budget || 0,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/expenses/categories')
    return { success: true, categoryId: newCat?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create category' }
  }
}

/**
 * Delete expense category
 */
export async function deleteExpenseCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('expense_categories').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/expenses/categories')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete category' }
  }
}

/**
 * Fetch expenses list with optional filters
 */
export async function getExpenses(
  propertyId: string,
  options?: {
    categoryId?: string
    status?: string
    startDate?: string
    endDate?: string
    search?: string
  }
): Promise<ExpenseRecord[]> {
  try {
    const allowedPropertyIds = await getTenantPropertyIds()
    if (!propertyId || !allowedPropertyIds.includes(propertyId)) return []

    const supabase = await createClient()

    let query = supabase
      .from('expenses')
      .select(`
        id,
        property_id,
        category_id,
        description,
        amount,
        expense_date,
        payment_method,
        vendor_name,
        receipt_url,
        status,
        created_at,
        updated_at,
        expense_categories (
          name
        )
      `)
      .eq('property_id', propertyId)
      .order('expense_date', { ascending: false })

    if (options?.categoryId && options.categoryId !== 'all') {
      query = query.eq('category_id', options.categoryId)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.startDate) {
      query = query.gte('expense_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('expense_date', options.endDate)
    }

    const { data, error } = await query

    if (error || !data) return []

    let records: ExpenseRecord[] = data.map((exp: any) => ({
      id: exp.id,
      propertyId: exp.property_id,
      categoryId: exp.category_id,
      categoryName: exp.expense_categories?.name || 'General',
      description: exp.description,
      amount: Number(exp.amount || 0),
      expenseDate: exp.expense_date,
      paymentMethod: exp.payment_method || 'Cash',
      vendorName: exp.vendor_name || 'Vendor',
      receiptUrl: exp.receipt_url,
      status: exp.status || 'approved',
      createdAt: exp.created_at,
      updatedAt: exp.updated_at,
    }))

    if (options?.search) {
      const q = options.search.toLowerCase()
      records = records.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.vendorName && e.vendorName.toLowerCase().includes(q)) ||
          (e.categoryName && e.categoryName.toLowerCase().includes(q))
      )
    }

    return records
  } catch (err) {
    console.error('getExpenses exception:', err)
    return []
  }
}

/**
 * Create a new expense record in Supabase
 */
export async function createExpense(data: {
  propertyId: string
  categoryId?: string
  description: string
  amount: number
  expenseDate: string
  paymentMethod?: string
  vendorName?: string
  receiptUrl?: string
  status?: 'pending' | 'approved' | 'rejected'
}): Promise<{ success: boolean; expenseId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: exp, error } = await supabase
      .from('expenses')
      .insert({
        property_id: data.propertyId,
        category_id: data.categoryId || null,
        description: data.description,
        amount: data.amount,
        expense_date: data.expenseDate,
        payment_method: data.paymentMethod || 'cash',
        vendor_name: data.vendorName || null,
        receipt_url: data.receiptUrl || null,
        status: data.status || 'approved',
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/expenses')
    return { success: true, expenseId: exp?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record expense' }
  }
}

/**
 * Delete expense record with confirmation
 */
export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/expenses')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete expense' }
  }
}

