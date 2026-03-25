'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBlogsOnce } from '@/lib/firestore';
import type { Blog } from '@/lib/firestore';

const ITEMS_PER_PAGE = 9;

function BlogCard({ blog }: { blog: Blog }) {
  // Handle Firebase Timestamp or Date
  const dateValue = blog.createdAt;
  let formattedDate = '';
  
  if (dateValue) {
    try {
      const date = typeof dateValue === 'object' && 'toDate' in dateValue
        ? (dateValue as any).toDate()
        : new Date(dateValue as string | number);
      formattedDate = date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      formattedDate = '';
    }
  }

  const excerpt = blog.content?.substring(0, 150) || '';
  const displayExcerpt = excerpt.length >= 150 ? `${excerpt}...` : excerpt;

  // Handle cover image (try multiple fields)
  const coverImage = (blog as any).coverImage || (blog as any).imageUrl || 
    (blog.images && blog.images[0]) || 
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600';

  return (
    <Link
      href={`/blogs/${blog.slug || blog.id}`}
      className="group flex flex-col bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-video relative w-full overflow-hidden">
        <img
          src={coverImage}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-900 transition-colors">
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 line-clamp-3 flex-1">
          {displayExcerpt}
        </p>

        {/* Date Footer */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {getPageNumbers()[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-10 h-10 rounded-xl hover:bg-gray-100"
            >
              1
            </button>
            {getPageNumbers()[0] > 2 && <span className="text-gray-300">...</span>}
          </>
        )}

        {getPageNumbers().map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
              currentPage === n
                ? 'bg-blue-900 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {n}
          </button>
        ))}

        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
              <span className="text-gray-300">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-10 h-10 rounded-xl hover:bg-gray-100"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="text-xs text-gray-400 font-medium">
        หน้าที่ {currentPage} จาก {totalPages}
      </p>
    </div>
  );
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await getBlogsOnce(20);
        setBlogs(data);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const totalPages = Math.max(1, Math.ceil(blogs.length / ITEMS_PER_PAGE));
  
  const paginatedBlogs = blogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center py-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            SPS Property Solution
          </h1>
          <p className="text-xl text-white/80">
            บ้านคอนโดสวย อมตะซิตี้ ชลบุรี
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">บทความทั้งหมด</h2>
            <p className="text-gray-500 mt-2">
              อ่านบทความที่น่าสนใจเกี่ยวกับอสังหาริมทรัพย์
            </p>
          </div>

          {/* Blog Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="aspect-video bg-gray-200 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
                    <div className="pt-3 border-t border-gray-100">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedBlogs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gray-100 items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">ยังไม่มีบทความ</h3>
              <p className="text-gray-500">ขออภัย ขณะนี้ยังไม่มีบทความในหมวดนี้</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
