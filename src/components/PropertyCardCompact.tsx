'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MapPin, Heart, Bed, Bath, Maximize2 } from 'lucide-react';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { formatPriceShort } from '@/lib/priceFormat';
import { getCloudinaryThumbUrl } from '@/lib/cloudinary';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { generatePropertySlug } from '@/lib/propertySlug';
import type { Property } from '@/lib/firestore';
import OptimizedImage from '@/components/OptimizedImage';

interface PropertyCardCompactProps {
  property: Property;
  featured?: boolean;
  hotDeal?: boolean;
  isNew?: boolean;
  loading?: boolean;
}

function PropertyCardSkeleton() {
  return (
    <article className="flex flex-col h-full w-full bg-white overflow-hidden rounded-xl shadow-sm" aria-label="กำลังโหลดข้อมูลทรัพย์">
      <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
      <div className="flex flex-col flex-1 min-w-0 p-3 space-y-2">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
        <div className="h-9 bg-slate-100 rounded-lg animate-pulse w-full mt-auto" />
      </div>
    </article>
  );
}

function PropertyCardCompact({ property, featured = false, hotDeal = false, isNew = false, loading = false }: PropertyCardCompactProps) {
  const propertyId = property?.id ?? null;
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    const timer = window.setTimeout(() => setFavorited(isFavorite(propertyId)), 0);
    return () => window.clearTimeout(timer);
  }, [propertyId]);

  if (loading || !property) return <PropertyCardSkeleton />;
  if (!propertyId) return null;

  const listingType = property.listingType || (property.isRental ? 'rent' : 'sale');
  const isInstallment = property.subListingType === 'installment_only' || property.directInstallment;
  const loc = typeof property.location === 'object' ? property.location : null;
  const district = loc ? [loc.district, loc.province].filter(Boolean).join(', ') : (property.district || property.province || '');
  const subDistrict = loc?.subDistrict || '';
  const typeLabel = getPropertyLabel(property.type || property.propertyType || '') || 'อสังหาริมทรัพย์';
  const titleText = subDistrict ? `${typeLabel} ${subDistrict}` : typeLabel;
  const areaSqWa = property.area != null && Number(property.area) > 0 ? (Number(property.area) / 4).toFixed(0) : null;
  const installmentPerMonth = isInstallment && property.price != null && Number(property.price) > 0 ? Math.round(Number(property.price) / 120) : null;

  const handleFavorite = () => {
    setFavorited(toggleFavorite(propertyId));
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
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
        <Link href={propertyPath} className="block absolute inset-0" aria-label={`ดูรายละเอียด${titleText}`}>
          <OptimizedImage
            src={getCloudinaryThumbUrl(coverImage) || coverImage}
            alt={titleText}
            fill
            sizes="(max-width: 640px) 256px, 288px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pr-12">
            <span className={`inline-flex items-center py-1 px-2.5 text-[10px] font-bold text-white rounded-md shadow-lg ${badgeColor}`}>{badgeLabel}</span>
            {isNew && <span className="inline-flex items-center py-1 px-2.5 text-[10px] font-bold text-white rounded-md shadow-lg bg-cyan-500">ใหม่</span>}
            {hotDeal && <span className="inline-flex items-center py-1 px-2.5 text-[10px] font-bold text-white rounded-md shadow-lg bg-amber-500">ดีลร้อน</span>}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <span className="text-white font-bold text-xl sm:text-2xl leading-tight drop-shadow-lg">
              {formatPriceShort(property.price, listingType === 'rent', property.showPrice !== false)}
            </span>
            {property.showPrice !== false && installmentPerMonth != null && (
              <div className="text-white/95 text-xs mt-0.5 font-medium">≈ ฿{installmentPerMonth.toLocaleString('th-TH')}/เดือน</div>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={handleFavorite}
          aria-pressed={favorited}
          className="absolute top-2 right-2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white active:scale-95 transition-all duration-200"
          aria-label={favorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        >
          <Heart className={`w-5 h-5 transition-colors ${favorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} aria-hidden="true" />
        </button>
      </div>

      {/* Content Section - Compact */}
      <div className="flex flex-col flex-1 min-w-0 p-3">
        {/* Title */}
        <Link href={propertyPath} className="block mb-1.5">
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors text-sm">
            {titleText}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{district || '—'}</span>
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
