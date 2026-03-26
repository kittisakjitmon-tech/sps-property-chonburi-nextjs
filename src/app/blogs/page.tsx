import { getBlogsOnce, type Blog } from '@/lib/firestore';
import BlogsClient from './BlogsClient';

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
  
  return <BlogsClient blogs={blogs} loading={loading} />;
}
