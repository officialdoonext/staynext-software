import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getFinancialReport } from '@/services/report.service'
import { FinancialReportClient } from './FinancialReportClient'

export const metadata = { title: 'P&L Financial Statement | StayNext' }

export default async function FinancialReportPage() {
  const supabase = await createClient()

  let propertyId = ''
  try {
    const { data: props } = await supabase.from('properties').select('id').limit(1)
    if (props && props.length > 0) {
      propertyId = props[0].id
    }
  } catch {}

  const pnl = propertyId
    ? await getFinancialReport(propertyId)
    : {
        roomRevenue: 0,
        fbRevenue: 0,
        otherRevenue: 0,
        grossRevenue: 0,
        taxCollected: 0,
        totalExpenses: 0,
        expensesByCategory: [],
        netOperatingIncome: 0,
        profitMarginPercent: 0,
      }

  return <FinancialReportClient pnl={pnl} propertyId={propertyId} />
}
