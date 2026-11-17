import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getExpenseCategories } from '@/services/expense.service'
import { ExpenseCategoriesClient } from './ExpenseCategoriesClient'

export const metadata = { title: 'Expense Categories | StayNext' }

export default async function ExpenseCategoriesPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const categories = propertyId ? await getExpenseCategories(propertyId) : []

  return (
    <ExpenseCategoriesClient
      initialCategories={categories}
      propertyId={propertyId}
    />
  )
}
