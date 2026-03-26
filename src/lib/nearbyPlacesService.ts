/**
 * Nearby Places Service – ใช้ Longdo POI API
 * ดึงสถานที่ใกล้เคียงจาก Longdo → cache ลง Firestore (nearbyPlaces)
 */
import { parseCoordinatesFromUrl } from './googleMapsUrl'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const LONGDO_POI_API = 'https://api.longdo.com/POIService/json/search'
const LONGDO_KEY = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY
const MAX_DISTANCE_KM = 20
const MAX_PER_CATEGORY = 3
const SEARCH_SPAN = '20km'
const LIMIT_PER_TAG = 15

const CATEGORY_META: Record<string, { label: string; tags: string[] }> = {
  industrial: { label: 'นิคมอุตสาหกรรม', tags: ['industrial_estate', 'factory'] },
  hospital: { label: 'โรงพยาบาล', tags: ['hospital', 'clinic'] },
  mall: { label: 'ห้างสรรพสินค้า', tags: ['department_store', 'shopping_mall', 'mall'] },
  education: { label: 'การศึกษา', tags: ['school', 'university', 'college'] },
}

/** Cache ในหน่วยความจำ (TTL 5 นาที) ลดการอ่าน Firestore / เรียก Longdo POI ซ้ำใน session เดียวกัน */
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000
const memoryCache = new Map<string, { places: any[]; expiresAt: number }>()

function getCachedNearby(propertyId: string): any[] | null {
  const entry = memoryCache.get(propertyId)
  if (!entry || Date.now() > entry.expiresAt) return null
  return entry.places
}

function setCachedNearby(propertyId: string, places: any[]): void {
  memoryCache.set(propertyId, { places, expiresAt: Date.now() + MEMORY_CACHE_TTL_MS })
}

/** Haversine – ระยะเส้นตรง (กม.) */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function getCoordsFromProperty(property: any): { lat: number; lng: number } | null {
  const lat = property.lat != null ? Number(property.lat) : null
  const lng = property.lng != null ? Number(property.lng) : null
  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
  if (property.mapUrl) return parseCoordinatesFromUrl(property.mapUrl)
  if (property.location?.lat && property.location?.lng) {
    return { lat: Number(property.location.lat), lng: Number(property.location.lng) }
  }
  return null
}

/** เรียก Longdo POI search ตาม tag */
async function searchLongdoPOI(lat: number, lng: number, tagCsv: string): Promise<any[]> {
  if (!LONGDO_KEY) return []
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      span: SEARCH_SPAN,
      tag: tagCsv,
      limit: String(LIMIT_PER_TAG),
      locale: 'th',
      key: LONGDO_KEY,
    })
    const res = await fetch(`${LONGDO_POI_API}?${params.toString()}`)
    if (!res.ok) return []
    const json = await res.json()
    const list = json?.data || []
    return list.map((p: any) => ({
      name: p.name || 'สถานที่',
      lat: p.lat,
      lng: p.lon,
      address: p.address || '',
      distance: p.distance,
      tag: p.tag,
    }))
  } catch {
    return []
  }
}

/** รวมผลจากหลาย tag แล้วคำนวณระยะ Haversine เรียงใกล้สุด */
function mergeAndSort(originLat: number, originLng: number, category: string, items: any[]): any[] {
  const withKm = items
    .filter((p) => p.name && p.lat != null && p.lng != null)
    .map((p) => ({
      ...p,
      category,
      straightDistanceKm: haversineDistance(originLat, originLng, p.lat, p.lng),
    }))
    .filter((p: any) => p.straightDistanceKm <= MAX_DISTANCE_KM + 2)

  withKm.sort((a: any, b: any) => a.straightDistanceKm - b.straightDistanceKm)

  const seen = new Set<string>()
  const deduped = withKm.filter((p: any) => {
    const key = `${p.name}|${p.lat?.toFixed(4)}|${p.lng?.toFixed(4)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return deduped.slice(0, MAX_PER_CATEGORY)
}

/** แปลงเป็นรูปแบบเดียวกับเดิม (ให้ NeighborhoodData / ฟอร์มใช้ได้) */
function formatOutputByCategory(candidatesByCategory: Record<string, any[]>): any[] {
  return Object.entries(candidatesByCategory).flatMap(([category, places]) => {
    const label = CATEGORY_META[category]?.label || 'สถานที่'
    return places.map((p: any) => {
      const km = p.straightDistanceKm
      const distanceText = Number.isFinite(km) ? `${km.toFixed(1)} กม.` : 'ประมาณ'
      const durationText = 'ตรวจสอบจากแผนที่'
      return {
        name: p.name,
        type: category,
        typeLabel: label,
        distanceKm: Number.isFinite(km) ? Number(km.toFixed(2)) : null,
        distanceText,
        durationText,
        durationMinutes: null,
        displayText: `${p.name} - ${distanceText} (${durationText})`,
        travelMode: 'driving',
      }
    })
  })
}

/**
 * ค้นหาและ cache สถานที่ใกล้เคียงจาก Longdo POI
 * ถ้า property มี nearbyPlaces อยู่แล้วจะไม่ดึงใหม่ (ใช้ cache จาก Firestore)
 */
export async function fetchAndCacheNearbyPlaces(property: any, options: { forceRefresh?: boolean } = {}): Promise<any[]> {
  const { forceRefresh = false } = options
  const coords = getCoordsFromProperty(property)
  
  if (!coords) {
    console.warn('[NearbyPlaces] No coordinates found for property')
    return []
  }
  
  if (!LONGDO_KEY) {
    console.warn('[NearbyPlaces] Missing NEXT_PUBLIC_LONGDO_MAP_KEY')
    return []
  }

  // ถ้ามี nearbyPlaces ใน property อยู่แล้ว ไม่ต้องดึงใหม่
  if (!forceRefresh && Array.isArray(property.nearbyPlaces) && property.nearbyPlaces.length > 0) {
    if (property.id) setCachedNearby(property.id, property.nearbyPlaces)
    return property.nearbyPlaces
  }

  // ตรวจสอบ memory cache
  if (!forceRefresh && property.id) {
    const cached = getCachedNearby(property.id)
    if (cached) return cached
  }

  const { lat, lng } = coords

  const [industrialRes, hospitalRes, mallRes, educationRes] = await Promise.all([
    searchLongdoPOI(lat, lng, 'industrial_estate,factory'),
    searchLongdoPOI(lat, lng, 'hospital,clinic'),
    searchLongdoPOI(lat, lng, 'department_store,shopping_mall,mall'),
    searchLongdoPOI(lat, lng, 'school,university,college'),
  ])

  const candidatesByCategory: Record<string, any[]> = {
    industrial: mergeAndSort(lat, lng, 'industrial', industrialRes),
    hospital: mergeAndSort(lat, lng, 'hospital', hospitalRes),
    mall: mergeAndSort(lat, lng, 'mall', mallRes),
    education: mergeAndSort(lat, lng, 'education', educationRes),
  }

  const formatted = formatOutputByCategory(candidatesByCategory)

  // Cache ลง Firestore
  if (property.id) {
    setCachedNearby(property.id, formatted)
    try {
      const propertyRef = doc(db, 'properties', property.id)
      await updateDoc(propertyRef, {
        nearbyPlaces: formatted,
        nearbyPlacesMeta: {
          travelMode: 'driving',
          maxDistanceKm: MAX_DISTANCE_KM,
          updatedAtMs: Date.now(),
          version: 3,
          source: 'longdo_poi',
        },
      })
    } catch (e) {
      console.warn('[NearbyPlaces] Failed to cache to Firestore:', e)
    }
  }

  return formatted
}
