import type { Property } from './firestore';

/**
 * ข้อมูลทรัพย์แบบย่อสำหรับหน้า listing/home — ตัด field หนัก (description, images ทั้งชุด,
 * nearbyPlaces, agentContact, ...) ออก เพื่อลดขนาด payload ที่ส่งไป client
 *
 * ยังเป็น type ที่ assignable ให้ Property ได้ (ฟิลด์ที่จำเป็นครบ) จึงใช้กับการ์ดเดิมได้เลย
 */
export type PropertyCardPayload = Pick<
  Property,
  | 'id'
  | 'title'
  | 'price'
  | 'type'
  | 'propertyType'
  | 'bedrooms'
  | 'bathrooms'
  | 'area'
  | 'areaSqWa'
  | 'location'
  | 'district'
  | 'province'
  | 'coverImageUrl'
  | 'status'
  | 'lat'
  | 'lng'
  | 'listingType'
  | 'isRental'
  | 'subListingType'
  | 'directInstallment'
  | 'propertyCondition'
  | 'availability'
  | 'hotDeal'
  | 'showPrice'
  | 'featured'
  | 'createdAt'
> & {
  /** เก็บเฉพาะรูปแรกที่การ์ดต้องใช้ */
  images: string[];
  project?: string;
  displayId?: string;
  propertyId?: string;
  locationDisplay?: string;
  locationText?: string;
  address?: string;
  tags?: string[];
};

type PropertyWithExtras = Property & {
  project?: string;
  displayId?: string;
  propertyId?: string;
  locationDisplay?: string;
  tags?: string[];
};

export function toPropertyCardPayload(property: Property): PropertyCardPayload {
  const source = property as PropertyWithExtras;
  const firstImage = source.coverImageUrl || source.images?.[0] || '';

  return {
    id: source.id,
    title: source.title,
    price: source.price,
    type: source.type,
    propertyType: source.propertyType,
    bedrooms: source.bedrooms,
    bathrooms: source.bathrooms,
    area: source.area,
    areaSqWa: source.areaSqWa,
    location: source.location,
    district: source.district,
    province: source.province,
    images: firstImage ? [firstImage] : [],
    coverImageUrl: source.coverImageUrl,
    status: source.status,
    lat: source.lat,
    lng: source.lng,
    listingType: source.listingType,
    isRental: source.isRental,
    subListingType: source.subListingType,
    directInstallment: source.directInstallment,
    propertyCondition: source.propertyCondition,
    availability: source.availability,
    hotDeal: source.hotDeal,
    showPrice: source.showPrice,
    featured: source.featured,
    createdAt: source.createdAt,
    project: source.project,
    displayId: source.displayId,
    propertyId: source.propertyId,
    locationDisplay: source.locationDisplay,
    locationText: source.locationText,
    address: source.address,
    tags: source.tags,
  };
}
