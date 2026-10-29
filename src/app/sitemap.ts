import { MetadataRoute } from 'next';
import { getPropertiesOnce, getBlogsOnce } from '@/lib/firestore';
import { getPropertyPath } from '@/lib/propertySlug';
import { getBlogPath } from '@/lib/blogSlug';
import { SITE_URL, absoluteUrl } from '@/lib/site';

function toDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

// Next.js currently writes image URLs without escaping XML entities.
function sitemapImages(images: (string | undefined)[]): string[] {
  return [...new Set(images.filter((image): image is string => Boolean(image)))]
    .map((image) => image.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/properties'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/blogs'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/portfolio'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/post'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/contact'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/loan-services'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  let propertyPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  try {
    const properties = await getPropertiesOnce(false);
    propertyPages = properties
      .filter((property) => property.id)
      .map((property) => ({
        url: absoluteUrl(getPropertyPath(property)),
        lastModified: toDate(property.updatedAt || property.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: sitemapImages([property.coverImageUrl, ...(property.images || [])]),
      }));
  } catch (error) {
    console.error('Error fetching properties for sitemap:', error);
  }

  try {
    const blogs = await getBlogsOnce(100);
    blogPages = blogs
      .filter((blog) => blog.id)
      .map((blog) => ({
        url: absoluteUrl(getBlogPath(blog)),
        lastModified: toDate(blog.updatedAt || blog.createdAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        images: sitemapImages(blog.images || []),
      }));
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  return [...staticPages, ...propertyPages, ...blogPages];
}
