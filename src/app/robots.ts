import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/admin/', '/private/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://spspropertysolution.com'}/sitemap.xml`,
  };
}
