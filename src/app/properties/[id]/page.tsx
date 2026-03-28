import { getPropertyById, recordPropertyView } from '@/lib/firestore';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { extractIdFromSlug } from '@/lib/propertySlug';
import PropertyDetailClient from './PropertyDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sps-property-nextjs.vercel.app';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const propertyId = extractIdFromSlug(id) || id;
  
  try {
    const property = await getPropertyById(propertyId);
    
    if (!property) {
      return { title: 'ไม่พบทรัพย์สิน' };
    }
    
    const ogImage = property.coverImageUrl || property.images?.[0] || `${BASE_URL}/logo.png`;
    const title = property.title || 'ทรัพย์สิน';
    const description = property.description?.slice(0, 160) || 'ดูรายละเอียดทรัพย์สิน';
    
    const canonicalUrl = `${BASE_URL}/properties/${id}`;
    
    return {
      title: `${title} | SPS Property`,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${title} | SPS Property`,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | SPS Property`,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'ทรัพย์สิน | SPS Property' };
  }
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
