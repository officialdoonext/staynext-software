import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getDepartments } from '@/services/employee.service'
import { EmployeeForm } from './EmployeeForm'

export const metadata = { title: 'Add Staff Member | StayNext' }

export default async function NewEmployeePage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

  const departments = propertyId ? await getDepartments(propertyId) : []

  return <EmployeeForm departments={departments} propertyId={propertyId} />
}
