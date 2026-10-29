import type { Metadata } from 'next';
import { getBlogsOnce, type Blog } from '@/lib/firestore';

export const dynamic = 'force-dynamic';
import { getBlogPath } from '@/lib/blogSlug';
import { absoluteUrl } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import BlogsClient from './BlogsClient';

export const metadata: Metadata = {
  title: 'บทความซื้อบ้าน สินเชื่อ และทำเลชลบุรี',
  description: 'คู่มือซื้อบ้าน คอนโด สินเชื่อ และข้อมูลทำเลอมตะซิตี้ ชลบุรี จากประสบการณ์ทีม SPS Property Solution',
  alternates: { canonical: '/blogs' },
  openGraph: { title: 'บทความซื้อบ้าน สินเชื่อ และทำเลชลบุรี', url: '/blogs', type: 'website' },
};

export default async function BlogsPage() {
  let blogs: Blog[] = [];
  let loading = true;

  try {
    blogs = await getBlogsOnce(20);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    blogs = [];
  } finally {
    loading = false;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'บทความอสังหาริมทรัพย์ SPS Property Solution',
    url: absoluteUrl('/blogs'),
    inLanguage: 'th',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: blogs.length,
      itemListElement: blogs.map((blog, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(getBlogPath(blog)),
        name: blog.title,
      })),
    },
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <BlogsClient blogs={blogs} loading={loading} />
    </>
  );
}
