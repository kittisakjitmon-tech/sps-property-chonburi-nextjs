import { MetadataRoute } from 'next';
import { getPropertiesOnce, getBlogsOnce } from '@/lib/firestore';

const BASE_URL = 'https://spspropertysolution.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/loan-services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Helper to convert Firestore Timestamp or Date to Date
  const toDate = (value: any): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return new Date();
  };

  // Fetch dynamic pages
  let propertyPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  try {
    const properties = await getPropertiesOnce(false);
    propertyPages = properties
      .filter((p) => p.id)
      .map((property) => {
        const slug = property.slug || property.id;
        const url = `${BASE_URL}/properties/${slug}--${property.id}`;
        return {
          url,
          lastModified: toDate(property.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });
  } catch (error) {
    console.error('Error fetching properties for sitemap:', error);
  }

  try {
    const blogs = await getBlogsOnce(100);
    blogPages = blogs
      .filter((b) => b.id)
      .map((blog) => {
        const slug = blog.slug || blog.id;
        const url = `${BASE_URL}/blogs/${slug}--${blog.id}`;
        return {
          url,
          lastModified: toDate(blog.updatedAt),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        };
      });
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  return [...staticPages, ...propertyPages, ...blogPages];
}
