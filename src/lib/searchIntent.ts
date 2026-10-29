import { PROPERTY_TYPES, getPropertyLabel } from '@/constants/propertyTypes';
import type { Property } from '@/lib/firestore';

const INDEXABLE_PARAMS = new Set(['listingType', 'subListingType', 'location', 'propertyType']);
const INDEXABLE_LOCATIONS = new Set(['ชลบุรี', 'เมืองชลบุรี', 'อมตะ', 'อมตะซิตี้', 'พานทอง', 'ศรีราชา', 'บ้านบึง', 'ฉะเชิงเทรา', 'ระยอง']);

export function getPropertySearchIntent(params: URLSearchParams) {
  const rawListingType = params.get('listingType') || '';
  const rawSubListingType = params.get('subListingType') || '';
  const rawLocation = params.get('location') || '';
  const rawPropertyType = params.get('propertyType') || '';
  const listingType = rawListingType === 'sale' || rawListingType === 'rent' ? rawListingType : '';
  const subListingType = rawSubListingType === 'installment_only' ? rawSubListingType : '';
  const location = INDEXABLE_LOCATIONS.has(rawLocation) ? rawLocation : '';
  const propertyType = PROPERTY_TYPES.some((type) => type.id === rawPropertyType) ? rawPropertyType : '';
  const typeLabel = getPropertyLabel(propertyType) || (subListingType ? 'บ้าน' : 'อสังหาริมทรัพย์');
  const area = location || 'ชลบุรีและภาคตะวันออก';
  const subject = subListingType
    ? `${typeLabel}ผ่อนตรง`
    : listingType === 'rent'
      ? `${typeLabel}ให้เช่า`
      : listingType === 'sale'
        ? `ขาย${typeLabel}`
        : typeLabel;
  const title = `${subject} ${area}`;
  const description = `รวมประกาศ${title} ดูรูปภาพ ราคา พื้นที่ และรายละเอียดทรัพย์ พร้อมบริการนัดชมและปรึกษาสินเชื่อจาก SPS Property Solution`;
  const indexable = [...params.keys()].every((key) => INDEXABLE_PARAMS.has(key))
    && (!rawListingType || Boolean(listingType))
    && (!rawSubListingType || Boolean(subListingType))
    && (!rawLocation || Boolean(location))
    && (!rawPropertyType || Boolean(propertyType));
  const canonicalParams = new URLSearchParams();
  if (indexable) {
    if (listingType) canonicalParams.set('listingType', listingType);
    if (subListingType) canonicalParams.set('subListingType', subListingType);
    if (location) canonicalParams.set('location', location);
    if (propertyType) canonicalParams.set('propertyType', propertyType);
  }
  const query = canonicalParams.toString();

  return {
    title,
    description,
    indexable,
    canonicalPath: `/properties${query ? `?${query}` : ''}`,
    filters: { listingType, subListingType, location, propertyType },
  };
}

export function filterPropertiesForSeo(properties: Property[], filters: ReturnType<typeof getPropertySearchIntent>['filters']) {
  return properties.filter((property) => {
    if (filters.listingType) {
      const isRental = property.listingType === 'rent' || property.isRental;
      if (filters.listingType === 'sale' && isRental) return false;
      if (filters.listingType === 'rent' && !isRental) return false;
    }
    if (filters.subListingType && property.subListingType !== filters.subListingType) return false;
    if (filters.propertyType && property.propertyType !== filters.propertyType && property.type !== filters.propertyType) return false;
    if (filters.location) {
      const location = typeof property.location === 'object' ? property.location : null;
      const searchable = [
        typeof property.location === 'string' ? property.location : '',
        location?.subDistrict,
        location?.district,
        location?.province,
        property.district,
        property.province,
      ].filter(Boolean).join(' ');
      if (!searchable.includes(filters.location)) return false;
    }
    return true;
  });
}
