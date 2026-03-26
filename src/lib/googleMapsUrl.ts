/**
 * Google Maps URL utilities - ดึงและแปลง URL สำหรับแผนที่
 */

/** แบบแผน URL Google Maps ที่ใช้ดึง URL แรกจากข้อความ */
const MAP_URL_PATTERN = /https?:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl)[^\s"'<>]*/i

/**
 * ดึง URL ออกจาก input (รองรับลิงก์ธรรมดา และโค้ด iframe)
 */
export function extractMapUrl(input: string | null | undefined): { url: string | null; isEmbed: boolean } {
  if (!input || typeof input !== 'string') return { url: null, isEmbed: false }
  const s = input.trim()
  if (!s) return { url: null, isEmbed: false }

  const iframeMatch = s.match(/<iframe[^>]+src\s*=\s*["']([^"']+)["']/i)
  if (iframeMatch) {
    const src = iframeMatch[1].trim()
    if (src && (src.includes('google.com') || src.includes('maps.google'))) {
      return { url: deduplicateUrl(src), isEmbed: src.includes('/embed') }
    }
  }

  const urlMatch = s.match(MAP_URL_PATTERN)
  if (urlMatch) {
    const url = deduplicateUrl(urlMatch[0])
    return { url, isEmbed: url.includes('/embed') }
  }

  return { url: null, isEmbed: false }
}

function deduplicateUrl(url: string): string {
  if (!url || url.length < 20) return url
  const half = Math.floor(url.length / 2)
  if (url.slice(0, half) === url.slice(half)) return url.slice(0, half)
  return url
}

export function toEmbedUrl(url: string | null): string | null {
  if (!url || typeof url !== 'string') return null
  const s = url.trim()
  if (!s) return null

  try {
    if (s.includes('/embed')) return s

    if (s.includes('google.com/maps') || s.includes('maps.google')) {
      let query = ''
      
      const coordMatch = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
      if (coordMatch) {
        query = `${coordMatch[1]},${coordMatch[2]}`
      } else {
        const placeMatch = s.match(/place\/([^/?#]+)/)
        if (placeMatch) {
          query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
        } else {
          const searchMatch = s.match(/[?&]q=([^&]+)/)
          if (searchMatch) {
            query = decodeURIComponent(searchMatch[1])
          } else {
            const pathSearchMatch = s.match(/\/search\/([^/?#]+)/)
            if (pathSearchMatch) {
              query = decodeURIComponent(pathSearchMatch[1].replace(/\+/g, ' '))
            }
          }
        }
      }

      if (query) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
      }

      return null
    }

    if (s.includes('goo.gl/maps') || s.includes('maps.app.goo.gl')) {
      return null
    }

    return null
  } catch {
    return null
  }
}

export function isShortMapLink(url: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  return url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')
}

export function parseCoordinatesFromUrl(url: string | null): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') return null
  const s = url.trim()
  try {
    const qMatch = s.match(/[?&]q=([^&]+)/)
    if (qMatch) {
      const q = decodeURIComponent(qMatch[1])
      const coords = q.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/) || q.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
      if (coords) {
        const lat = parseFloat(coords[1])
        const lng = parseFloat(coords[2])
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
      }
    }
    const atMatch = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) {
      const lat = parseFloat(atMatch[1])
      const lng = parseFloat(atMatch[2])
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
    }
    const d3 = s.match(/!3d(-?\d+\.?\d*)/)
    const d4 = s.match(/!4d(-?\d+\.?\d*)/)
    const d2 = s.match(/!2d(-?\d+\.?\d*)/)
    if (d3) {
      const lat = parseFloat(d3[1])
      const lngMatch = d4 || d2
      const lng = lngMatch ? parseFloat(lngMatch[1]) : null
      if (!Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) return { lat, lng }
    }
  } catch (_) {}
  return null
}
