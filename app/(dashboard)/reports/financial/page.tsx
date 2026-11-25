import React from 'react'
import { getActiveTenantPropertyId } from '@/services/tenant.service'
import { getFinancialReport } from '@/services/report.service'
import { FinancialReportClient } from './FinancialReportClient'

export const metadata = { title: 'P&L Financial Statement | StayNext' }

export default async function FinancialReportPage() {
  const propertyId = (await getActiveTenantPropertyId()) || ''

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
