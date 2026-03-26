'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Bed, Bath } from 'lucide-react';
import { getCloudinaryThumbUrl, isValidImageUrl } from '@/lib/cloudinary';
import { getPropertyPath } from '@/lib/propertySlug';
import { formatPriceShort } from '@/lib/priceFormat';
import { getPropertyLabel } from '@/constants/propertyTypes';
import type { Property } from '@/lib/firestore';

interface RelatedPropertiesProps {
  currentPropertyId: string;
  district?: string;
  type?: string;
}

export default function RelatedProperties({ currentPropertyId, district, type }: RelatedPropertiesProps) {
  const [related, setRelated] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const seen = new Set([currentPropertyId]);
        let items: Property[] = [];

        // Step 1: Same type + district
        if (district && type) {
          try {
            const q1 = query(
              collection(db, 'properties'),
              where('status', '==', 'available'),
              where('type', '==', type),
              where('location.district', '==', district),
              limit(4)
            );
            const snap1 = await getDocs(q1);
            snap1.forEach((doc) => {
              if (!seen.has(doc.id)) {
                seen.add(doc.id);
                items.push({ id: doc.id, ...doc.data() } as Property);
              }
            });
          } catch (e) {
            console.error('Step 1 error:', e);
          }
        }

        // Step 2: Same type, any district
        if (items.length < 3 && type) {
          try {
            const q2 = query(
              collection(db, 'properties'),
              where('status', '==', 'available'),
              where('type', '==', type),
              limit(10)
            );
            const snap2 = await getDocs(q2);
            snap2.forEach((doc) => {
              if (!seen.has(doc.id) && items.length < 3) {
                seen.add(doc.id);
                items.push({ id: doc.id, ...doc.data() } as Property);
              }
            });
          } catch (e) {
            console.error('Step 2 error:', e);
          }
        }

        // Step 3: Latest properties
        if (items.length < 3) {
          try {
            const q3 = query(
              collection(db, 'properties'),
              where('status', '==', 'available'),
              limit(15)
            );
            const snap3 = await getDocs(q3);
            snap3.forEach((doc) => {
              if (!seen.has(doc.id) && items.length < 3) {
                seen.add(doc.id);
                items.push({ id: doc.id, ...doc.data() } as Property);
              }
            });
          } catch (e) {
            console.error('Step 3 error:', e);
          }
        }

        setRelated(items);
      } catch (error) {
        console.error('Error fetching related properties:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentPropertyId) {
      fetchRelated();
    }
  }, [currentPropertyId, district, type]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-6 w-40 bg-slate-200 rounded-xl mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (related.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">บ้านที่คุณอาจสนใจ</h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {related.map((property) => {
          const loc = typeof property.location === 'object' ? property.location : null;
          const locationStr = loc?.district || property.district || '';
          const isRental = property.isRental || property.listingType === 'rent';
          const typeLabel = getPropertyLabel(property.type || property.propertyType || '');
          const coverImage = property.coverImageUrl || property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400';
          
          return (
            <Link
              key={property.id}
              href={getPropertyPath(property)}
              className="group rounded-xl overflow-hidden border border-slate-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img
                  src={getCloudinaryThumbUrl(coverImage) || coverImage}
                  alt={typeLabel}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                  {formatPriceShort(property.price, isRental)}
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-slate-900 text-sm truncate">{typeLabel}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {locationStr || '—'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  🛏 {property.bedrooms ?? '-'} • 🚿 {property.bathrooms ?? '-'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
