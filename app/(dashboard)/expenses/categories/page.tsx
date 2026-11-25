import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getExpenseCategories } from '@/services/expense.service'
import { ExpenseCategoriesClient } from './ExpenseCategoriesClient'

export const metadata = { title: 'Expense Categories | StayNext' }

export default async function ExpenseCategoriesPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const categories = propertyId ? await getExpenseCategories(propertyId) : []

  return (
    <ExpenseCategoriesClient
      initialCategories={categories}
      propertyId={propertyId}
    />
  )
}
