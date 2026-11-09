/**
 * Property map helpers — แปลงข้อมูลทรัพย์ (lat/lng, mapUrl, พื้นที่) เป็น Google Maps embed URL
 *
 * ลำดับความสำคัญของตำแหน่ง:
 *   1. พิกัด lat/lng ที่บันทึกไว้
 *   2. พิกัดที่ดึงได้จากลิงก์ Google Maps (เช่น ?q=lat,lng, @lat,lng, !3d/!4d)
 *   3. ลิงก์ฝัง (embed) ที่ผู้ใช้บันทึกไว้ตรง ๆ
 *   4. แผนที่ระดับพื้นที่ (ตำบล/อำเภอ/จังหวัด)
 *
 * ใช้ได้ทั้งฝั่ง client และ server (ไม่มี dependency ของ browser)
 */
import { extractMapUrl, isShortMapLink, parseCoordinatesFromUrl } from './googleMapsUrl'

export interface MapCoords {
  lat: number
  lng: number
}

export interface PropertyMapLocation {
  subDistrict?: string | null
  district?: string | null
  province?: string | null
  lat?: number | string | null
  lng?: number | string | null
}

export interface PropertyMapInput {
  mapUrl?: string | null
  lat?: number | string | null
  lng?: number | string | null
  location?: PropertyMapLocation | string | null
  district?: string | null
  province?: string | null
}

export type PropertyMapMode = 'exact' | 'area' | 'none'

export interface PropertyMapEmbed {
  /** URL ที่ใช้ใน iframe (null = แสดงแผนที่ไม่ได้) */
  url: string | null
  /** exact = พิกัดจริง, area = ระดับพื้นที่, none = ไม่มีข้อมูล */
  mode: PropertyMapMode
  coords: MapCoords | null
  areaQuery: string | null
  /** ลิงก์ Google Maps แบบย่อ (maps.app.goo.gl / goo.gl/maps) */
  isShortLink: boolean
  /** ลิงก์ภายนอกสำหรับ "เปิดใน Google Maps" */
  externalUrl: string | null
}

const MAP_EMBED_ORIGIN = 'https://maps.google.com/maps'
const EXACT_ZOOM = 16
const AREA_ZOOM = 13
const BROWSER_LIKE_URL = /^https?:\/\//i
// ลิงก์ที่ขึ้นต้นด้วยโดเมน Google Maps แต่ไม่มี scheme (ผู้ใช้วางมาแบบไม่มี https://)
const BARE_MAP_URL = /^(?:www\.)?(?:google\.[a-z.]+|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)(?:[/?#]|$)/i

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** ตรวจสอบว่าพิกัดอยู่ในช่วงที่ Google Maps ยอมรับ */
export function isValidMapCoords(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  // 0,0 คือค่า default ที่แปลว่า "ยังไม่ได้ตั้งพิกัด"
  return !(lat === 0 && lng === 0)
}

/**
 * ทำความสะอาดค่าที่ผู้ใช้กรอกในช่อง mapUrl
 * รองรับ: URL เต็ม, URL ไม่มี scheme, และโค้ด iframe ทั้งก้อน
 */
export function normalizeMapUrl(input: string | null | undefined): string {
  if (typeof input !== 'string') return ''
  const raw = input.trim()
  if (!raw) return ''

  if (/<iframe/i.test(raw)) {
    const { url } = extractMapUrl(raw)
    return url ? normalizeMapUrl(url) : ''
  }

  if (BROWSER_LIKE_URL.test(raw)) return raw
  if (BARE_MAP_URL.test(raw)) return `https://${raw}`
  return ''
}

/** พิกัดของทรัพย์: ใช้ lat/lng ก่อน แล้วค่อยดึงจากลิงก์แผนที่ */
export function getMapCoords(property: PropertyMapInput | null | undefined): MapCoords | null {
  if (!property) return null

  const lat = toFiniteNumber(property.lat)
  const lng = toFiniteNumber(property.lng)
  if (lat != null && lng != null && isValidMapCoords(lat, lng)) return { lat, lng }

  const location = typeof property.location === 'object' && property.location ? property.location : null
  const locationLat = toFiniteNumber(location?.lat)
  const locationLng = toFiniteNumber(location?.lng)
  if (locationLat != null && locationLng != null && isValidMapCoords(locationLat, locationLng)) {
    return { lat: locationLat, lng: locationLng }
  }

  const mapUrl = normalizeMapUrl(property.mapUrl)
  if (!mapUrl) return null

  const fromUrl = parseCoordinatesFromUrl(mapUrl)
  if (fromUrl && isValidMapCoords(fromUrl.lat, fromUrl.lng)) return fromUrl

  return null
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' ')).trim()
  } catch {
    return value.trim()
  }
}

