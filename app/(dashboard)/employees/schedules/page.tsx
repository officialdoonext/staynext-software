import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getEmployeeSchedules, getEmployees } from '@/services/employee.service'
import { SchedulesClient } from './SchedulesClient'

export const metadata = { title: 'Staff Schedules | StayNext' }

export default async function SchedulesPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const schedules = propertyId ? await getEmployeeSchedules(propertyId) : []
  const employees = propertyId ? await getEmployees(propertyId) : []

  return (
    <SchedulesClient
      initialSchedules={schedules}
      employees={employees}
      propertyId={propertyId}
    />
  )
}
