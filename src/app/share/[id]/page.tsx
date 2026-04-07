import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPropertyById } from '@/lib/firestore';
import { formatPriceShort } from '@/lib/priceFormat';
import SharePageClient from './SharePageClient';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const shareLinkRef = doc(db, "share_links", id);
    const shareLinkSnap = await getDoc(shareLinkRef);
    
    let property = null;
    let propertyId = id;
    
    if (shareLinkSnap.exists()) {
      const shareLinkData = shareLinkSnap.data();
      propertyId = shareLinkData.propertyId;
      
      // Check if link is expired
      if (shareLinkData.expiresAt) {
        const expiresAt = shareLinkData.expiresAt.toDate ? shareLinkData.expiresAt.toDate() : new Date(shareLinkData.expiresAt);
        if (expiresAt < new Date()) {
          return {
            title: 'ลิงก์หมดอายุ | SPS Property',
            description: 'ลิงก์นี้หมดอายุแล้ว',
          };
        }
      }
      
      property = await getPropertyById(propertyId);
    } else {
      // If no share link exists, maybe the id is directly a property id
      property = await getPropertyById(id);
    }
    
    if (!property) {
      return {
        title: 'ไม่พบรายการ | SPS Property',
        description: 'ไม่พบรายการอสังหาริมทรัพย์นี้',
      };
    }
    
    const loc = typeof property.location === 'object' ? property.location : null;
    const isRental = property.isRental || property.listingType === 'rent';
    const typeLabel = property.title || 'อสังหาริมทรัพย์';
    const locationString = loc ? [loc.subDistrict, loc.district, loc.province].filter(Boolean).join(', ') : '';
    const priceString = formatPriceShort(property.price, isRental, property.showPrice !== false);
    const description = `ราคา ${priceString}${locationString ? ` - ${locationString}` : ''}`;
    
    // Get the best image for OG
    const defaultImg = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200';
    const rawImgs = property.images || [];
    const ogImageUrl = property.coverImageUrl || rawImgs[0] || defaultImg;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spspropertysolution.com';
    
    return {
      title: `${typeLabel} | SPS Property`,
      description,
      openGraph: {
        title: typeLabel,
        description,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: typeLabel,
          }
        ],
        type: 'website',
        url: `${baseUrl}/share/${id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: typeLabel,
        description,
        images: [ogImageUrl],
      },
      alternates: {
        canonical: `${baseUrl}/share/${id}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'SPS Property',
      description: 'อสังหาริมทรัพย์ บ้าน คอนโด ที่ดิน ขาย-เช่า',
    };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  
  let property = null;
  
  try {
    const shareLinkRef = doc(db, "share_links", id);
    const shareLinkSnap = await getDoc(shareLinkRef);
    
    if (shareLinkSnap.exists()) {
      const shareLinkData = shareLinkSnap.data();
      
      // Check if link is expired
      if (shareLinkData.expiresAt) {
        const expiresAt = shareLinkData.expiresAt.toDate ? shareLinkData.expiresAt.toDate() : new Date(shareLinkData.expiresAt);
        if (expiresAt < new Date()) {
          // Link expired, pass null to client
          return <SharePageClient id={id} propertyData={null} />;
        }
      }
      
      property = await getPropertyById(shareLinkData.propertyId);
    } else {
      // If no share link exists, try to get property directly
      property = await getPropertyById(id);
    }
  } catch (error) {
    console.error('Error fetching property in server:', error);
  }
  
  return <SharePageClient id={id} propertyData={property} />;
}
