import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocationString, getPropertyById, recordPropertyView } from '@/lib/firestore';

export const dynamic = 'force-dynamic';
import { extractIdFromSlug, getPropertyPath } from '@/lib/propertySlug';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { SITE_URL, absoluteUrl } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import PropertyDetailClient from './PropertyDetailClient';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

const getProperty = cache(async (id: string) => getPropertyById(id));

function toIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(extractIdFromSlug(id) || id);

  if (!property) {
    return { title: 'ไม่พบทรัพย์สิน', robots: { index: false, follow: true } };
  }

  const typeLabel = getPropertyLabel(property.type || property.propertyType || '') || 'อสังหาริมทรัพย์';
  const location = getLocationString(property.location) || property.province || 'ชลบุรี';
  const listingLabel = property.isRental || property.listingType === 'rent' ? 'ให้เช่า' : 'ขาย';
  const title = property.title || `${listingLabel}${typeLabel} ${location}`;
  const facts = [
    `${listingLabel}${typeLabel} ${location}`,
    property.bedrooms != null ? `${property.bedrooms} ห้องนอน` : '',
    property.bathrooms != null ? `${property.bathrooms} ห้องน้ำ` : '',
    property.area > 0 ? `พื้นที่ ${Math.round(property.area / 4)} ตารางวา` : '',
    property.showPrice !== false && property.price > 0 ? `ราคา ${property.price.toLocaleString('th-TH')} บาท` : '',
  ].filter(Boolean).join(' • ');
  const description = `${facts} ดูรูปภาพ รายละเอียด และนัดชมทรัพย์กับ SPS Property Solution`;
  const canonicalPath = getPropertyPath(property);
  const ogImage = property.coverImageUrl || property.images?.[0] || '/logo.png';

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: property.status === 'available', follow: true },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await getProperty(extractIdFromSlug(id) || id);
  if (!property) notFound();

  const canonicalPath = getPropertyPath(property);
  if (decodeURIComponent(id) !== canonicalPath.split('/').pop()) permanentRedirect(encodeURI(canonicalPath));

  recordPropertyView({ propertyId: property.id, type: property.type }).catch(() => {});

  const title = property.title || 'อสังหาริมทรัพย์';
  const typeLabel = getPropertyLabel(property.type || property.propertyType || '') || 'อสังหาริมทรัพย์';
  const location = typeof property.location === 'object' ? property.location : null;
  const isRental = property.isRental || property.listingType === 'rent';
  const residenceType = typeLabel.includes('ที่ดิน') ? 'LandPlot' : typeLabel.includes('บ้าน') ? 'SingleFamilyResidence' : 'Residence';
  const residenceId = `${absoluteUrl(canonicalPath)}#residence`;
  const description = property.description?.replace(/\s+/g, ' ').trim() || `${isRental ? 'ให้เช่า' : 'ขาย'}${typeLabel} ${getLocationString(property.location)}`;
  const images = [property.coverImageUrl, ...(property.images || [])].filter((image): image is string => Boolean(image));
  const datePosted = toIsoDate(property.createdAt);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateListing',
        '@id': `${absoluteUrl(canonicalPath)}#listing`,
        name: title,
        description,
        url: absoluteUrl(canonicalPath),
        image: images,
        ...(datePosted ? { datePosted } : {}),
        inLanguage: 'th',
        provider: { '@id': `${SITE_URL}/#business` },
        about: { '@id': residenceId },
      },
      {
        '@type': residenceType,
        '@id': residenceId,
        name: `${typeLabel} ${getLocationString(property.location)}`.trim(),
        ...(property.bedrooms != null ? { numberOfBedrooms: property.bedrooms } : {}),
        ...(property.bathrooms != null ? { numberOfBathroomsTotal: property.bathrooms } : {}),
        ...(property.area > 0 ? { additionalProperty: { '@type': 'PropertyValue', name: 'พื้นที่', value: `${Math.round(property.area / 4)} ตารางวา` } } : {}),
        address: {
          '@type': 'PostalAddress',
          ...(property.address ? { streetAddress: property.address } : {}),
          addressLocality: location?.district || getLocationString(property.location) || property.district || '',
          addressRegion: location?.province || property.province || 'ชลบุรี',
          addressCountry: 'TH',
        },
      },
      ...(property.showPrice !== false && property.price > 0 ? [{
        '@type': 'Offer',
        priceCurrency: 'THB',
        price: Number(property.price),
        url: absoluteUrl(canonicalPath),
        availability: property.availability === 'available' && property.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability',
        itemOffered: { '@id': residenceId },
      }] : []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'อสังหาริมทรัพย์', item: absoluteUrl('/properties') },
          { '@type': 'ListItem', position: 3, name: title, item: absoluteUrl(canonicalPath) },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <PropertyDetailClient property={property} />
    </>
  );
}
