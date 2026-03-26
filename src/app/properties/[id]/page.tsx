import { getPropertyById, recordPropertyView } from '@/lib/firestore';
import { extractIdFromSlug } from '@/lib/propertySlug';
import PropertyDetailClient from './PropertyDetailClient';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  
  // Extract actual Firestore ID from slug (format: {slug}--{id})
  const propertyId = extractIdFromSlug(id) || id;
  
  // Fetch property data on the server (SSR)
  let property = null;
  let loading = true;
  
  try {
    property = await getPropertyById(propertyId);
    
    // Record view asynchronously (don't wait)
    if (property?.id) {
      recordPropertyView({ propertyId: property.id, type: property.type }).catch(() => {});
    }
  } catch (error) {
    console.error('Error fetching property:', error);
    property = null;
  } finally {
    loading = false;
  }
  
  // Pass data to client component
  return <PropertyDetailClient property={property} loading={loading} />;
}
