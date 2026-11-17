import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getDepartments } from '@/services/employee.service'
import { EmployeeForm } from './EmployeeForm'

export const metadata = { title: 'Add Staff Member | StayNext' }

export default async function NewEmployeePage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const departments = propertyId ? await getDepartments(propertyId) : []

  return <EmployeeForm departments={departments} propertyId={propertyId} />
}
