'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapPin, Bed, Bath, Maximize2, Share2, Copy, Check, Home, ChevronLeft, ChevronRight, X, Calendar, MessageCircle } from 'lucide-react';
import { createSpoomeShortUrl } from '@/lib/spoo';
import { formatPrice } from '@/lib/priceFormat';
import { highlightText } from '@/lib/textHighlight';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { getCloudinaryLargeUrl, getCloudinaryThumbUrl, isValidImageUrl } from '@/lib/cloudinary';
import { PRIMARY_CHAT_LABEL, PRIMARY_CHAT_URL } from '@/constants/contact';
import type { Property } from '@/lib/firestore';
import { useDialog } from '@/hooks/useDialog';
import OptimizedImage from '@/components/OptimizedImage';
import LeadForm from '@/components/LeadForm';
import MortgageCalculator from '@/components/MortgageCalculator';
import Toast from '@/components/Toast';

const NeighborhoodData = dynamic(() => import('@/components/NeighborhoodData'), {
  ssr: false,
  loading: () => <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />,
});

interface PropertyDetail extends Property {
  displayId?: string;
  propertyId?: string;
  propertySubStatus?: string;
  mapUrl?: string;
  totalFloors?: number;
}

interface PropertyDetailClientProps {
  property: PropertyDetail | null;
  loading?: boolean;
}

