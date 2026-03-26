import { getBlogById } from '@/lib/firestore';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { extractIdFromSlug } from '@/lib/blogSlug';
import BlogDetailClient from './BlogDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sps-property-nextjs.vercel.app';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blogId = extractIdFromSlug(slug);
  
  if (!blogId) {
    return { title: 'ไม่พบบทความ' };
  }
  
  try {
    const blog = await getBlogById(blogId);
    
    if (!blog) {
      return { title: 'ไม่พบบทความ' };
    }
    
    const ogImage = blog.images?.[0] || `${BASE_URL}/logo.png`;
    const title = blog.title || 'บทความ';
    const description = blog.content?.replace(/<[^>]*>/g, '').slice(0, 160) || title;
    
    return {
      title: `${title} | SPS Blog`,
      description,
      openGraph: {
        title: `${title} | SPS Blog`,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | SPS Blog`,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'บทความ | SPS Blog' };
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  
  let blog = null;
  let loading = true;
  let notFound = false;
  
  try {
    // Extract actual Firestore ID from slug (format: {slug}--{id})
    const blogId = extractIdFromSlug(slug);
    
    if (!blogId) {
      notFound = true;
    } else {
      blog = await getBlogById(blogId);
      
      if (!blog) {
        notFound = true;
      }
    }
  } catch (error) {
    console.error('Error fetching blog:', error);
    notFound = true;
  } finally {
    loading = false;
  }
  
  // Pass data to client component
  return <BlogDetailClient blog={blog} loading={loading} notFound={notFound} />;
}
