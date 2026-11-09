/**
 * Server-side map link resolver
 *
 * ลิงก์ย่อ Google Maps (maps.app.goo.gl / goo.gl/maps) ฝังใน iframe ไม่ได้
 * ไฟล์นี้จะตาม redirect ฝั่ง server เพื่อดึง URL เต็มที่มีพิกัด แล้วค่อยให้ client สร้างแผนที่
 *
 * ใช้เฉพาะใน Server Component / Route Handler เท่านั้น
 */
import { isShortMapLink, parseCoordinatesFromUrl } from './googleMapsUrl'
import { normalizeMapUrl } from './propertyMap'

const RESOLVE_TIMEOUT_MS = 2500
const MAX_REDIRECTS = 4
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
// Google Maps คืน 302 พร้อมพิกัดให้ user-agent มือถือ/ไคลเอนต์ทั่วไป แต่คืนหน้า interstitial (200) ให้ Chrome desktop
// จึงต้องใช้ UA มือถือก่อน แล้วค่อยลองแบบไม่มี UA เป็น fallback
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const USER_AGENTS: (string | null)[] = [MOBILE_USER_AGENT, null]

const resolvedCache = new Map<string, { url: string | null; expiresAt: number }>()

/** อนุญาตเฉพาะโดเมน Google Maps เพื่อกัน SSRF ไปยัง host อื่น */
function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'goo.gl' || host.endsWith('.goo.gl')) return true
  return /(^|\.)google\.[a-z.]+$/.test(host)
}

function hasCoordinates(url: string): boolean {
  const coords = parseCoordinatesFromUrl(url)
  return !!coords
}

async function followShortLink(shortUrl: string, userAgent: string | null): Promise<string | null> {
  let currentUrl = shortUrl
  const headers: Record<string, string> = {
    accept: 'text/html,application/xhtml+xml',
    'accept-language': 'th,en;q=0.8',
  }
  if (userAgent) headers['user-agent'] = userAgent

  for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
    let parsed: URL
    try {
      parsed = new URL(currentUrl)
    } catch {
      return null
    }
    if (parsed.protocol !== 'https:' || !isAllowedHost(parsed.hostname)) return null

    // ถึง URL ที่มีพิกัดแล้ว ไม่ต้องตามต่อ
    if (hop > 0 && hasCoordinates(currentUrl)) return currentUrl

    let response: Response
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store',
        headers,
        signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
      })
    } catch {
      return null
    }

    // ไม่ต้องใช้ body แต่ต้องปล่อย connection คืน pool
    response.body?.cancel().catch(() => {})

    const location = response.headers.get('location')
    if (!location) {
      return hasCoordinates(currentUrl) ? currentUrl : null
    }

    try {
      currentUrl = new URL(location, currentUrl).toString()
    } catch {
      return null
    }
  }

  return hasCoordinates(currentUrl) ? currentUrl : null
}

/**
 * แปลงลิงก์ย่อให้เป็น URL เต็มที่มีพิกัด (คืน null ถ้าแปลงไม่ได้)
 * ผลลัพธ์ถูก cache ในหน่วยความจำ 24 ชั่วโมง เพื่อไม่ให้ทุก request ต้องเรียก Google
 */
export async function resolveShortMapUrl(input: string | null | undefined): Promise<string | null> {
  const mapUrl = normalizeMapUrl(input)
  if (!mapUrl || !isShortMapLink(mapUrl)) return null

  const cached = resolvedCache.get(mapUrl)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  let resolved: string | null = null
  for (const userAgent of USER_AGENTS) {
    try {
      resolved = await followShortLink(mapUrl, userAgent)
    } catch {
      resolved = null
    }
    if (resolved) break
  }

  resolvedCache.set(mapUrl, { url: resolved, expiresAt: Date.now() + CACHE_TTL_MS })
  return resolved
}

/**
 * คืน property ที่มี mapUrl เป็นลิงก์เต็ม (ถ้าเดิมเป็นลิงก์ย่อและแปลงสำเร็จ)
 * ใช้ใน Server Component ก่อนส่งข้อมูลให้ client
 */
export async function withResolvedMapUrl<T extends { mapUrl?: string | null }>(property: T): Promise<T> {
  const mapUrl = normalizeMapUrl(property.mapUrl)
  if (!mapUrl || !isShortMapLink(mapUrl)) return property

  try {
    const resolved = await resolveShortMapUrl(mapUrl)
    return resolved ? { ...property, mapUrl: resolved } : property
  } catch {
    return property
  }
}
