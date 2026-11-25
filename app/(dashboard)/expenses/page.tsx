import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getExpenses, getExpenseCategories } from '@/services/expense.service'
import { ExpensesClient } from './ExpensesClient'

export const metadata = { title: 'Expense Management | StayNext' }

export default async function ExpensesPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const [expenses, categories] = await Promise.all([
    propertyId ? getExpenses(propertyId) : Promise.resolve([]),
    propertyId ? getExpenseCategories(propertyId) : Promise.resolve([]),
  ])

  return (
    <ExpensesClient
      initialExpenses={expenses}
      categories={categories}
      propertyId={propertyId}
    />
  )
}
