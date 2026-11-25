import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getExpenses, getExpenseCategories } from '@/services/expense.service'
import { ExpensesClient } from './ExpensesClient'

export const metadata = { title: 'Expense Management | StayNext' }

export default async function ExpensesPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

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