export default function PropertyDetailClient({ property, loading = false }: PropertyDetailClientProps) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const closeMobileForm = useCallback(() => setShowMobileForm(false), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const mobileFormDialogRef = useDialog(showMobileForm, closeMobileForm);
  const lightboxDialogRef = useDialog(lightboxOpen, closeLightbox);

  const handleShare = async () => {
    if (!property?.id) return;
    setIsSharing(true);
    try {
      const { createOrReuseShareLink } = await import('@/lib/firestore');
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
      <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery Skeleton */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="h-[450px] md:h-[500px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
                <div className="flex gap-2 p-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="shrink-0 w-[100px] h-[70px] rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              </div>
              
              {/* Details Card Skeleton */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="h-7 w-24 bg-slate-200 rounded-full animate-pulse" />
                  <div className="h-7 w-16 bg-blue-100 rounded-full animate-pulse" />
                </div>
                <div className="h-9 w-3/4 bg-slate-200 rounded-xl mb-3 animate-pulse" />
                <div className="h-7 w-1/3 bg-yellow-100 rounded-xl mb-4 animate-pulse" />
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-4/6" />
                </div>
                <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
              </div>
              
              {/* Map Skeleton */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="aspect-video bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
              </div>
            </div>
            
            {/* Sidebar Skeleton */}
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
  const loc = typeof property.location === 'object' && property.location !== null ? property.location : {};
  const agent = property.agentContact || {};
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

  // Map URL
  const getMapEmbedUrl = (mapUrl: string | undefined) => {
    if (!mapUrl) return null;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <nav aria-label="เส้นทางการนำทาง" className="mb-4 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <li><Link href="/" className="inline-flex min-h-[32px] items-center hover:text-blue-800">หน้าแรก</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/properties" className="inline-flex min-h-[32px] items-center hover:text-blue-800">อสังหาริมทรัพย์</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="max-w-full truncate text-slate-700">{property.title || typeLabel}</li>
          </ol>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* บนมือถือแสดงข้อมูลสำคัญก่อนแกลเลอรี */}
          <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
            <div className="order-2 lg:order-1 bg-white rounded-xl overflow-hidden shadow-sm">
              <button
                type="button"
                className="relative block w-full h-[280px] sm:h-[380px] md:h-[500px] bg-slate-200 cursor-zoom-in"
                onClick={() => { setLightboxIndex(galleryIndex); setLightboxOpen(true); }}
                aria-label={`ขยายรูปภาพที่ ${galleryIndex + 1} จาก ${imgs.length}`}
              >
                <OptimizedImage
                  src={getCloudinaryLargeUrl(imgs[galleryIndex]) || imgs[galleryIndex]}
                  alt={`${typeLabel} - รูปภาพที่ ${galleryIndex + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  priority
                  draggable={false}
                />
                <span className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                  {galleryIndex + 1} / {imgs.length}
                </span>
              </button>
              {imgs.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto" aria-label="เลือกรูปภาพ">
                  {imgs.map((img: string, i: number) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      aria-label={`ดูรูปภาพที่ ${i + 1}`}
                      aria-pressed={i === galleryIndex}
                      className={`relative shrink-0 w-[100px] h-[70px] rounded-xl overflow-hidden border-2 ${i === galleryIndex ? 'border-blue-900' : 'border-transparent'}`}
                    >
                      <OptimizedImage src={getCloudinaryThumbUrl(img) || img} alt="" fill sizes="100px" className="object-cover" draggable={false} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="order-1 lg:order-2 bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {property.propertyId && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    <span className="font-mono">{property.propertyId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(property.propertyId || '');
                        setToastMessage('คัดลอกรหัสทรัพย์แล้ว');
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 2000);
                      }}
                      aria-label="คัดลอกรหัสทรัพย์"
                      className="w-8 h-8 -m-1 flex items-center justify-center hover:bg-gray-200 rounded transition"
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
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2 leading-tight">
                {highlightText(property.title || typeLabel, '')}
              </h1>

              {/* Location */}
              <div className="flex items-center gap-2 text-slate-500 mb-3">
                <MapPin className="h-4 w-4" />
                <span>{[loc.subDistrict, loc.district, loc.province].filter(Boolean).join(', ')}</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                <p className="text-2xl sm:text-3xl font-bold text-orange-700">
                  {formatPrice(property.price, isRental, property.showPrice !== false)}
                </p>
                {property.showPrice !== false && isInstallment && property.price > 0 && (
                  <p className="text-base text-green-700 font-medium">≈ {Math.round(property.price / 120).toLocaleString('th-TH')} บาท/เดือน</p>
                )}
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {property.bedrooms != null && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Bed className="h-5 w-5 text-blue-600" />
                    <span>{property.bedrooms} ห้องนอน</span>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Bath className="h-5 w-5 text-blue-600" />
                    <span>{property.bathrooms} ห้องน้ำ</span>
                  </div>
                )}
                {areaSqWa && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Maximize2 className="h-5 w-5 text-blue-600" />
                    <span>{areaSqWa} ตร.ว.</span>
                  </div>
                )}
                {property.totalFloors && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Home className="h-5 w-5 text-blue-600" />
                    <span>{property.totalFloors} ชั้น</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {highlightText(property.description, '')}
                  </p>
                </div>
              )}
            </div>

            <div className="order-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">ตำแหน่งที่ตั้ง</h3>
              </div>
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

            <div className="order-4"><NeighborhoodData property={property} /></div>
          </div>

          {/* ===== SIDEBAR (35%) ===== */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Share Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing}
                    aria-label="แชร์ประกาศให้ลูกค้า"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold"
                  >
                    <Share2 className="h-5 w-5" aria-hidden="true" />
                    <span className="hidden sm:inline">แชร์ให้ลูกค้า</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    aria-label={copied ? 'คัดลอกลิงก์สำเร็จ' : 'คัดลอกลิงก์ประกาศ'}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl font-semibold transition-all border ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`}
                  >
                    {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}
                    <span className="hidden sm:inline">{copied ? 'คัดลอกสำเร็จ' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-100 p-4 sm:p-6 shadow-sm">
                <LeadForm
                  propertyId={property.displayId || property.propertyId || property.id}
                  propertyTitle={property.title}
                  onSuccess={(message) => { setToastMessage(message); setShowToast(true); }}
                />
              </div>

              {!isRental && property.price > 0 && property.showPrice !== false && <MortgageCalculator price={property.price} />}

              {agent.name && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">ผู้ประกาศ</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><Home className="w-6 h-6 text-blue-600" aria-hidden="true" /></div>
                    <div><p className="font-semibold text-slate-900">{agent.name}</p>{agent.phone && <p className="text-sm text-slate-500">{agent.phone}</p>}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} duration={3000} />

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t border-slate-200 z-40" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2">
          <a href={PRIMARY_CHAT_URL} target="_blank" rel="noopener noreferrer" className="flex-1 min-h-[52px] px-3 rounded-xl border border-blue-200 bg-white text-blue-900 font-bold flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" aria-hidden="true" />{PRIMARY_CHAT_LABEL}
          </a>
          <button type="button" onClick={() => setShowMobileForm(true)} className="flex-[1.4] min-h-[52px] px-3 rounded-xl bg-blue-700 text-white font-bold shadow-lg hover:bg-blue-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" aria-hidden="true" />นัดชมทรัพย์
          </button>
        </div>
      </div>

      {showMobileForm && (
        <div className="md:hidden fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMobileForm} aria-hidden="true" />
          <div ref={mobileFormDialogRef} role="dialog" aria-modal="true" aria-labelledby="mobile-form-title" tabIndex={-1} className="absolute bottom-0 left-0 right-0 max-h-[90dvh] overflow-y-auto overscroll-contain bg-white rounded-t-3xl shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 bg-white">
              <h2 id="mobile-form-title" className="text-lg font-bold text-slate-900">นัดชมทรัพย์</h2>
              <button type="button" onClick={closeMobileForm} aria-label="ปิดฟอร์มนัดชม" className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-slate-600" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 pb-8">
              <LeadForm
                propertyId={property.displayId || property.propertyId || property.id}
                propertyTitle={property.title}
                onSuccess={(message) => { setToastMessage(message); setShowToast(true); closeMobileForm(); }}
              />
            </div>
          </div>
        </div>
      )}

      {lightboxOpen && (
        <div
          ref={lightboxDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`แกลเลอรี ${typeLabel} รูปที่ ${lightboxIndex + 1} จาก ${imgs.length}`}
          tabIndex={-1}
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center"
          onClick={(event) => { if (event.target === event.currentTarget) closeLightbox(); }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setLightboxIndex((index) => Math.max(0, index - 1));
            if (event.key === 'ArrowRight') setLightboxIndex((index) => Math.min(imgs.length - 1, index + 1));
          }}
        >
          <button type="button" onClick={closeLightbox} aria-label="ปิดแกลเลอรี" className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" aria-hidden="true" />
          </button>
          <div className="relative max-w-5xl h-[70vh] w-full mx-4">
            <OptimizedImage src={getCloudinaryLargeUrl(imgs[lightboxIndex]) || imgs[lightboxIndex]} alt={`${typeLabel} - รูปภาพที่ ${lightboxIndex + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          {lightboxIndex > 0 && (
            <button type="button" aria-label="รูปก่อนหน้า" onClick={() => setLightboxIndex((index) => Math.max(0, index - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          )}
          {lightboxIndex < imgs.length - 1 && (
            <button type="button" aria-label="รูปถัดไป" onClick={() => setLightboxIndex((index) => Math.min(imgs.length - 1, index + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronRight className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-xl max-w-[90vw] overflow-x-auto">
            {imgs.map((img: string, i: number) => (
              <button key={`${img}-${i}`} type="button" aria-label={`ดูรูปที่ ${i + 1}`} aria-pressed={i === lightboxIndex} onClick={() => setLightboxIndex(i)} className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <OptimizedImage src={getCloudinaryThumbUrl(img) || img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
