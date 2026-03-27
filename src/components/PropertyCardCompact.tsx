'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MapPin, Heart, Bed, Bath, Maximize2, Navigation, Loader2 } from 'lucide-react';
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
  loading?: boolean;
}

// Skeleton Loading Component
function PropertyCardSkeleton() {
  return (
    <article className="flex flex-col h-full w-full bg-white overflow-hidden rounded-xl shadow-sm">
      <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
      <div className="flex flex-col flex-1 min-w-0 p-3 space-y-2">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-3 bg-slate-100 rounded animate-pulse w-10" />
          <div className="h-3 bg-slate-100 rounded animate-pulse w-10" />
          <div className="h-3 bg-slate-100 rounded animate-pulse w-12" />
        </div>
        <div className="h-9 bg-slate-100 rounded-lg animate-pulse w-full mt-auto" />
      </div>
    </article>
  );
}

function PropertyCardCompact({ 
  property, 
  featured = false, 
  hotDeal = false, 
  isNew = false,
  showTransit = false,
  loading = false,
}: PropertyCardCompactProps) {
  // Show skeleton if loading
  if (loading || !property) {
    return <PropertyCardSkeleton />;
  }

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
          ? 'shadow-md hover:shadow-xl hover:-translate-y-1' 
          : 'shadow-sm hover:shadow-lg hover:-translate-y-1'
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
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)',
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className={`inline-flex items-center py-1 px-2.5 text-[10px] font-bold text-white rounded-md shadow-lg ${badgeColor}`}>
            {badgeLabel}
          </span>
          {isNew && (
            <span className="inline-flex items-center py-1 px-2.5 text-[10px] font-bold text-white rounded-md shadow-lg bg-cyan-500">
              🏠 ใหม่
            </span>
          )}
          {hotDeal && (
            <span className="inline-flex items-center py-1 px-2.5 text-[10px] font-bold text-white rounded-md shadow-lg bg-amber-500">
              🔥 ดีลร้อน
            </span>
          )}
        </div>

        {/* Favorite Button - Larger Touch Target */}
        <button
          onClick={handleFavorite}
          className="absolute top-2.5 right-2.5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label={favorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${favorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} 
          />
        </button>

        {/* Price Overlay - Prominent & Larger */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold text-xl sm:text-2xl leading-tight drop-shadow-lg">
              {formatPriceShort(property.price, listingType === 'rent', property.showPrice !== false)}
            </span>
          </div>
          {installmentPerMonth != null && (
            <div className="text-white/95 text-xs mt-0.5 font-medium">
              ≈ ฿{installmentPerMonth.toLocaleString('th-TH')}/ด.
            </div>
          )}
        </div>
      </Link>

      {/* Content Section - Compact */}
      <div className="flex flex-col flex-1 min-w-0 p-3">
        {/* Title */}
        <Link href={propertyPath} className="block mb-1.5">
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors text-sm">
            {titleText}
          </h3>
        </Link>

        {/* Location with Transit */}
        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{district || '—'}</span>
          {transitDistance && (
            <span className="flex items-center gap-0.5 text-emerald-600 shrink-0 font-medium">
              <Navigation className="w-3 h-3" />
              {transitDistance}
            </span>
          )}
        </div>

        {/* Specs Row - Compact */}
        <div className="flex items-center gap-3 text-slate-600 text-xs mb-2.5">
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span>{property.bedrooms ?? '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5 text-slate-400" />
            <span>{property.bathrooms ?? '-'}</span>
          </div>
          {areaSqWa != null && (
            <div className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{areaSqWa}</span>
            </div>
          )}
        </div>

        {/* Availability Badge */}
        <div className="flex items-center gap-2 mb-2.5">
          {property.availability === 'available' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ว่าง
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              ติดจอง
            </span>
          )}
        </div>

        {/* CTA Button - Larger Touch Target (min 44px) */}
        <Link
          href={propertyPath}
          className="mt-auto inline-flex items-center justify-center rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 active:scale-[0.98] transition-all duration-200 py-3 px-4 min-h-[44px]"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}

export default memo(PropertyCardCompact);
