'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CorporateAccountRecord {
  id: string
  propertyId: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  creditLimit: number
  discountPercentage: number
  paymentTerms: string
  isActive: boolean
  createdAt: string
}

export interface CorporateContractRecord {
  id: string
  corporateAccountId: string
  companyName?: string
  contractNumber: string
  startDate: string
  endDate: string
  roomRateDiscountPercent: number
  complimentaryBreakfast: boolean
  paymentTerms: string
  status: string
  notes?: string
  createdAt: string
}

export interface TravelAgentRecord {
  id: string
  propertyId: string
  name: string
  agencyName?: string
  iataNumber?: string
  email?: string
  phone?: string
  commissionPercentage: number
  isActive: boolean
  createdAt: string
}

/**
 * Fetch corporate accounts
 */
export async function getCorporateAccounts(
  propertyId: string,
  search?: string
): Promise<CorporateAccountRecord[]> {
  try {
    const supabase = await createClient()

    const query = supabase
      .from('corporate_accounts')
      .select('*')
      .eq('property_id', propertyId)
      .order('company_name', { ascending: true })

    const { data, error } = await query

    if (error || !data) return []

    let records: CorporateAccountRecord[] = data.map((ca: any) => ({
      id: ca.id,
      propertyId: ca.property_id,
      companyName: ca.company_name,
      contactPerson: ca.contact_person,
      email: ca.email,
      phone: ca.phone,
      address: ca.address,
      taxId: ca.tax_id,
      creditLimit: Number(ca.credit_limit || 0),
      discountPercentage: Number(ca.discount_percentage || 0),
      paymentTerms: ca.payment_terms || 'Net 30',
      isActive: Boolean(ca.is_active),
      createdAt: ca.created_at,
    }))

    if (search) {
      const q = search.toLowerCase()
      records = records.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    }

    return records
  } catch (err) {
    console.error('getCorporateAccounts error:', err)
    return []
  }
}

/**
 * Create corporate account
 */
export async function createCorporateAccount(data: {
  propertyId: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  creditLimit?: number
  discountPercentage?: number
  paymentTerms?: string
}): Promise<{ success: boolean; accountId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: ca, error } = await supabase
      .from('corporate_accounts')
      .insert({
        property_id: data.propertyId,
        company_name: data.companyName,
        contact_person: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        tax_id: data.taxId || null,
        credit_limit: data.creditLimit || 50000,
        discount_percentage: data.discountPercentage || 15,
        payment_terms: data.paymentTerms || 'Net 30',
        is_active: true,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/corporate')
    return { success: true, accountId: ca?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create corporate account' }
  }
}

/**
 * Delete corporate account
 */
export async function deleteCorporateAccount(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('corporate_accounts').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/corporate')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete account' }
  }
}

/**
 * Fetch corporate contracts
 */
export async function getCorporateContracts(propertyId: string): Promise<CorporateContractRecord[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('corporate_contracts')
      .select(`
        id,
        corporate_account_id,
        contract_number,
        start_date,
        end_date,
        room_rate_discount_percent,
        complimentary_breakfast,
        payment_terms,
        status,
        notes,
        created_at,
        corporate_accounts!inner (
          id,
          property_id,
          company_name
        )
      `)
      .eq('corporate_accounts.property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map((c: any) => ({
      id: c.id,
      corporateAccountId: c.corporate_account_id,
      companyName: c.corporate_accounts?.company_name || 'Corporate Partner',
      contractNumber: c.contract_number,
      startDate: c.start_date,
      endDate: c.end_date,
      roomRateDiscountPercent: Number(c.room_rate_discount_percent || 15),
      complimentaryBreakfast: Boolean(c.complimentary_breakfast),
      paymentTerms: c.payment_terms || 'Net 30',
      status: c.status || 'active',
      notes: c.notes,
      createdAt: c.created_at,
    }))
  } catch (err) {
    console.error('getCorporateContracts error:', err)
    return []
  }
}

/**
 * Create corporate contract
 */
export async function createCorporateContract(data: {
  corporateAccountId: string
  contractNumber?: string
  startDate: string
  endDate: string
  roomRateDiscountPercent: number
  complimentaryBreakfast: boolean
  paymentTerms?: string
  notes?: string
}): Promise<{ success: boolean; contractId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const contractNumber =
      data.contractNumber || `CORP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: contract, error } = await supabase
      .from('corporate_contracts')
      .insert({
        corporate_account_id: data.corporateAccountId,
        contract_number: contractNumber,
        start_date: data.startDate,
        end_date: data.endDate,
        room_rate_discount_percent: data.roomRateDiscountPercent,
        complimentary_breakfast: data.complimentaryBreakfast,
        payment_terms: data.paymentTerms || 'Net 30',
        status: 'active',
        notes: data.notes || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/corporate/contracts')
    return { success: true, contractId: contract?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create contract' }
  }
}

/**
 * Delete corporate contract
 */
export async function deleteCorporateContract(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('corporate_contracts').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/corporate/contracts')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete contract' }
  }
}

/**
 * Fetch travel agents
 */
export async function getTravelAgents(propertyId: string): Promise<TravelAgentRecord[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('travel_agents')
      .select('*')
      .eq('property_id', propertyId)
      .order('name', { ascending: true })

    if (error || !data) return []

    return data.map((ta: any) => ({
      id: ta.id,
      propertyId: ta.property_id,
      name: ta.name,
      agencyName: ta.agency_name,
      iataNumber: ta.iata_number,
      email: ta.email,
      phone: ta.phone,
      commissionPercentage: Number(ta.commission_percentage || 10),
      isActive: Boolean(ta.is_active),
      createdAt: ta.created_at,
    }))
  } catch (err) {
    console.error('getTravelAgents error:', err)
    return []
  }
}

/**
 * Create travel agent
 */
export async function createTravelAgent(data: {
  propertyId: string
  name: string
  agencyName?: string
  iataNumber?: string
  email?: string
  phone?: string
  commissionPercentage: number
}): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: ta, error } = await supabase
      .from('travel_agents')
      .insert({
        property_id: data.propertyId,
        name: data.name,
        agency_name: data.agencyName || null,
        iata_number: data.iataNumber || null,
        email: data.email || null,
        phone: data.phone || null,
        commission_percentage: data.commissionPercentage,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/corporate/travel-agents')
    return { success: true, agentId: ta?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create travel agent' }
  }
}

/**
 * Delete travel agent
 */
export async function deleteTravelAgent(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('travel_agents').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/corporate/travel-agents')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete agent' }
  }
}

