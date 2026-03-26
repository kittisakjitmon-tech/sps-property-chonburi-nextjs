'use client';

import Link from 'next/link';
import { MapPin, Bed } from 'lucide-react';
import { formatPriceShort } from '@/lib/priceFormat';
import { getPropertyLabel } from '@/constants/propertyTypes';
import type { Property } from '@/lib/firestore';

interface RecommendedPropertiesSectionProps {
  allProperties: Property[];
  currentFilters?: Record<string, any>;
  vertical?: boolean;
}

export default function RecommendedPropertiesSection({ 
  allProperties, 
  currentFilters = {},
  vertical = false 
}: RecommendedPropertiesSectionProps) {
  // Get featured or latest properties for recommendations
  const recommended = allProperties
    .filter(p => p.featured || p.hotDeal)
    .slice(0, 3);

  // Fallback to latest if no featured
  const displayProperties = recommended.length > 0 
    ? recommended 
    : allProperties.slice(0, 3);

  if (displayProperties.length === 0) return null;

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
      <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
        <span className="text-lg">💡</span>
        คำแนะนำ
      </h3>
      
      <div className={`space-y-3 ${vertical ? '' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}`}>
        {displayProperties.map((property) => {
          const loc = typeof property.location === 'object' ? property.location : null;
          const district = loc?.district || property.district || '';
          const province = loc?.province || property.province || '';
          const isRental = property.isRental || property.listingType === 'rent';
          const typeLabel = getPropertyLabel(property.type || property.propertyType || '');
          const coverImage = property.coverImageUrl || property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200';
          
          return (
            <Link
              key={property.id}
              href={`/properties/${property.slug || property.id}`}
              className="flex gap-3 p-2 rounded-xl bg-white hover:bg-amber-100/50 transition group"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img
                  src={coverImage}
                  alt={typeLabel}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 truncate">{typeLabel}</p>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {formatPriceShort(property.price, isRental)}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {district || province || '—'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
