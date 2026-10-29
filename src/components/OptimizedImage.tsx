import Image, { type ImageProps } from 'next/image';

const OPTIMIZABLE_HOSTS = new Set([
  'images.unsplash.com',
  'picsum.photos',
  'firebasestorage.googleapis.com',
  'sps-property.firebasestorage.app',
]);

function canOptimize(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return true;
  if (src.startsWith('/')) return true;
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

type OptimizedImageProps = Omit<ImageProps, 'alt'> & { alt: string };

/** รักษา layout และ lazy loading แม้รูปภายนอกยังไม่ได้อยู่ใน remotePatterns */
export default function OptimizedImage({ src, alt, unoptimized, ...props }: OptimizedImageProps) {
  return <Image src={src} alt={alt} unoptimized={unoptimized ?? !canOptimize(src)} {...props} />;
}
