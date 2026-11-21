import React from 'react'
import { getComplianceAuditLogs } from '@/services/compliance.service'
import ComplianceAuditLogsClient from './ComplianceAuditLogsClient'

export const metadata = {
  title: 'DPDP Privacy & Compliance Audit Logs | StayNext',
  description: 'Digital Personal Data Protection Act (DPDP Act 2023/2025) Guest Data Access & Audit Logs',
}

export default async function AuditLogsPage() {
  const logs = await getComplianceAuditLogs()
  return <ComplianceAuditLogsClient initialLogs={logs} />
}
