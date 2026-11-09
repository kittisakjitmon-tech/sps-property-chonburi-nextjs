import type { Property } from './firestore';
import { getPropertyLabel } from '../constants/propertyTypes';

export const PROPERTY_PRICE_RANGES = [
  { label: 'ไม่เกิน 1 ล้าน', value: '0-1000000' },
  { label: '1 - 2 ล้าน', value: '1000000-2000000' },
  { label: '2 - 3 ล้าน', value: '2000000-3000000' },
  { label: '1 - 3 ล้าน', value: '1000000-3000000' },
  { label: 'ต่ำกว่า 2 ล้าน', value: '0-2000000' },
  { label: '3 - 5 ล้าน', value: '3000000-5000000' },
  { label: '5 - 10 ล้าน', value: '5000000-10000000' },
  { label: '10 ล้านขึ้นไป', value: '10000000-' },
];

type SearchableProperty = Property & {
  project?: string;
  displayId?: string;
  propertyId?: string;
  propertySubStatus?: string;
  locationDisplay?: string;
  tags?: string[];
};

export function readPropertyPriceRange(params: { get: (name: string) => string | null }) {
  const range = params.get('priceRange');
  const min = params.get('priceMin') || '';
  const max = params.get('priceMax') || '';
  const value = range || (min || max ? `${min}-${max}` : '');
  return value.startsWith('-') ? `0${value}` : value;
}

export function propertyPriceOptions(value: string) {
  if (!value || PROPERTY_PRICE_RANGES.some((range) => range.value === value)) return PROPERTY_PRICE_RANGES;
  const [min, max] = value.split('-');
  const money = (amount: string) => Number(amount).toLocaleString('th-TH');
  const label = !min || min === '0' ? `ไม่เกิน ${money(max)} บาท`
    : !max ? `${money(min)} บาทขึ้นไป` : `${money(min)} - ${money(max)} บาท`;
  return [...PROPERTY_PRICE_RANGES, { value, label }];
}

export function mergePropertySearchParams(search: string, updates: Record<string, string>) {
  const params = new URLSearchParams(search);
  // Migrate old price links before removing their legacy keys.
  const priceRange = readPropertyPriceRange(params);
  if (priceRange) params.set('priceRange', priceRange);
  params.delete('priceMin');
  params.delete('priceMax');
  Object.entries(updates).forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  return params;
}

export function propertyListingType(property: Property) {
  return property.listingType || (property.isRental ? 'rent' : 'sale');
}

export function propertySubListingType(property: Property) {
  return property.subListingType || (property.directInstallment ? 'installment_only' : 'rent_only');
}

function locationText(property: SearchableProperty) {
  const location = typeof property.location === 'object' ? property.location : null;
  return [typeof property.location === 'string' ? property.location : '', location?.subDistrict,
    location?.district, location?.province, property.district, property.province,
    property.locationDisplay, property.locationText, property.address].filter(Boolean).join(' ');
}

export function matchesPropertyText(property: SearchableProperty, query: string) {
  const words = query.trim().toLocaleLowerCase('th').split(/\s+/).filter(Boolean);
  const text = [property.title, property.project, property.displayId, property.propertyId,
    locationText(property), property.type, property.propertyType, getPropertyLabel(property.type || property.propertyType || ''),
    ...(Array.isArray(property.tags) ? property.tags : [])].filter(Boolean).join(' ').toLocaleLowerCase('th');
  return words.every((word) => text.includes(word));
}

export function matchesPropertyLocation(property: SearchableProperty, location: string) {
  return [locationText(property), property.title, property.project].filter(Boolean).join(' ')
    .toLocaleLowerCase('th').includes(location.trim().toLocaleLowerCase('th'));
}

export function propertyCreatedTime(property: Property) {
  const value: unknown = property.createdAt;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (value && typeof value === 'object') {
    if ('toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
    if ('seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
  }
  return 0;
}
