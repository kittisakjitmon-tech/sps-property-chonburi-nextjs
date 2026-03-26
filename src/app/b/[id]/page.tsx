'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getBlogById } from '@/lib/firestore';
import { generateBlogSlug } from '@/lib/blogSlug';

interface ShortBlogPageProps {
  params: Promise<{ id: string }>;
}

export default function ShortBlogPage({ params }: ShortBlogPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const blog = await getBlogById(id);
        if (blog) {
          const slug = generateBlogSlug(blog);
          router.replace(`/blogs/${slug}`);
        } else {
          router.replace('/blogs');
        }
      } catch (error) {
        console.error('Error:', error);
        router.replace('/blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return null;
}
