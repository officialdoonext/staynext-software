import React from 'react'
import { notFound } from 'next/navigation'
import { getPropertyById } from '@/services/property.service'
import PropertyForm from '@/components/forms/PropertyForm'

interface PageProps {
  params: Promise<{ propertyId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { propertyId } = await params
  const property = await getPropertyById(propertyId)
  return {
    title: property ? `Edit ${property.name} | StayNext` : 'Edit Property | StayNext',
  }
}

export default async function EditPropertyPage({ params }: PageProps) {
  const { propertyId } = await params
  const property = await getPropertyById(propertyId)

  if (!property) {
    notFound()
  }

  return <PropertyForm initialData={property} isEdit={true} />
}

