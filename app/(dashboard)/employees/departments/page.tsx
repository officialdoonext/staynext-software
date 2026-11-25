import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getDepartments } from '@/services/employee.service'
import { DepartmentsClient } from './DepartmentsClient'

export const metadata = { title: 'Departments | StayNext' }

export default async function DepartmentsPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const departments = propertyId ? await getDepartments(propertyId) : []

  return <DepartmentsClient initialDepartments={departments} propertyId={propertyId} />
}
