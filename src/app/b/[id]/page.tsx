import { notFound, permanentRedirect } from 'next/navigation';
import { getBlogById } from '@/lib/firestore';
import { getBlogPath } from '@/lib/blogSlug';

export const dynamic = 'force-dynamic';

interface ShortBlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShortBlogPage({ params }: ShortBlogPageProps) {
  const { id } = await params;
  const blog = await getBlogById(id);
  if (!blog) notFound();
  permanentRedirect(encodeURI(getBlogPath(blog)));
}
