'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MapPin, Heart, Bed, Bath, Maximize2, Navigation } from 'lucide-react';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { formatPriceShort } from '@/lib/priceFormat';
import { getCloudinaryThumbUrl } from '@/lib/cloudinary';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { generatePropertySlug } from '@/lib/propertySlug';
import { type Property, Timestamp } from '@/lib/firestore';

interface PropertyCardCompactProps {
  property: Property;
  featured?: boolean;
  hotDeal?: boolean;
  isNew?: boolean;
  showTransit?: boolean;
}

function PropertyCardCompact({ 
  property, 
  featured = false, 
  hotDeal = false, 
  isNew = false,
  showTransit = false,
}: PropertyCardCompactProps) {
  const propertyId = property?.id ?? null;
  const [favorited, setFavorited] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && propertyId) {
      setFavorited(isFavorite(propertyId));
    }
  }, [propertyId]);

  if (!propertyId) return null;

  const listingType = property.listingType || (property.isRental ? 'rent' : 'sale');
  const subListingType = property.subListingType;
  const isInstallment = subListingType === 'installment_only' || property.directInstallment;

  const loc = typeof property.location === 'object' ? property.location : null;
  const district = loc
    ? [loc.district, loc.province].filter(Boolean).join(', ')
    : (property.district || property.province || '');
  const subDistrict = loc?.subDistrict || '';

  const typeLabel = getPropertyLabel(property.type || property.propertyType || '') || 'อสังหาริมทรัพย์';
  const titleText = subDistrict ? `${typeLabel} ${subDistrict}` : typeLabel;

  const areaSqWa = property.area != null && Number(property.area) > 0
    ? (Number(property.area) / 4).toFixed(0)
    : null;

  // Calculate monthly payment (for installment)
  const installmentPerMonth =
    isInstallment && property.price != null && Number(property.price) > 0
      ? Math.round(Number(property.price) / 120)
      : null;

  // Mock transit distance (in real app, this would come from property data)
  const transitDistance = showTransit && Math.random() > 0.5 
    ? `${Math.floor(Math.random() * 500 + 100)}m` 
    : null;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && propertyId) {
      setFavorited(toggleFavorite(propertyId));
    }
  };

  const propertyPath = generatePropertySlug(property)
    ? `/properties/${generatePropertySlug(property)}`
    : `/properties/${property.id}`;

  const coverImage = property.coverImageUrl || property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400';

  // Badge logic
  const badgeColor = isInstallment 
    ? 'bg-emerald-500' 
    : listingType === 'rent' 
      ? 'bg-orange-500' 
      : 'bg-blue-600';

  const badgeLabel = isInstallment 
    ? 'ผ่อนตรง' 
    : listingType === 'rent' 
      ? 'เช่า' 
      : 'ขาย';

  // Featured card size
  const isFeaturedSize = featured || hotDeal;

  return (
    <article
      className={`group flex flex-col h-full w-full bg-white overflow-hidden rounded-xl transition-all duration-300 ${
        isFeaturedSize 
          ? 'shadow-md hover:shadow-lg hover:-translate-y-0.5' 
          : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
      } ${hotDeal ? 'ring-2 ring-amber-400' : ''}`}
    >
      {/* Image Section */}
      <Link 
        href={propertyPath} 
        className={`block relative overflow-hidden bg-slate-100 shrink-0 ${
          isFeaturedSize ? 'aspect-[4/3]' : 'aspect-[4/3]'
        }`}
      >
        <img
          src={getCloudinaryThumbUrl(coverImage) || coverImage}
          alt={titleText}
          width={400}
          height={300}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 70%)',
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
          <span className={`inline-flex items-center py-0.5 px-2 text-[10px] font-bold text-white rounded-md shadow-sm ${badgeColor}`}>
            {badgeLabel}
          </span>
          {isNew && (
            <span className="inline-flex items-center py-0.5 px-2 text-[10px] font-bold text-white rounded-md shadow-sm bg-cyan-500">
              🏠 ใหม่
            </span>
          )}
          {hotDeal && (
            <span className="inline-flex items-center py-0.5 px-2 text-[10px] font-bold text-white rounded-md shadow-sm bg-amber-500">
              🔥 ดีลร้อน
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md active:scale-90 transition-all duration-200"
          aria-label={favorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${favorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} 
          />
        </button>

        {/* Price Overlay - Prominent */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-2">
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold text-lg leading-tight drop-shadow-md">
              {formatPriceShort(property.price, listingType === 'rent', property.showPrice !== false)}
            </span>
          </div>
          {installmentPerMonth != null && (
            <div className="text-white/90 text-[11px] mt-0.5">
              ≈ ฿{installmentPerMonth.toLocaleString('th-TH')}/ด.
            </div>
          )}
        </div>
      </Link>

      {/* Content Section - Compact */}
      <div className="flex flex-col flex-1 min-w-0 p-2.5">
        {/* Title */}
        <Link href={propertyPath} className="block mb-1">
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors text-[13px]">
            {titleText}
          </h3>
        </Link>

        {/* Location with Transit */}
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-2">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{district || '—'}</span>
          {transitDistance && (
            <span className="flex items-center gap-0.5 text-emerald-600 shrink-0">
              <Navigation className="w-2.5 h-2.5" />
              {transitDistance}
            </span>
          )}
        </div>

        {/* Specs Row - Compact */}
        <div className="flex items-center gap-2.5 text-slate-600 text-[11px] mb-2">
          <div className="flex items-center gap-1">
            <Bed className="w-3 h-3 text-slate-400" />
            <span>{property.bedrooms ?? '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3 h-3 text-slate-400" />
            <span>{property.bathrooms ?? '-'}</span>
          </div>
          {areaSqWa != null && (
            <div className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-slate-400" />
              <span>{areaSqWa}</span>
            </div>
          )}
        </div>

        {/* Availability Badge */}
        <div className="flex items-center gap-2 mb-2">
          {property.availability === 'available' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ว่าง
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              ติดจอง
            </span>
          )}
        </div>

        {/* CTA Button - Compact */}
        <Link
          href={propertyPath}
          className="mt-auto inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] hover:bg-blue-100 active:scale-[0.98] transition-all duration-200 py-2 px-3"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}

export default memo(PropertyCardCompact);
