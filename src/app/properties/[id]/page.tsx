'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  MapPin, Bed, Bath, Maximize2, Share2, Copy, Check, 
  Home, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import { 
  getPropertyById, 
  recordPropertyView, 
  createOrReuseShareLink 
} from '@/lib/firestore';
import { createSpoomeShortUrl } from '@/lib/spoo';
import { formatPrice } from '@/lib/priceFormat';
import { highlightText } from '@/lib/textHighlight';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { getCloudinaryLargeUrl, getCloudinaryThumbUrl, isValidImageUrl } from '@/lib/cloudinary';
import { extractIdFromSlug, generatePropertySlug, getPropertyPath } from '@/lib/propertySlug';
import ProtectedImageContainer from '@/components/ProtectedImageContainer';
import LeadForm from '@/components/LeadForm';
import MortgageCalculator from '@/components/MortgageCalculator';
import Toast from '@/components/Toast';

const RelatedProperties = dynamic(() => import('@/components/RelatedProperties'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />,
});

const NeighborhoodData = dynamic(() => import('@/components/NeighborhoodData'), {
  ssr: false,
  loading: () => <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />,
});

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

function PropertyDetailContent({ id }: { id: string }) {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    const fetchProperty = async () => {
      try {
        // Extract actual Firestore ID from slug (format: {slug}--{id})
        const propertyId = extractIdFromSlug(id) || id;
        const p = await getPropertyById(propertyId);
        if (!cancelled) {
          setProperty(p);
          if (p?.id) {
            recordPropertyView({ propertyId: p.id, type: p.type }).catch(() => {});
          }
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        if (!cancelled) setProperty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchProperty();
    return () => { cancelled = true; };
  }, [id]);

  const handleShare = async () => {
    if (!property?.id) return;
    setIsSharing(true);
    try {
      const link = await createOrReuseShareLink({
        propertyId: property.id,
        createdBy: 'public_share',
        ttlHours: 24,
      });
      const shareUrl = `${window.location.origin}/share/${link.id}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Share error:', error);
      setToastMessage('ไม่สามารถสร้างลิงก์แชร์ได้');
      setShowToast(true);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const longUrl = window.location.href;
      const shortUrl = await createSpoomeShortUrl(longUrl);
      await navigator.clipboard.writeText(shortUrl);
      setToastMessage(`คัดลอกลิงก์แล้ว: ${shortUrl}`);
      setShowToast(true);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Copy error:', err);
      setToastMessage('ไม่สามารถคัดลอกลิงก์ได้');
      setShowToast(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-video bg-slate-200 animate-pulse" />
                <div className="flex gap-2 p-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="shrink-0 w-20 h-14 rounded-xl bg-slate-200 animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="h-5 w-24 bg-slate-200 rounded-full animate-pulse" />
                <div className="h-8 w-3/4 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-6 w-1/3 bg-yellow-100 rounded-xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-4/6" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ))}
                <div className="h-12 bg-blue-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบรายการนี้</h1>
          <p className="text-slate-500 mb-4">รายการที่คุณกำลังค้นหาอาจถูกลบหรือไม่มีอยู่ในระบบ</p>
          <Link 
            href="/properties" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับไปหน้ารายการ
          </Link>
        </div>
      </div>
    );
  }

  // Parse property data
  const loc = typeof property.location === 'object' ? property.location : {};
  const agent = property.agentContact || {};
  const defaultImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200';
  
  // Image gallery
  const rawImgs = property.images && Array.isArray(property.images) 
    ? property.images.filter(isValidImageUrl) 
    : [];
  
  let finalImgs: string[] = [...rawImgs];
  if (property.coverImageUrl && isValidImageUrl(property.coverImageUrl)) {
    finalImgs = [
      property.coverImageUrl,
      ...rawImgs.filter((img: string) => img !== property.coverImageUrl)
    ];
  }
  const imgs = finalImgs.length > 0 ? finalImgs : [defaultImg];

  const isRental = property.isRental || property.listingType === 'rent';
  const isInstallment = property.subListingType === 'installment_only' || property.directInstallment;
  const typeLabel = getPropertyLabel(property.type || property.propertyType || '');
  
  // Area
  const areaSqWa = property.area != null && Number(property.area) > 0 
    ? (Number(property.area) / 4).toFixed(0) 
    : null;

  // Status display
  const getStatusDisplay = () => {
    if (isRental) {
      return property.availability === 'unavailable'
        ? { label: 'ไม่ว่าง', color: 'bg-red-600 text-white' }
        : { label: 'ว่าง', color: 'bg-emerald-500 text-white' };
    } else {
      if (property.status === 'available') {
        return { label: 'ว่าง', color: 'bg-emerald-500 text-white' };
      } else if (property.status === 'reserved') {
        return { label: 'ติดจอง', color: 'bg-orange-500 text-white' };
      } else if (property.status === 'sold') {
        return { label: 'ขายแล้ว', color: 'bg-red-600 text-white' };
      }
    }
    return null;
  };
  const statusDisplay = getStatusDisplay();

  // Map embed URL
  const getMapEmbedUrl = (mapUrl: string | null) => {
    if (!mapUrl) {
      if (loc.district && loc.province) {
        const query = `${loc.district}, ${loc.province}`;
        return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
      }
      return null;
    }
    if (mapUrl.includes('<iframe')) {
      const match = mapUrl.match(/src="([^"]+)"/);
      if (match) return match[1];
    }
    if (mapUrl.includes('maps.app.goo.gl') || mapUrl.includes('goo.gl/maps')) return null;
    if (mapUrl.includes('/embed')) return mapUrl;
    if (mapUrl.includes('google.') && mapUrl.includes('/maps')) {
      const coordMatch = mapUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordMatch) {
        return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
      }
    }
    if (loc.district && loc.province) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(`${loc.district}, ${loc.province}`)}&output=embed`;
    }
    return null;
  };
  
  const mapEmbedUrl = getMapEmbedUrl(property.mapUrl);
  const isShortMapLink = property.mapUrl && (
    property.mapUrl.includes('maps.app.goo.gl') || 
    property.mapUrl.includes('goo.gl/maps')
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 65% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <ProtectedImageContainer propertyId={property.propertyId} className="aspect-video relative bg-slate-200">
                <img
                  src={getCloudinaryLargeUrl(imgs[galleryIndex]) || imgs[galleryIndex]}
                  alt={`${typeLabel} - รูปภาพที่ ${galleryIndex + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              </ProtectedImageContainer>
              
              {imgs.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {imgs.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 ${
                        i === galleryIndex ? 'border-blue-900' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={getCloudinaryThumbUrl(img) || img}
                        alt={`รูปย่อที่ ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {property.propertyId && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    <span className="font-mono">{property.propertyId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(property.propertyId);
                        setToastMessage('คัดลอกรหัสทรัพย์แล้ว');
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 2000);
                      }}
                      className="p-0.5 hover:bg-gray-200 rounded transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {property.type && (
                  <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    {isRental ? 'เช่า' : 'ซื้อ'}
                  </span>
                )}
                {!isRental && property.propertySubStatus && (
                  <span className="px-3 py-1.5 rounded-full bg-blue-900 text-white text-sm font-medium">
                    {property.propertySubStatus}
                  </span>
                )}
                {statusDisplay && (
                  <span className={`px-3 py-1.5 rounded-full ${statusDisplay.color} text-sm font-medium`}>
                    {statusDisplay.label}
                  </span>
                )}
                {property.directInstallment && (
                  <span className="px-3 py-1.5 rounded-full bg-yellow-400 text-blue-900 text-sm font-semibold">
                    ผ่อนตรง
                  </span>
                )}
              </div>

              {/* Title & Actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {property.displayId && (
                    <p className="text-xs font-mono text-slate-400 mb-1.5">{property.displayId}</p>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 flex items-center gap-2">
                    <Home className="h-6 w-6" />
                    {property.title}
                  </h1>
                  <p className="text-2xl font-bold text-amber-700 mt-2">
                    {formatPrice(property.price, isRental, property.showPrice)}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold"
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="hidden sm:inline">แชร์ให้ลูกค้า</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl font-semibold transition-all border ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    <span className="hidden sm:inline">{copied ? 'คัดลอกสำเร็จ' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              {/* Location & Specs */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{loc.district || ''}{loc.district && loc.province ? ', ' : ''}{loc.province || ''}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Bed className="h-4 w-4 shrink-0" />
                    <span>{property.bedrooms || '-'} ห้องนอน</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4 shrink-0" />
                    <span>{property.bathrooms || '-'} ห้องน้ำ</span>
                  </span>
                  {property.area != null && property.area > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Maximize2 className="h-4 w-4 shrink-0" />
                      <span>{Number(property.area).toFixed(1)} ตร.ว.</span>
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {property.description || '-'}
              </p>

              {/* Direct Installment Info */}
              {property.directInstallment && (
                <div className="mt-6 p-6 rounded-xl border-2 border-blue-200 bg-blue-50/50">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-blue-900 text-sm">ผ่อนตรง</span>
                    เงื่อนไขการผ่อนตรง (เช่าซื้อ)
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'ไม่เช็คเครดิตบูโร ไม่ต้องกู้แบงก์',
                      'ใช้เพียงบัตรประชาชนใบเดียวในการทำสัญญา',
                      'วางเงินดาวน์ตามตกลง เข้าอยู่ได้ทันที',
                      'ผ่อนชำระโดยตรงกับโครงการ/เจ้าของ',
                      'สามารถเปลี่ยนเป็นการกู้ธนาคารได้ในภายหลังเมื่อพร้อม',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <CheckCircle2 className="h-5 w-5 text-blue-900 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {property.customTags && Array.isArray(property.customTags) && property.customTags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Tag</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.customTags.map((tag: string, index: number) => (
                      <Link
                        key={index}
                        href={`/properties?search=${encodeURIComponent(tag)}`}
                        className="px-3 py-1.5 bg-blue-50 text-gray-700 text-sm rounded-full border border-blue-200 font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                      >
                        {highlightText(tag, '')}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {mapEmbedUrl ? (
                <div className="aspect-video">
                  <iframe
                    title="แผนที่"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : isShortMapLink ? (
                <div className="aspect-video flex flex-col items-center justify-center gap-4 bg-slate-50 px-6">
                  <MapPin className="h-12 w-12 text-blue-600" />
                  <p className="text-slate-600 text-center">ลิงก์สั้นไม่รองรับการแสดงแผนที่ในหน้า</p>
                  <a
                    href={property.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors"
                  >
                    เปิดใน Google Maps
                  </a>
                </div>
              ) : (
                <div className="h-64 bg-slate-200 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>แผนที่ Google Maps</p>
                    <p className="text-sm">{loc.district || 'ไม่ระบุ'}, {loc.province || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mortgage Calculator */}
            {!isRental && property.price > 0 && property.showPrice !== false && (
              <div className="mt-6">
                <MortgageCalculator price={property.price} directInstallment={property.directInstallment} />
              </div>
            )}

            {/* Related Properties */}
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-xl animate-pulse" />}>
              <RelatedProperties 
                currentPropertyId={property.id} 
                district={loc.district} 
                type={property.type} 
              />
            </Suspense>
          </div>

          {/* Sidebar - 35% */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Lead Form */}
              <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
                <div className="pt-4 border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">จองเยี่ยมชม (ส่งข้อความ)</p>
                  <LeadForm
                    propertyId={property.displayId || property.propertyId || property.id}
                    propertyTitle={property.title}
                    propertyPrice={property.price}
                    isRental={isRental}
                    onSuccess={(message) => {
                      setToastMessage(message || 'ส่งข้อมูลสำเร็จ เจ้าหน้าที่จะติดต่อกลับ');
                      setShowToast(true);
                    }}
                    onError={() => {
                      setToastMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                      setShowToast(true);
                    }}
                  />
                </div>
              </div>

              {/* Neighborhood Data */}
              <Suspense fallback={<div className="h-40 bg-slate-100 rounded-xl animate-pulse" />}>
                <NeighborhoodData property={property} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <Toast 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
        duration={3000} 
      />
    </div>
  );
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = use(params);
  return <PropertyDetailContent id={id} />;
}
