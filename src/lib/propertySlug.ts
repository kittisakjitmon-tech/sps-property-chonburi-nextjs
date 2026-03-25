/**
 * Property Slug utilities for SPS Property Solution
 */

interface Property {
  id: string;
  propertyType?: string;
  type?: string;
  location?: string | { subDistrict?: string; district?: string; province?: string } | null;
  listingType?: string;
  isRental?: boolean;
  price?: number;
}

/**
 * Extract property ID from slug (e.g., "SPS-S-2CLASS-ID-abc123" -> "abc123")
 */
export function extractIdFromSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') return null;
  const parts = slug.split('-');
  return parts[parts.length - 1] || null;
}

/**
 * Generate a URL-friendly slug from property data
 */
export function generatePropertySlug(property: Property): string {
  if (!property) return '';
  
  const parts: string[] = [];
  
  // Add property type prefix if available
  const propType = property.propertyType || property.type;
  if (propType) {
    parts.push(propType);
  }
  
  // Add location-based slug
  const loc = typeof property.location === 'object' ? property.location : null;
  if (loc?.subDistrict) {
    parts.push(loc.subDistrict);
  } else if (loc?.district) {
    parts.push(loc.district);
  }
  
  // Add property ID at the end
  if (property.id) {
    parts.push(property.id);
  }
  
  return parts.join('-').toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get the proper path for a property based on its data
 */
export function getPropertyPath(property: Property): string {
  if (!property) return '/properties';
  
  return `/properties/${property.id}`;
}
