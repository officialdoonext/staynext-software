import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getEmployees } from '@/services/employee.service'
import { EmployeesClient } from './EmployeesClient'

export const metadata = { title: 'Employee Directory | StayNext' }

export default async function EmployeesPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const employees = propertyId ? await getEmployees(propertyId) : []

  return <EmployeesClient initialEmployees={employees} propertyId={propertyId} />
}
