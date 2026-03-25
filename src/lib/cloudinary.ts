/**
 * Cloudinary CDN helpers — สร้าง URL สำหรับแสดงรูปด้วย resize/format ฝั่ง CDN
 * ใช้กับรูปที่อัปโหลดผ่าน Cloudinary (res.cloudinary.com)
 * 
 * SSR-safe: All functions work on both server and client
 */

interface CloudinaryParsedPath {
  transform: string;
  publicId: string;
}

interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
}

// Get cloud name from environment variables
function getCloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
}

function getCdnBase(): string {
  const name = getCloudName();
  return name ? `https://res.cloudinary.com/${name}/image/upload` : '';
}

function getFetchBase(): string {
  const name = getCloudName();
  return name ? `https://res.cloudinary.com/${name}/image/fetch/` : '';
}

/**
 * ตรวจว่าเป็น URL ของ Cloudinary หรือไม่
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com') && url.includes('/image/upload');
}

/**
 * ตรวจว่าเป็น URL ของ Firebase Storage หรือไม่
 */
export function isFirebaseStorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('firebasestorage.app') ||
         url.includes('appspot.com');
}

/**
 * ตรวจว่าเป็น URL รูปที่ใช้ได้ (ไม่พัง/ไม่มีช่องว่าง)
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 20 || trimmed.includes(' ')) return false;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const isFirebaseStorage = trimmed.includes('firebasestorage.googleapis.com');
    const validFirebaseBucket = trimmed.includes('appspot.com') || trimmed.includes('firebasestorage.app');
    if (isFirebaseStorage && !validFirebaseBucket) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * แยก path หลัง /image/upload/ เป็น [transforms, publicId]
 */
function parseCloudinaryPath(fullUrl: string): CloudinaryParsedPath | null {
  if (!isCloudinaryUrl(fullUrl)) return null;
  try {
    const u = new URL(fullUrl);
    const match = u.pathname.match(/\/image\/upload\/(.+)/);
    if (!match) return null;
    const afterUpload = match[1];
    const parts = afterUpload.split('/');
    if (parts.length >= 2) {
      const publicId = parts.slice(1).join('/');
      return { transform: parts[0], publicId };
    }
    return { transform: '', publicId: afterUpload };
  } catch {
    return null;
  }
}

/**
 * สร้าง Cloudinary URL สำหรับแสดงรูป พร้อม resize/format ฝ่าน CDN
 */
export function getCloudinaryImageUrl(url: string, options: CloudinaryOptions = {}): string {
  if (!url || typeof url !== 'string') return url;
  if (!isCloudinaryUrl(url)) return url;

  const CDN_BASE = getCdnBase();
  if (!CDN_BASE) return url;

  const parsed = parseCloudinaryPath(url);
  if (!parsed) return url;

  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;
  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if ((width || height) && crop) transforms.push(`c_${crop}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);

  const transformStr = transforms.join(',');
  const newPath = transformStr ? `${transformStr}/${parsed.publicId}` : `${parsed.transform}/${parsed.publicId}`;

  return `${CDN_BASE}/${newPath}`;
}

/**
 * รูปที่เก็บใน Cloudinary จะได้ resize + WebP
 * รูปที่เก็บใน Firebase Storage จะใช้ URL เดิม
 * รูปที่เก็บที่อื่น จะถูกดึงผ่าน Cloudinary fetch → WebP + resize
 */
export function getOptimizedImageUrl(url: string, options: CloudinaryOptions = {}): string {
  if (!url || typeof url !== 'string') return url;
  
  // Cloudinary: ใช้ transformations
  if (isCloudinaryUrl(url)) {
    return getCloudinaryImageUrl(url, { ...options, format: 'webp', quality: options.quality ?? 'auto' });
  }

  // Firebase Storage: คืน URL เดิม
  if (isFirebaseStorageUrl(url)) {
    return url;
  }

  // URL อื่นๆ: พยายามใช้ Cloudinary fetch
  const FETCH_BASE = getFetchBase();
  if (!FETCH_BASE) return url;

  const { width, height, crop = 'fill', quality = 'auto' } = options;
  const parts: string[] = ['f_webp', `q_${quality}`];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if ((width || height) && crop) parts.push(`c_${crop}`);
  const transformStr = parts.join(',');
  return `${FETCH_BASE}${transformStr}/${encodeURIComponent(url)}`;
}

/**
 * URL รูป thumbnail สำหรับ card/list — WebP, ขนาดพอดีช่อง 4:3
 */
export function getCloudinaryThumbUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: 400, height: 300, crop: 'fill' });
}

/**
 * URL รูปขนาดกลาง สำหรับ slider/detail — WebP
 */
export function getCloudinaryMediumUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: 800, height: 450, crop: 'fill' });
}

/**
 * URL รูปขนาดใหญ่ สำหรับหน้า detail gallery — WebP
 */
export function getCloudinaryLargeUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: 1200, height: 675, crop: 'fill' });
}
