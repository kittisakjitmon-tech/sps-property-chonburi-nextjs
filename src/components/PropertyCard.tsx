'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MapPin, Bed, Bath, Maximize2, Heart, TrendingUp } from 'lucide-react';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { formatPriceShort } from '@/lib/priceFormat';
import { getCloudinaryThumbUrl } from '@/lib/cloudinary';
import { getPropertyLabel } from '@/constants/propertyTypes';
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

  // Set renderedAt only on client to avoid hydration mismatch
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
  // Only check isNew on client (renderedAt is null during SSR)
  const isNew = mounted && renderedAt && property.createdAt &&
    renderedAt - (typeof property.createdAt === 'number'
      ? property.createdAt
      : (property.createdAt as Timestamp)?.toMillis?.() || 0) < 7 * 24 * 60 * 60 * 1000;
  const isInstallment = subListingType === 'installment_only' || property.directInstallment;

  const loc = typeof property.location === 'object' ? property.location : null;
  const district = loc
    ? [loc.district, loc.province].filter(Boolean).join(' ')
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

  const propertyPath = `/properties/${property.id}`;

  // Default image
  const coverImage = property.coverImageUrl || property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400';

  const isHome = home || false;
  const isCompact = compact || false;

  return (
    <article
      className={`group flex flex-col h-full w-full bg-white overflow-hidden rounded-2xl transition-all duration-300 ${
        isHome
          ? 'hover:shadow-xl hover:-translate-y-1'
          : isCompact
          ? 'shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5'
          : 'shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Image Container */}
      <Link href={propertyPath} className="block relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
        <img
          src={getCloudinaryThumbUrl(coverImage) || coverImage}
          alt={titleText}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              บ้านใหม่
            </span>
          )}
          {isInstallment && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              ผ่อนตรง
            </span>
          )}
        </div>

        {/* Listing Type Badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
            listingType === 'rent'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-900 text-white'
          }`}>
            {listingType === 'rent' ? 'เช่า' : 'ขาย'}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          aria-label={favorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มไปยังรายการโปรด'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              favorited ? 'fill-red-500 text-red-500' : 'text-slate-500'
            }`}
          />
        </button>
      </Link>

      {/* Content */}
      <div className={`flex flex-col flex-1 ${isCompact ? 'p-3' : 'p-4'}`}>
        {/* Property Type */}
        <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">
          {typeLabel}
        </p>

        {/* Location */}
        {district && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{district}</span>
          </p>
        )}

        {/* Specs Row */}
        <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              {property.bathrooms}
            </span>
          )}
          {areaSqWa && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              {areaSqWa} ตร.วา
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto">
          <p className="text-lg font-bold text-blue-900 leading-tight">
            {formatPriceShort(property.price, listingType === 'rent')}
          </p>
          {installmentPerMonth && (
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ผ่อนเดือนละ {installmentPerMonth.toLocaleString()} บาท
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(PropertyCard);
