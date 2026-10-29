import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogById } from '@/lib/firestore';

export const dynamic = 'force-dynamic';
import { extractIdFromSlug, getBlogPath } from '@/lib/blogSlug';
import { SITE_URL, absoluteUrl } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import BlogDetailClient from './BlogDetailClient';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

const getBlog = cache(async (id: string) => getBlogById(id));

function toIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blogId = extractIdFromSlug(slug);
  const blog = blogId ? await getBlog(blogId) : null;

  if (!blog) {
    return { title: 'ไม่พบบทความ', robots: { index: false, follow: true } };
  }

  const title = blog.title || 'บทความ';
  const description = blog.content?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 155) || title;
  const canonicalPath = getBlogPath(blog);
  const ogImage = blog.images?.[0] || '/logo.png';
  const publishedTime = toIsoDate(blog.createdAt);
  const modifiedTime = toIsoDate(blog.updatedAt);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: blog.published === true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'article',
      publishedTime,
      modifiedTime,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const blogId = extractIdFromSlug(slug);
  const blog = blogId ? await getBlog(blogId) : null;
  if (!blog) notFound();

  const canonicalPath = getBlogPath(blog);
  if (decodeURIComponent(slug) !== canonicalPath.split('/').pop()) permanentRedirect(encodeURI(canonicalPath));

  const description = blog.content?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300) || blog.title;
  const publishedTime = toIsoDate(blog.createdAt);
  const modifiedTime = toIsoDate(blog.updatedAt);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: blog.title,
        description,
        image: blog.images || [],
        mainEntityOfPage: absoluteUrl(canonicalPath),
        ...(publishedTime ? { datePublished: publishedTime } : {}),
        ...(modifiedTime ? { dateModified: modifiedTime } : {}),
        author: blog.authorName ? { '@type': 'Person', name: blog.authorName } : { '@id': `${SITE_URL}/#business` },
        publisher: { '@id': `${SITE_URL}/#business` },
        inLanguage: 'th',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'บทความ', item: absoluteUrl('/blogs') },
          { '@type': 'ListItem', position: 3, name: blog.title, item: absoluteUrl(canonicalPath) },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <BlogDetailClient blog={blog} />
    </>
  );
}
