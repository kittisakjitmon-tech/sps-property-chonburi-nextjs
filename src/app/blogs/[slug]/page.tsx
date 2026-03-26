import { getBlogById } from '@/lib/firestore';

export const dynamic = 'force-dynamic';
import { extractIdFromSlug } from '@/lib/blogSlug';
import BlogDetailClient from './BlogDetailClient';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
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
