'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Bed, Bath, Maximize2, Phone, MessageCircle, Share2, 
  Check, ChevronLeft, ChevronRight, X, Home, Building, User
} from 'lucide-react';
import { getPropertyById, type Property } from '@/lib/firestore';
import { formatPrice } from '@/lib/priceFormat';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { getCloudinaryLargeUrl, getCloudinaryThumbUrl, isValidImageUrl } from '@/lib/cloudinary';
import PropertyCard from '@/components/PropertyCard';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);

  // Fetch property
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const p = await getPropertyById(id);
        setProperty(p);
      } catch (error) {
        console.error('Error fetching property:', error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchProperty();
    }
  }, [id]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Not found state
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
  const loc = typeof property.location === 'object' ? property.location : null;
  const district = loc?.district || property.district || '';
  const province = loc?.province || property.province || '';
  const subDistrict = loc?.subDistrict || '';
  
  const listingType = property.listingType || (property.isRental ? 'rent' : 'sale');
  const isRental = listingType === 'rent';
  const isInstallment = property.subListingType === 'installment_only' || property.directInstallment;
  
  const typeLabel = getPropertyLabel(property.type || property.propertyType || '');
  
  // Images
  const defaultImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800';
  const rawImgs = property.images?.filter(isValidImageUrl) || [];
  let finalImgs = [...rawImgs];
  if (property.coverImageUrl && isValidImageUrl(property.coverImageUrl)) {
    finalImgs = [
      property.coverImageUrl,
      ...rawImgs.filter(img => img !== property.coverImageUrl)
    ];
  }
  if (finalImgs.length === 0) finalImgs = [defaultImg];

  // Area calculation
  const areaSqWa = property.area != null && Number(property.area) > 0 
    ? (Number(property.area) / 4).toFixed(0) 
    : null;

  // Navigation
  const prevImage = () => {
    setGalleryIndex((prev) => (prev === 0 ? finalImgs.length - 1 : prev - 1));
  };
  const nextImage = () => {
    setGalleryIndex((prev) => (prev === finalImgs.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/properties" 
              className="flex items-center gap-2 text-slate-600 hover:text-blue-900 transition"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">กลับ</span>
            </Link>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
              <span className="text-sm font-medium">{copied ? 'คัดลอกแล้ว!' : 'แชร์'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-video">
                <img
                  src={getCloudinaryLargeUrl(finalImgs[galleryIndex]) || finalImgs[galleryIndex]}
                  alt={`รูปภาพ ${galleryIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows */}
                {finalImgs.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium">
                  {galleryIndex + 1} / {finalImgs.length}
                </div>

                {/* Listing Type Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className="inline-flex items-center py-1.5 px-3 text-sm font-semibold text-white rounded-full shadow"
                    style={{
                      backgroundColor: isInstallment ? '#059669' : isRental ? '#ea580c' : '#2563eb',
                    }}
                  >
                    {isInstallment ? 'ผ่อนตรง' : isRental ? 'เช่า' : 'ขาย'}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {finalImgs.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {finalImgs.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGalleryIndex(idx)}
                      className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                        idx === galleryIndex ? 'border-blue-900' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={getCloudinaryThumbUrl(img) || img}
                        alt={`รูปย่อ ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Home className="h-4 w-4" />
                    <span>{typeLabel}</span>
                    <span className="text-slate-300">•</span>
                    <span className={property.availability === 'available' ? 'text-green-600' : 'text-amber-600'}>
                      {property.availability === 'available' ? 'ว่าง' : 'ติดจอง'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {subDistrict ? `${typeLabel} ${subDistrict}` : typeLabel}
                  </h1>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-slate-600 mb-6">
                <MapPin className="h-5 w-5 text-slate-400" />
                <span>
                  {subDistrict && `${subDistrict}, `}{district && `${district}, `}{province}
                </span>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Bed className="h-6 w-6 text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{property.bedrooms ?? '-'}</p>
                    <p className="text-xs text-slate-500">ห้องนอน</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Bath className="h-6 w-6 text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{property.bathrooms ?? '-'}</p>
                    <p className="text-xs text-slate-500">ห้องน้ำ</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Maximize2 className="h-6 w-6 text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{areaSqWa ?? '-'}</p>
                    <p className="text-xs text-slate-500">ตร.ว.</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="border-t border-slate-100 pt-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">รายละเอียด</h2>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Property Condition */}
              <div className="border-t border-slate-100 pt-6 mt-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">ข้อมูลเพิ่มเติม</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">สภาพ</span>
                    <span className="font-medium">{property.propertyCondition || 'มือสอง'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">พื้นที่</span>
                    <span className="font-medium">{property.area} ตร.ม.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            {(district || province) && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">ทำเลที่ตั้ง</h2>
                </div>
                <div className="aspect-video">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${subDistrict}, ${district}, ${province}`)}&output=embed`}
                    className="w-full h-full"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property Location"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Price Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">
                  {isRental ? 'ราคาเช่าต่อเดือน' : 'ราคาขาย'}
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatPrice(property.price, isRental)}
                </p>
                {isInstallment && (
                  <p className="text-sm text-green-600 mt-1">
                    ≈ {Math.round(property.price / 120).toLocaleString('th-TH')} บาท/ด.
                  </p>
                )}
              </div>

              {/* Contact Button */}
              <button
                onClick={() => setShowContact(!showContact)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold transition"
              >
                <Phone className="h-5 w-5" />
                <span>ติดต่อเจ้าของทรัพย์</span>
              </button>

              {/* Agent Contact */}
              {showContact && property.agentContact && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3">
                  {property.agentContact.name && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-900" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{property.agentContact.name}</p>
                        <p className="text-sm text-slate-500">เจ้าของทรัพย์</p>
                      </div>
                    </div>
                  )}
                  {property.agentContact.phone && (
                    <a
                      href={`tel:${property.agentContact.phone}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-900"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{property.agentContact.phone}</span>
                    </a>
                  )}
                  {property.agentContact.lineId && (
                    <a
                      href={`https://line.me/ti/p/~${property.agentContact.lineId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-600 hover:text-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>LINE: {property.agentContact.lineId}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Share */}
              <button
                onClick={handleCopyLink}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:border-blue-300 hover:text-blue-900 transition"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'แชร์ทรัพย์นี้'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
