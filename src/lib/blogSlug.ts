/**
 * Blog Slug utilities for SEO-friendly URLs
 */

function sanitizeBlogSlugPart(str: string): string {
  return String(str)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\-]/g, '');
}

interface Blog {
  id: string;
  title?: string;
}

/**
 * Build a URL-safe slug from blog data.
 * Format: {title-slug}--{id}
 * Example: วิธีเลือกซื้อบ้าน--xyz789
 */
export function generateBlogSlug(blog: Blog): string {
  if (!blog?.id) return '';
  const titlePart = blog.title
    ? sanitizeBlogSlugPart(blog.title).replace(/-+/g, '-') || `blog-${blog.id}`
    : `blog-${blog.id}`;
  return `${titlePart}--${blog.id}`;
}

/** Full path for a blog detail page */
export function getBlogPath(blog: Blog): string {
  if (!blog?.id) return '/blogs';
  return `/blogs/${generateBlogSlug(blog)}`;
}

/** Short path for sharing blog via link (just ID) */
export function getShortBlogPath(blog: Blog): string {
  if (!blog?.id) return '/blogs';
  return `/b/${blog.id}`;
}

/** Extract Firestore document ID from slug param (backward-compatible) */
export function extractIdFromSlug(slugParam: string | null | undefined): string | null {
  if (!slugParam) return null;
  const slug = String(slugParam).trim();
  const sep = slug.lastIndexOf('--');
  return sep !== -1 ? slug.substring(sep + 2) : slug;
}
