'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getPropertyById } from '@/lib/firestore';
import { generatePropertySlug } from '@/lib/propertySlug';

interface ShortPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default function ShortPropertyPage({ params }: ShortPropertyPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const p = await getPropertyById(id);
        if (p) {
          setProperty(p);
          // Redirect to SEO-friendly slug
          const slug = generatePropertySlug(p);
          router.replace(`/properties/${slug}`);
        } else {
          router.replace('/properties');
        }
      } catch (error) {
        console.error('Error:', error);
        router.replace('/properties');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return null;
}