// ข้อความที่เป็นพิกัดล้วน (เช่น 13°27'44.0"N) — ใช้เป็นคำค้นไม่ได้
const COORDINATE_ONLY_TEXT = /^[\d\s.,°'"+NSEW-]+$/i

/** คำค้นจากลิงก์ เช่น ...?q=<ชื่อสถานที่> หรือ .../maps/place/<ชื่อสถานที่>/ */
function getSearchQueryFromMapUrl(mapUrl: string): string | null {
  if (!mapUrl) return null

  const queryMatch = mapUrl.match(/[?&]q=([^&#]+)/)
  if (queryMatch) {
    const decoded = safeDecode(queryMatch[1])
    if (decoded.length >= 3 && !COORDINATE_ONLY_TEXT.test(decoded)) return decoded
  }

  const placeMatch = mapUrl.match(/\/maps\/place\/([^/?#@]+)/)
  if (placeMatch) {
    const decoded = safeDecode(placeMatch[1])
    if (decoded.length >= 3 && !COORDINATE_ONLY_TEXT.test(decoded)) return decoded
  }

  return null
}

/** ข้อความค้นหาพื้นที่ เช่น "มาบโป่ง, พานทอง, ชลบุรี" */
export function getMapAreaQuery(property: PropertyMapInput | null | undefined): string | null {
  if (!property) return null

  // ลิงก์ที่ผู้ใช้บันทึกไว้ (เช่น ?q=<ชื่อสถานที่/ที่อยู่>) แม่นยำกว่าพื้นที่จาก dropdown
  const fromMapUrl = getSearchQueryFromMapUrl(normalizeMapUrl(property.mapUrl))
  if (fromMapUrl) return fromMapUrl

  const location = typeof property.location === 'object' && property.location ? property.location : null

  const candidates = [
    location?.subDistrict,
    location?.district,
    location?.province,
    property.district,
    property.province,
  ]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)

  const unique = candidates.filter((part, index) => candidates.indexOf(part) === index)
  return unique.length > 0 ? unique.join(', ') : null
}

export function buildCoordinateEmbedUrl(coords: MapCoords, zoom = EXACT_ZOOM): string {
  return `${MAP_EMBED_ORIGIN}?q=${coords.lat},${coords.lng}&z=${zoom}&hl=th&output=embed`
}

export function buildAreaEmbedUrl(areaQuery: string, zoom = AREA_ZOOM): string {
  return `${MAP_EMBED_ORIGIN}?q=${encodeURIComponent(areaQuery)}&z=${zoom}&hl=th&output=embed`
}

/** ลิงก์ภายนอกไปยัง Google Maps (ใช้เปิดแท็บใหม่) */
export function getExternalMapUrl(property: PropertyMapInput | null | undefined): string | null {
  if (!property) return null

  const mapUrl = normalizeMapUrl(property.mapUrl)
  // ลิงก์เต็มที่ผู้ใช้บันทึกไว้คือตำแหน่งจริง ใช้เปิดใน Google Maps ได้ตรงที่สุด
  if (mapUrl && !isShortMapLink(mapUrl)) return mapUrl
  // ลิงก์ย่อใช้เปิดได้เช่นกัน (Google จะ redirect เอง)
  if (mapUrl && isShortMapLink(mapUrl)) return mapUrl

  const coords = getMapCoords(property)
  if (coords) return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`

  const areaQuery = getMapAreaQuery(property)
  if (areaQuery) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(areaQuery)}`

  return null
}

/**
 * สร้างข้อมูลแผนที่สำหรับ iframe
 * - มีพิกัด → แผนที่ pinpoint ตำแหน่งจริง
 * - ไม่มีพิกัดแต่มีพื้นที่ → แผนที่ระดับตำบล/อำเภอ
 * - ไม่มีทั้งสองอย่าง → none (ให้ UI แสดงที่อยู่แทน)
 */
export function getPropertyMapEmbed(property: PropertyMapInput | null | undefined): PropertyMapEmbed {
  const empty: PropertyMapEmbed = {
    url: null,
    mode: 'none',
    coords: null,
    areaQuery: null,
    isShortLink: false,
    externalUrl: null,
  }
  if (!property) return empty

  const mapUrl = normalizeMapUrl(property.mapUrl)
  const coords = getMapCoords(property)
  const areaQuery = getMapAreaQuery(property)
  const base = {
    coords,
    areaQuery,
    isShortLink: isShortMapLink(mapUrl),
    externalUrl: getExternalMapUrl(property),
  }

  // 1) เก็บ URL แบบ embed ไว้แล้ว (เช่น https://www.google.com/maps/embed?pb=... หรือ ...output=embed)
  if (mapUrl && (/[/?&]embed(?:[?&/=]|$)/i.test(mapUrl) || /[?&]output=embed/i.test(mapUrl))) {
    return { ...base, url: mapUrl, mode: 'exact' }
  }

  // 2) พิกัดจริง
  if (coords) {
    return { ...base, url: buildCoordinateEmbedUrl(coords), mode: 'exact' }
  }

  // 3) แผนที่ระดับพื้นที่
  if (areaQuery) {
    return { ...base, url: buildAreaEmbedUrl(areaQuery), mode: 'area' }
  }

  return { ...empty, ...base }
}
