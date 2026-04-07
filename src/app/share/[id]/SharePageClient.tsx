'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin, Bed, Bath, Maximize2, Home, ChevronLeft, ChevronRight,
  Copy, Heart, Share2, Phone, MessageCircle, CheckCircle2,
  Car, Trees, Building2, Train, ShoppingBag, Star
} from 'lucide-react';
import { getPropertyById } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatPrice, formatPriceShort } from '@/lib/priceFormat';
import { getPropertyLabel } from '@/constants/propertyTypes';
import NeighborhoodData from '@/components/NeighborhoodData';
import { getCloudinaryLargeUrl, getCloudinaryThumbUrl, isValidImageUrl } from '@/lib/cloudinary';

// Amenities icons mapping
const amenityIcons: Record<string, typeof Car> = {
  'สระว่ายน้ำ': Trees,
  'ที่จอดรถ': Car,
  'ใกล้ห้าง': ShoppingBag,
  'ใกล้รถไฟฟ้า': Train,
  'ใกล้โรงพยาบาล': Building2,
};

interface SharePageClientProps {
  id: string;
  propertyData?: any;
}

export default function SharePageClient({ id, propertyData }: SharePageClientProps) {
  const [property, setProperty] = useState<any>(propertyData);
  const [loading, setLoading] = useState(!propertyData);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {
    if (propertyData) {
      setProperty(propertyData);
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      try {
        const shareLinkRef = doc(db, "share_links", id);
        const shareLinkSnap = await getDoc(shareLinkRef);

        let propertyId = id;

        if (shareLinkSnap.exists()) {
          const shareLinkData = shareLinkSnap.data();
          propertyId = shareLinkData.propertyId;

          if (shareLinkData.expiresAt) {
            const expiresAt = shareLinkData.expiresAt.toDate ? shareLinkData.expiresAt.toDate() : new Date(shareLinkData.expiresAt);
            if (expiresAt < new Date()) {
              setProperty(null);
              setLoading(false);
              return;
            }
          }
        }

        const p: any = await getPropertyById(propertyId);
        setProperty(p);
      } catch (error) {
        console.error('Error fetching property:', error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProperty();
  }, [id, propertyData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-slate-200 rounded-2xl animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-14 bg-slate-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="h-8 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-14 bg-slate-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบรายการนี้</h1>
          <p className="text-slate-500 mb-4">ลิงก์อาจหมดอายุหรือถูกลบแล้ว</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 transition">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // Parse property data
  const loc = typeof property.location === 'object' ? property.location : {};
  const isRental = property.isRental || property.listingType === 'rent';
  const isInstallment = property.subListingType === 'installment_only' || property.directInstallment;
  const typeLabel = getPropertyLabel(property.type || property.propertyType || '');

  // Images
  const defaultImg = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200';
  const rawImgs = property.images?.filter(isValidImageUrl) || [];
  let finalImgs = [...rawImgs];
  if (property.coverImageUrl && isValidImageUrl(property.coverImageUrl)) {
    finalImgs = [property.coverImageUrl, ...rawImgs.filter((img: string) => img !== property.coverImageUrl)];
  }
  const imgs = finalImgs.length > 0 ? finalImgs : [defaultImg];

  // Area
  const areaSqWa = property.area != null && Number(property.area) > 0 ? (Number(property.area) / 4).toFixed(0) : null;
  const installmentPerMonth = isInstallment && property.price ? Math.round(property.price / 120) : null;

  // Why buy this highlights
  const highlights = property.highlights || [
    { icon: '📍', text: 'ทำเลดี ใกล้ถนนหลัก' },
    { icon: '🏠', text: 'สภาพบ้านสวย พร้อมอยู่' },
    { icon: '💰', text: 'ราคาต่ำกว่าตลาด' },
  ];

  // Generate OG image URL
  const ogImageUrl = imgs[0] ? (property.coverImageUrl || imgs[0]) : defaultImg;

  return (
    <>
      {/* OG Meta Tags as HTML head elements */}
      <meta property="og:title" content={property.title || typeLabel} />
      <meta property="og:description" content={`ราคา ${formatPriceShort(property.price, isRental, property.showPrice !== false)} - ${[loc.subDistrict, loc.district, loc.province].filter(Boolean).join(', ')}`} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={property.title || typeLabel} />
      <meta name="twitter:description" content={`ราคา ${formatPriceShort(property.price, isRental, property.showPrice !== false)} - ${[loc.subDistrict, loc.district, loc.province].filter(Boolean).join(', ')}`} />
      <meta name="twitter:image" content={ogImageUrl} />

      <div className="min-h-screen bg-slate-50">
        {/* ===== HERO IMAGE GALLERY ===== */}
        <div className="bg-white">
          {/* Main Image - Fixed Height */}
          <div
            className="relative h-[500px] md:h-[550px] cursor-pointer overflow-hidden"
            onClick={() => setShowAllPhotos(true)}
          >
            <img
              src={getCloudinaryLargeUrl(imgs[galleryIndex]) || imgs[galleryIndex]}
              alt={property.title || typeLabel}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {property.hotDeal && (
                <span className="px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold shadow-lg">
                  🔥 ราคาพิเศษ
                </span>
              )}
              {property.status === 'sold' && (
                <span className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-sm font-bold">
                  ขายแล้ว
                </span>
              )}
            </div>

            {/* Price Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                    {formatPriceShort(property.price, isRental, property.showPrice !== false)}
                  </p>
                  {installmentPerMonth && (
                    <p className="text-white/90 text-sm mt-1">
                      ผ่อน ≈ {installmentPerMonth.toLocaleString('th-TH')} บาท/ด.
                    </p>
                  )}
                </div>
                {imgs.length > 1 && (
                  <button className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-800 font-medium text-sm hover:bg-white transition flex items-center gap-2">
                    <span>📷</span>
                    ดู {imgs.length} รูป
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            {imgs.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => prev === 0 ? imgs.length - 1 : prev - 1); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition"
                >
                  <ChevronLeft className="h-6 w-6 text-slate-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => prev === imgs.length - 1 ? 0 : prev + 1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition"
                >
                  <ChevronRight className="h-6 w-6 text-slate-700" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {imgs.length > 1 && (
              <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {imgs.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {imgs.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`shrink-0 w-[120px] h-[80px] rounded-xl overflow-hidden border-2 transition-all ${i === galleryIndex ? 'border-blue-900 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                >
                  <img src={getCloudinaryThumbUrl(img) || img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* ===== FULL WIDTH CONTENT ===== */}
          <div className="space-y-6">

            {/* Property Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {property.propertyId && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium font-mono">
                      {property.propertyId}
                      <button onClick={() => navigator.clipboard.writeText(property.propertyId)} className="hover:text-blue-600">
                        <Copy className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isRental ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {isRental ? 'เช่า' : 'ขาย'}
                  </span>
                  {property.propertyCondition && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                      {property.propertyCondition}
                    </span>
                  )}
                  {isInstallment && (
                    <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                      ผ่อนตรง
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                  {property.title || typeLabel}
                </h1>

                {/* Location */}
                <div className="flex items-center gap-2 text-slate-500 mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{[loc.subDistrict, loc.district, loc.province].filter(Boolean).join(', ')}</span>
                </div>

                {/* Quick Specs Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Bed className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{property.bedrooms || '-'}</p>
                      <p className="text-xs text-slate-500">ห้องนอน</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Bath className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{property.bathrooms || '-'}</p>
                      <p className="text-xs text-slate-500">ห้องน้ำ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{areaSqWa || '-'}</p>
                      <p className="text-xs text-slate-500">ตร.ว.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Buy This Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  ทำไมถึงควรซื้อบ้านนี้
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {highlights.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100">
                      <span className="text-2xl">{item.icon || '✓'}</span>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description Section */}
            {property.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">รายละเอียด</h2>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              </div>
            )}

            {/* Amenities Section */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">สิ่งอำนวยความสะดวก</h2>
                  <div className="flex flex-wrap gap-3">
                    {property.amenities.map((amenity: string, idx: number) => {
                      const IconComponent = amenityIcons[amenity] || CheckCircle2;
                      return (
                        <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
                          <IconComponent className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-slate-700">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* Neighborhood Data Section */}
            <NeighborhoodData property={property} />

            {/* Map Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-3">ตำแหน่งที่ตั้ง</h2>
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${loc.subDistrict || ''}, ${loc.district || ''}, ${loc.province || ''}`)}&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property Location"
                  />
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* ===== LIGHTBOX MODAL ===== */}
        {showAllPhotos && (
          <div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setShowAllPhotos(false)}
          >
            <button
              onClick={() => setShowAllPhotos(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <span className="text-white text-2xl">×</span>
            </button>

            <div className="max-w-5xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <img
                src={getCloudinaryLargeUrl(imgs[galleryIndex]) || imgs[galleryIndex]}
                alt=""
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {imgs.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => prev === 0 ? imgs.length - 1 : prev - 1); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => prev === imgs.length - 1 ? 0 : prev + 1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-xl">
              {imgs.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                  className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === galleryIndex ? 'border-white scale-110' : 'border-transparent opacity-60'
                    }`}
                >
                  <img src={getCloudinaryThumbUrl(img) || img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
