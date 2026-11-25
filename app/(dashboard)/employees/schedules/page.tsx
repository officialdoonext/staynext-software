import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getEmployeeSchedules, getEmployees } from '@/services/employee.service'
import { SchedulesClient } from './SchedulesClient'

export const metadata = { title: 'Staff Schedules | StayNext' }

export default async function SchedulesPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

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
