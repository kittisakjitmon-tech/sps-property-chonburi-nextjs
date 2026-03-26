'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MapPin, Heart, Bed, Bath, Maximize2 } from 'lucide-react';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { formatPriceShort } from '@/lib/priceFormat';
import { getCloudinaryThumbUrl } from '@/lib/cloudinary';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { generatePropertySlug } from '@/lib/propertySlug';
import { type Property, Timestamp } from '@/lib/firestore';

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
  home?: boolean;
  searchQuery?: string;
}

function PropertyCard({ property, compact = false, home = false, searchQuery }: PropertyCardProps) {
  const propertyId = property?.id ?? null;
  const [favorited, setFavorited] = useState(false);
  const [renderedAt, setRenderedAt] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && propertyId) {
      setRenderedAt(Date.now());
      setFavorited(isFavorite(propertyId));
    }
  }, [propertyId]);

  if (!propertyId) return null;

  const listingType = property.listingType || (property.isRental ? 'rent' : 'sale');
  const subListingType = property.subListingType;
  const isNew = mounted && renderedAt && property.createdAt &&
    renderedAt - (typeof property.createdAt === 'number'
      ? property.createdAt
      : (property.createdAt as Timestamp)?.toMillis?.() || 0) < 7 * 24 * 60 * 60 * 1000;
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

  const installmentPerMonth =
    isInstallment && property.price != null && Number(property.price) > 0
      ? Math.round(Number(property.price) / 120)
      : null;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && propertyId) {
      setFavorited(toggleFavorite(propertyId));
    }
  };

  // Get slug path
  const propertyPath = generatePropertySlug(property)
    ? `/properties/${generatePropertySlug(property)}`
    : `/properties/${property.id}`;

  // Default image
  const coverImage = property.coverImageUrl || property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400';

  const isHome = home || false;

  // Badge color
  const badgeColor = isInstallment ? 'bg-emerald-500' : listingType === 'rent' ? 'bg-orange-500' : 'bg-blue-600';
  const badgeLabel = isInstallment ? 'ผ่อนตรง' : listingType === 'rent' ? 'เช่า' : 'ขาย';

  return (
    <article
      className={`group flex flex-col h-full w-full bg-white overflow-hidden rounded-2xl transition-all duration-300 ${
        isHome
          ? 'shadow-sm hover:shadow-lg hover:-translate-y-1'
          : 'shadow-sm hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Image Section */}
      <Link href={propertyPath} className="block relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
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
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)',
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <span className={`inline-flex items-center py-1 px-2.5 text-xs font-semibold text-white rounded-full shadow-sm ${badgeColor}`}>
            {badgeLabel}
          </span>
          {isNew && (
            <span className="inline-flex items-center py-1 px-2.5 text-xs font-semibold text-white rounded-full shadow-sm bg-cyan-500">
              ใหม่
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md active:scale-90 transition-all duration-200"
          aria-label={favorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${favorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} 
          />
        </button>

        {/* Price Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-8">
          {property.hotDeal && (
            <div className="text-amber-400 text-[10px] font-bold uppercase tracking-wide mb-0.5">
              🔥 ราคาพิเศษ
            </div>
          )}
          <div className="text-white font-bold text-lg leading-tight">
            {formatPriceShort(property.price, listingType === 'rent', property.showPrice !== false)}
          </div>
          {installmentPerMonth != null && (
            <div className="text-white/90 text-xs mt-0.5">
              ≈ ฿{installmentPerMonth.toLocaleString('th-TH')}/ด.
            </div>
          )}
        </div>
      </Link>

      {/* Content Section */}
      <div className="flex flex-col flex-1 min-w-0 p-4">
        {/* Title */}
        <Link href={propertyPath} className="block mb-1">
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors text-sm">
            {titleText}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{district || '—'}</span>
        </div>

        {/* Specs Row */}
        <div className="flex items-center gap-3 text-slate-600 text-xs mb-3">
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            <span>{property.bedrooms ?? '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            <span>{property.bathrooms ?? '-'}</span>
          </div>
          {areaSqWa != null && (
            <div className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{areaSqWa} ตร.ว.</span>
            </div>
          )}
        </div>

        {/* Status & Condition Badges */}
        <div className="flex items-center gap-2 mb-3">
          {property.availability === 'available' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ว่าง
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              ติดจอง
            </span>
          )}
          {property.propertyCondition && (
            <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {property.propertyCondition}
            </span>
          )}
        </div>

        {/* CTA Button */}
        <Link
          href={propertyPath}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 active:scale-[0.98] transition-all duration-200 py-3 px-4"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}

export default memo(PropertyCard);
