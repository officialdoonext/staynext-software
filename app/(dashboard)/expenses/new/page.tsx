import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getExpenseCategories } from '@/services/expense.service'
import { ExpenseForm } from './ExpenseForm'

export const metadata = { title: 'Log Expense | StayNext' }

export default async function NewExpensePage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const categories = propertyId ? await getExpenseCategories(propertyId) : []

  return <ExpenseForm categories={categories} propertyId={propertyId} />
}
