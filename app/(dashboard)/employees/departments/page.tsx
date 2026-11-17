import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getDepartments } from '@/services/employee.service'
import { DepartmentsClient } from './DepartmentsClient'

export const metadata = { title: 'Departments | StayNext' }

export default async function DepartmentsPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const departments = propertyId ? await getDepartments(propertyId) : []

  return <DepartmentsClient initialDepartments={departments} propertyId={propertyId} />
}
