'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DepartmentRecord {
  id: string
  propertyId: string
  name: string
  description?: string
  employeeCount?: number
  createdAt: string
}

export interface EmployeeRecord {
  id: string
  propertyId: string
  departmentId?: string | null
  departmentName?: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  phone?: string
  role: string
  hireDate?: string
  salary?: number
  isActive: boolean
  createdAt: string
}

export interface ShiftScheduleRecord {
  id: string
  propertyId: string
  employeeId: string
  employeeName: string
  shiftDate: string
  shiftType: string
  startTime: string
  endTime: string
  notes?: string
}

/**
 * Fetch departments for a property
 */
export async function getDepartments(propertyId: string): Promise<DepartmentRecord[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (error || !data) return []

    // Fetch employee counts
    const { data: emps } = await supabase
      .from('employees')
      .select('department_id')
      .eq('property_id', propertyId)

    const countMap: Record<string, number> = {}
    ;(emps || []).forEach((e: any) => {
      if (e.department_id) {
        countMap[e.department_id] = (countMap[e.department_id] || 0) + 1
      }
    })

    return data.map((d: any) => ({
      id: d.id,
      propertyId: d.property_id,
      name: d.name,
      description: d.description,
      employeeCount: countMap[d.id] || 0,
      createdAt: d.created_at,
    }))
  } catch (err) {
    console.error('getDepartments error:', err)
    return []
  }
}

/**
 * Create a new department
 */
export async function createDepartment(data: {
  propertyId: string
  name: string
  description?: string
}): Promise<{ success: boolean; departmentId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: dept, error } = await supabase
      .from('departments')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        description: data.description || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/employees/departments')
    return { success: true, departmentId: dept?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create department' }
  }
}

/**
 * Delete a department
 */
export async function deleteDepartment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/employees/departments')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete department' }
  }
}

/**
 * Fetch employees
 */
export async function getEmployees(
  propertyId: string,
  options?: { departmentId?: string; role?: string; search?: string }
): Promise<EmployeeRecord[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('employees')
      .select(`
        id,
        property_id,
        department_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        hire_date,
        salary,
        is_active,
        created_at,
        departments (
          name
        )
      `)
      .eq('property_id', propertyId)
      .order('first_name', { ascending: true })

    if (options?.departmentId && options.departmentId !== 'all') {
      query = query.eq('department_id', options.departmentId)
    }

    if (options?.role && options.role !== 'all') {
      query = query.eq('role', options.role)
    }

    const { data, error } = await query

    if (error || !data) return []

    let records: EmployeeRecord[] = data.map((e: any) => {
      const fn = e.first_name || ''
      const ln = e.last_name || ''
      return {
        id: e.id,
        propertyId: e.property_id,
        departmentId: e.department_id,
        departmentName: e.departments?.name || 'Operations',
        firstName: fn,
        lastName: ln,
        fullName: `${fn} ${ln}`.trim() || 'Staff Member',
        email: e.email,
        phone: e.phone,
        role: e.role || 'Staff',
        hireDate: e.hire_date,
        salary: Number(e.salary || 0),
        isActive: Boolean(e.is_active),
        createdAt: e.created_at,
      }
    })

    if (options?.search) {
      const q = options.search.toLowerCase()
      records = records.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          (e.email && e.email.toLowerCase().includes(q)) ||
          (e.phone && e.phone.toLowerCase().includes(q)) ||
          e.role.toLowerCase().includes(q)
      )
    }

    return records
  } catch (err) {
    console.error('getEmployees error:', err)
    return []
  }
}

/**
 * Create an employee
 */
export async function createEmployee(data: {
  propertyId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role?: string
  departmentId?: string
  hireDate?: string
  salary?: number
}): Promise<{ success: boolean; employeeId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Retrieve tenant_id for property
    const { data: prop } = await supabase
      .from('properties')
      .select('tenant_id')
      .eq('id', data.propertyId)
      .single()

    const tenantId = prop?.tenant_id

    const { data: emp, error } = await supabase
      .from('employees')
      .insert({
        tenant_id: tenantId,
        property_id: data.propertyId,
        department_id: data.departmentId || null,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        role: (data.role as any) || 'receptionist',
        hire_date: data.hireDate || new Date().toISOString().split('T')[0],
        salary: data.salary || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/employees')
    return { success: true, employeeId: emp?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create employee' }
  }
}

/**
 * Delete an employee
 */
export async function deleteEmployee(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/employees')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete employee' }
  }
}

/**
 * Fetch employee schedules
 */
export async function getEmployeeSchedules(
  propertyId: string,
  startDate?: string,
  endDate?: string
): Promise<ShiftScheduleRecord[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('employee_schedules')
      .select(`
        id,
        property_id,
        employee_id,
        shift_date,
        shift_type,
        start_time,
        end_time,
        notes,
        employees (
          first_name,
          last_name
        )
      `)
      .eq('property_id', propertyId)
      .order('shift_date', { ascending: true })

    if (startDate) query = query.gte('shift_date', startDate)
    if (endDate) query = query.lte('shift_date', endDate)

    const { data, error } = await query

    if (error || !data) return []

    return data.map((s: any) => {
      const e = s.employees
      const employeeName = e ? `${e.first_name} ${e.last_name}`.trim() : 'Staff Member'
      return {
        id: s.id,
        propertyId: s.property_id,
        employeeId: s.employee_id,
        employeeName,
        shiftDate: s.shift_date,
        shiftType: s.shift_type,
        startTime: s.start_time || '08:00',
        endTime: s.end_time || '17:00',
        notes: s.notes,
      }
    })
  } catch (err) {
    console.error('getEmployeeSchedules error:', err)
    return []
  }
}

/**
 * Assign employee shift
 */
export async function assignEmployeeShift(data: {
  propertyId: string
  employeeId: string
  shiftDate: string
  shiftType: string
  startTime?: string
  endTime?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('employee_schedules').insert({
      property_id: data.propertyId,
      employee_id: data.employeeId,
      shift_date: data.shiftDate,
      shift_type: data.shiftType,
      start_time: data.startTime || '08:00:00',
      end_time: data.endTime || '17:00:00',
      notes: data.notes || null,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/employees/schedules')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to assign shift' }
  }
}
