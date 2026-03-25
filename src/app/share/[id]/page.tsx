'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  MapPin, Bed, Bath, Maximize2, Copy, Check, Home, 
  ChevronLeft, ChevronRight, Car, Factory, ShoppingBag, Hospital, GraduationCap
} from 'lucide-react';
import { getPropertyById } from '@/lib/firestore';
import { formatPrice } from '@/lib/priceFormat';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { getCloudinaryLargeUrl, getCloudinaryThumbUrl, isValidImageUrl } from '@/lib/cloudinary';
import LeadForm from '@/components/LeadForm';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

const TYPE_ICONS: Record<string, any> = {
  industrial: Factory,
  mall: ShoppingBag,
  hospital: Hospital,
  education: GraduationCap,
};

const TYPE_ORDER = ['industrial', 'mall', 'hospital', 'education'];

const TYPE_TITLES: Record<string, string> = {
  industrial: 'นิคมอุตสาหกรรม',
  mall: 'ห้างสรรพสินค้า',
  hospital: 'โรงพยาบาล',
  education: 'การศึกษา',
};

function NearbyPlacesCard({ property }: { property: any }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('industrial');
  
  const places = property?.nearbyPlaces || [];
  const groupedPlaces = places.reduce((groups: Record<string, any[]>, place: any) => {
    const type = place.type === 'shopping' ? 'mall' : place.type === 'school' ? 'education' : place.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push({ ...place, type });
    return groups;
  }, { industrial: [], mall: [], hospital: [], education: [] });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-blue-900">สถานที่สำคัญใกล้เคียง</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {TYPE_ORDER.filter((type) => groupedPlaces[type]?.length > 0).map((type) => {
          const Icon = TYPE_ICONS[type] || MapPin;
          const isExpanded = expandedCategory === type;
          return (
            <div key={type}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : type)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-blue-900" />
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{TYPE_TITLES[type]}</span>
                </div>
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {groupedPlaces[type].map((place: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="flex-1">{place.name}</span>
                      <span className="text-gray-400 text-xs">{place.distanceText || place.durationText || 'ตรวจสอบจากแผนที่'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {places.length === 0 && (
        <div className="p-6 text-center text-gray-500 text-sm">
          ไม่มีข้อมูลสถานที่ใกล้เคียง
        </div>
      )}
    </div>
  );
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
        const p = await getPropertyById(id);
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

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
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/properties" className="flex items-center gap-2 text-gray-600 hover:text-blue-900">
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium text-sm">กลับ</span>
        </Link>
        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
            copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>

      <div className="pb-24">
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
            <NearbyPlacesCard property={property} />
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

        {/* Lead Form - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-3">
              <p className="font-bold text-blue-900">สนใจติดต่อเจ้าของทรัพย์</p>
            </div>
            <LeadForm
              propertyId={property.displayId || property.propertyId || property.id}
              propertyTitle={property.title}
              propertyPrice={property.price}
              isRental={isRental}
              onSuccess={(message) => {
                alert(message || 'ส่งข้อมูลสำเร็จ!');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
