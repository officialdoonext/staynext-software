import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getEmployees } from '@/services/employee.service'
import { EmployeesClient } from './EmployeesClient'

export const metadata = { title: 'Employee Directory | StayNext' }

export default async function EmployeesPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const employees = propertyId ? await getEmployees(propertyId) : []

  return <EmployeesClient initialEmployees={employees} propertyId={propertyId} />
}
