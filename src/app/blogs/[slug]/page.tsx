'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';
import { getBlogBySlug } from '@/lib/firestore';
import { getCloudinaryLargeUrl, getCloudinaryMediumUrl, isValidImageUrl } from '@/lib/cloudinary';
import { extractIdFromSlug, generateBlogSlug } from '@/lib/blogSlug';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  try {
    const date = typeof timestamp === 'object' && 'toDate' in timestamp
      ? (timestamp as any).toDate()
      : new Date(timestamp as string | number);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = use(params);
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadBlog = async () => {
      if (!slug) {
        setLoading(false);
        setNotFound(true);
        return;
      }

      try {
        const blogId = extractIdFromSlug(slug);
        if (!blogId) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const blogData = await getBlogBySlug(blogId);
        
        if (!blogData) {
          setNotFound(true);
        } else {
          setBlog(blogData);
        }
      } catch (error) {
        console.error('Error loading blog:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">ไม่พบบทความ</h1>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-blue-900 hover:underline"
            >
              <ArrowLeft className="h-5 w-5" />
              กลับไปหน้าบทความทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cover image
  const rawCover = blog.images?.[0];
  const coverImage = rawCover && isValidImageUrl(rawCover) ? rawCover : null;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(blog.youtubeUrl);

  // Extra images (skip first one as it's the cover)
  const extraImages = blog.images?.slice(1)?.filter(isValidImageUrl) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-900 mb-6 transition"
        >
          <ArrowLeft className="h-5 w-5" />
          กลับไปหน้าบทความทั้งหมด
        </Link>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          {blog.title}
        </h1>

        {/* Date */}
        <div className="flex items-center gap-2 text-slate-500 mb-8">
          <Calendar className="h-5 w-5" />
          <span>{formatDate(blog.createdAt)}</span>
          {blog.authorName && (
            <>
              <span className="text-slate-300">•</span>
              <span>{blog.authorName}</span>
            </>
          )}
        </div>

        {/* Cover Image */}
        {coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={getCloudinaryLargeUrl(coverImage) || coverImage}
              alt={blog.title}
              className="w-full h-auto object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {/* YouTube Video */}
        {youtubeEmbedUrl && (
          <div className="mb-8 aspect-video rounded-lg overflow-hidden">
            <iframe
              src={youtubeEmbedUrl}
              title={blog.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Content */}
        <div className="mb-8">
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg">
            {blog.content}
          </div>
        </div>

        {/* Image Gallery */}
        {extraImages.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">รูปภาพเพิ่มเติม</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extraImages.map((imageUrl: string, index: number) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <img
                    src={getCloudinaryMediumUrl(imageUrl) || imageUrl}
                    alt={`${blog.title} - รูปภาพ ${index + 2}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blogs */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-blue-900 hover:underline font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            กลับไปหน้าบทความทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  );
}
