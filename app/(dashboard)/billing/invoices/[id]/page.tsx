import React from 'react'
import { notFound } from 'next/navigation'
import { getInvoiceById } from '@/services/billing.service'
import { InvoicePrintClient } from './InvoicePrintClient'

export const metadata = { title: 'Tax Invoice | StayNext' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params

  const invoice = await getInvoiceById(id)

  if (!invoice) {
    notFound()
  }

  return <InvoicePrintClient invoice={invoice} />
}
