import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/admin/', '/private/'],
    },
    sitemap: 'https://spspropertysolution.com/sitemap.xml',
  };
}
