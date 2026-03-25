/**
 * Property Slug utilities for SEO-friendly URLs
 */

import { getPropertyLabel } from '@/constants/propertyTypes';

function sanitizeSlugPart(str: string): string {
  return String(str)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\-.]/g, '');
}

function formatPriceForSlug(price: number): string {
  const num = Number(price);
  if (!Number.isFinite(num) || num <= 0) return '';
  if (num >= 1_000_000) {
    const m = (num / 1_000_000).toFixed(2);
    return `${parseFloat(m)}m`;
  }
  if (num >= 1_000) {
    const k = (num / 1_000).toFixed(1);
    return `${parseFloat(k)}k`;
  }
  return String(num);
}

interface PropertyLocation {
  district?: string;
  province?: string;
  [key: string]: any;
}

interface Property {
  id: string;
  location?: string | PropertyLocation | null;
  type?: string;
  propertyType?: string;
  listingType?: string;
  isRental?: boolean;
  price?: number;
  title?: string;
}

/**
 * Build a URL-safe slug from property data.
 * Format: {district}-{province}-{typeLabel}-{ขาย|เช่า}-{price}--{id}
 * Example: บ้านบึง-ชลบุรี-บ้านเดี่ยว-ขาย-2.50m--abc123
 */
export function generatePropertySlug(property: Property): string {
  if (!property?.id) {
    console.warn('Property missing id:', property);
    return '';
  }

  const parts: string[] = [];

  // Handle location (can be string or object)
  const loc = property.location;
  if (typeof loc === 'string') {
    parts.push(sanitizeSlugPart(loc));
  } else if (loc && typeof loc === 'object') {
    if (loc.district) parts.push(sanitizeSlugPart(loc.district));
    if (loc.province) parts.push(sanitizeSlugPart(loc.province));
  }

  // Property type
  const typeLabel = getPropertyLabel(property.type || property.propertyType || '');
  if (typeLabel) parts.push(sanitizeSlugPart(typeLabel));

  // Listing type (rent or sale)
  let listingType = property.listingType;
  if (!listingType) {
    listingType = property.isRental ? 'rent' : 'sale';
  }
  parts.push(listingType === 'rent' ? 'เช่า' : 'ขาย');

  // Price slug
  const priceSlug = formatPriceForSlug(property.price || 0);
  if (priceSlug) parts.push(priceSlug);

  const body = parts.filter(Boolean).join('-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  if (!body) {
    console.warn('Empty slug body for property:', property.id, property);
    return `property--${property.id}`;
  }

  return `${body}--${property.id}`;
}

/** Full path for a property detail page */
export function getPropertyPath(property: Property): string {
  if (!property?.id) return '/properties';
  const slug = generatePropertySlug(property);
  return `/properties/${slug}`;
}

/** Short path for sharing via link (just ID) */
export function getShortPropertyPath(property: Property): string {
  if (!property?.id) return '/properties';
  return `/p/${property.id}`;
}

/** Extract Firestore document ID from a slug param (backward-compatible) */
export function extractIdFromSlug(slugParam: string | null | undefined): string | null {
  if (!slugParam) {
    console.warn('extractIdFromSlug: empty slug param');
    return null;
  }

  const slug = String(slugParam).trim();
  const sep = slug.lastIndexOf('--');

  if (sep === -1) {
    console.warn('extractIdFromSlug: no -- separator found in slug:', slug);
    return null;
  }

  const id = slug.substring(sep + 2);
  if (!id) {
    console.warn('extractIdFromSlug: empty id after separator in slug:', slug);
    return null;
  }

  return id;
}
