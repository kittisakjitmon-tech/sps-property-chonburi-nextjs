'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { MapPin, Bed, Bath, Maximize2, Home, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { getPropertyById } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import NeighborhoodData from '@/components/NeighborhoodData';
import { formatPrice } from '@/lib/priceFormat';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { getCloudinaryLargeUrl, getCloudinaryThumbUrl, isValidImageUrl } from '@/lib/cloudinary';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { id } = use(params);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // First, check if this ID is a share link
        const shareLinkRef = doc(db, "share_links", id);
        const shareLinkSnap = await getDoc(shareLinkRef);
        
        let propertyId = id;
        
        if (shareLinkSnap.exists()) {
          // It's a share link - get the actual property ID
          const shareLinkData = shareLinkSnap.data();
          propertyId = shareLinkData.propertyId;
          
          // Check if link has expired
          if (shareLinkData.expiresAt) {
            const expiresAt = shareLinkData.expiresAt.toDate ? shareLinkData.expiresAt.toDate() : new Date(shareLinkData.expiresAt);
            if (expiresAt < new Date()) {
              setProperty(null);
              setLoading(false);
              return;
            }
          }
        }
        
        // Now fetch the property - NeighborhoodData will handle nearby places
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
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="space-y-4 p-4">
          <div className="aspect-[4/3] bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl font-bold text-gray-800 mb-2">ไม่พบรายการนี้</h1>
          <p className="text-gray-500 mb-4">ลิงก์อาจหมดอายุหรือถูกลบแล้ว</p>
          <Link href="/" className="text-blue-600 hover:underline">กลับหน้าหลัก</Link>
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
  const defaultImg = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
  const rawImgs = property.images?.filter(isValidImageUrl) || [];
  let finalImgs = [...rawImgs];
  if (property.coverImageUrl && isValidImageUrl(property.coverImageUrl)) {
    finalImgs = [property.coverImageUrl, ...rawImgs.filter((img: string) => img !== property.coverImageUrl)];
  }
  const imgs = finalImgs.length > 0 ? finalImgs : [defaultImg];

  // Area
  const areaSqWa = property.area != null && Number(property.area) > 0 ? (Number(property.area) / 4).toFixed(0) : null;

  // Property details
  const details = [
    { icon: '🏠', label: 'ประเภท', value: typeLabel },
    { icon: '📐', label: 'พื้นที่', value: property.area ? `${Number(property.area).toLocaleString('th-TH')} ตร.ม.` : '-' },
    { icon: '🛏', label: 'ห้องนอน', value: property.bedrooms || '-' },
    { icon: '🛁', label: 'ห้องน้ำ', value: property.bathrooms || '-' },
  ];

  // Highlights/bonuses
  const highlights = [
    '✅ ฟรีแอร์',
    '✅ ฟรีปั๊มน้ำ',
    '✅ ฟรีค่าใช้จ่ายวันโอน',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        {/* Image Gallery */}
        <div className="bg-white">
          <div className="aspect-[4/3] relative">
            <img
              src={getCloudinaryLargeUrl(imgs[galleryIndex]) || imgs[galleryIndex]}
              alt={typeLabel}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation */}
            {imgs.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex((prev) => prev === 0 ? imgs.length - 1 : prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setGalleryIndex((prev) => prev === imgs.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
              {galleryIndex + 1}/{imgs.length}
            </div>
          </div>

          {/* Thumbnails */}
          {imgs.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {imgs.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 ${
                    i === galleryIndex ? 'border-blue-900' : 'border-transparent'
                  }`}
                >
                  <img src={getCloudinaryThumbUrl(img) || img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-200" />
        </div>

        {/* Basic Info */}
        <div className="bg-white px-4 py-5 space-y-4">
          {/* Property ID & Status */}
          <div className="flex flex-wrap items-center gap-2">
            {property.propertyId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium font-mono">
                {property.propertyId}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(property.propertyId);
                  }}
                  className="hover:text-blue-600"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </span>
            )}
            {property.type && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                {isRental ? 'เช่า' : 'ซื้อ'}
              </span>
            )}
            {!isRental && property.propertySubStatus && (
              <span className="px-2.5 py-1 rounded-full bg-blue-900 text-white text-xs font-medium">
                {property.propertySubStatus}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <Home className="h-5 w-5 text-gray-400" />
              {property.title || typeLabel}
            </h1>
          </div>

          {/* Price */}
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {formatPrice(property.price, isRental)}
            </p>
            {isInstallment && (
              <p className="text-sm text-green-600 mt-1">
                ≈ {Math.round(property.price / 120).toLocaleString('th-TH')} บาท/ด.
              </p>
            )}
          </div>

          {/* Location & Specs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{loc.district || ''}{loc.district && loc.province ? ', ' : ''}{loc.province || ''}</span>
            </div>
            
            <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-gray-400" />
                  {property.bedrooms} ห้องนอน
                </span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-gray-400" />
                  {property.bathrooms} ห้องน้ำ
                </span>
              )}
              {areaSqWa && (
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="h-4 w-4 text-gray-400" />
                  {areaSqWa} ตร.ว.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Property Details Card */}
        <div className="bg-white mt-3 px-4 py-5 space-y-3">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900">รายละเอียดทรัพย์</h3>
          </div>
          
          {details.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <span className="text-lg">{item.icon}</span>
              <span className="text-gray-500 w-20">{item.label}</span>
              <span className="font-medium text-gray-900">{item.value}</span>
            </div>
          ))}

          {property.description && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Highlights */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            {highlights.map((highlight, idx) => (
              <p key={idx} className="text-sm text-green-700 font-medium">{highlight}</p>
            ))}
          </div>
        </div>

        {/* Nearby Places */}
        <div className="mt-3">
          <div className="px-4 py-4">
            <NeighborhoodData property={property} />
          </div>
        </div>

        {/* Map */}
        {loc.district || loc.province ? (
          <div className="mt-3 px-4 pb-4">
            <div className="rounded-xl overflow-hidden h-[250px]">
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
        ) : null}

      </div>
    </div>
  );
}
