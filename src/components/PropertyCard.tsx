'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MapPin, Heart, Bed, Bath, Maximize2 } from 'lucide-react';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { formatPriceShort, maskDigits } from '@/lib/priceFormat';
import { getCloudinaryThumbUrl } from '@/lib/cloudinary';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { generatePropertySlug } from '@/lib/propertySlug';
import { type Property, Timestamp } from '@/lib/firestore';
import OptimizedImage from '@/components/OptimizedImage';

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
  home?: boolean;
  searchQuery?: string;
}

function createdTimeValue(value: Property['createdAt']): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const timestamp = value as Timestamp | undefined;
  return timestamp?.toMillis?.() || 0;
}

function PropertyCard({ property, home = false }: PropertyCardProps) {
  const propertyId = property?.id ?? null;
  const [favorited, setFavorited] = useState(false);
  const [renderedAt, setRenderedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    const timer = window.setTimeout(() => {
      setRenderedAt(Date.now());
      setFavorited(isFavorite(propertyId));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [propertyId]);

  if (!propertyId) return null;

  const listingType = property.listingType || (property.isRental ? 'rent' : 'sale');
  const createdAt = createdTimeValue(property.createdAt);
  const isNew = renderedAt !== null && createdAt > 0 && renderedAt - createdAt < 7 * 24 * 60 * 60 * 1000;
  const isInstallment = property.subListingType === 'installment_only' || property.directInstallment;

  const loc = typeof property.location === 'object' ? property.location : null;
  const district = loc ? [loc.district, loc.province].filter(Boolean).join(', ') : (property.district || property.province || '');
  const subDistrict = loc?.subDistrict || '';
  const typeLabel = getPropertyLabel(property.type || property.propertyType || '') || 'อสังหาริมทรัพย์';
  // ใช้ชื่อที่ผู้ใช้ตั้งไว้ (property.title) ก่อนเสมอ ให้ตรงกับหน้ารายละเอียด
  const titleText = property.title?.trim() || (subDistrict ? `${typeLabel} ${subDistrict}` : typeLabel);
  const areaSqWa = property.area != null && Number(property.area) > 0 ? (Number(property.area) / 4).toFixed(0) : null;
  const installmentPerMonth = isInstallment && property.price != null && Number(property.price) > 0 ? Math.round(Number(property.price) / 120) : null;

  const handleFavorite = () => setFavorited(toggleFavorite(propertyId));
  const propertyPath = generatePropertySlug(property) ? `/properties/${generatePropertySlug(property)}` : `/properties/${property.id}`;
  const coverImage = property.coverImageUrl || property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400';
  const isHome = home || false;

  const badgeLabel = isInstallment ? 'ผ่อนตรง' : listingType === 'rent' ? 'เช่า' : 'ขาย';
  const badgeTone = isInstallment
    ? 'bg-accent-soft text-accent border-accent/25'
    : 'bg-white/95 text-ink border-line';

  return (
    <article
      className={`group flex h-full w-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 ${isHome ? '' : ''}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
        <Link href={propertyPath} className="absolute inset-0 z-[1] block" aria-label={`ดูรายละเอียด${titleText}`}>
          <OptimizedImage
            src={getCloudinaryThumbUrl(coverImage) || coverImage}
            alt={titleText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/25 to-transparent" />
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity duration-200 group-hover:flex group-hover:opacity-100">
            <span className="rounded-full border border-line bg-white/95 px-4 py-2 text-xs font-semibold text-ink shadow-sm">ดูรายละเอียด</span>
          </div>
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 z-[2] flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${badgeTone}`}>
            {badgeLabel}
          </span>
          {isNew && (
            <span className="inline-flex items-center rounded-full border border-accent bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
              ใหม่
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          aria-pressed={favorited}
          className="absolute right-2.5 top-2.5 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/95 text-ink backdrop-blur-sm transition-all hover:bg-white active:scale-95"
          aria-label={favorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        >
          <Heart className={`h-4 w-4 transition-colors ${favorited ? 'fill-accent text-accent' : 'text-slate-500'}`} aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <Link href={propertyPath} className="block">
          <h3 className="line-clamp-2 min-h-[42px] font-medium leading-snug text-ink transition-colors text-[15px] group-hover:text-accent">
            {titleText}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{district || '—'}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{property.bedrooms ?? '-'}</span>
          <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{property.bathrooms ?? '-'}</span>
          {areaSqWa != null && (
            <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{areaSqWa} ตร.ว.</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
          <div className="min-w-0">
            <div className="truncate text-[19px] font-bold tracking-tight text-ink">
              {formatPriceShort(property.price, listingType === 'rent', property.showPrice !== false)}
            </div>
            {installmentPerMonth != null && (
              <div className="mt-0.5 text-[11px] text-muted">≈ {maskDigits(installmentPerMonth)} บาท/เดือน</div>
            )}
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium ${property.availability === 'available' ? 'text-accent' : 'text-amber-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${property.availability === 'available' ? 'bg-accent' : 'bg-amber-500'}`} />
            {property.availability === 'available' ? 'พร้อมอยู่' : 'ติดจอง'}
          </span>
        </div>

        {property.propertyCondition && (
          <div className="text-[11px] text-muted">{property.propertyCondition}</div>
        )}
      </div>
    </article>
  );
}

export default memo(PropertyCard);
