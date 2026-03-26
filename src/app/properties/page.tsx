'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Search, X, MapPin, Home, Map, Grid, 
  ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getPropertiesOnce, type Property } from '@/lib/firestore';
import { PROPERTY_TYPES } from '@/constants/propertyTypes';
import PropertyCard from '@/components/PropertyCard';
import RecommendedPropertiesSection from '@/components/RecommendedPropertiesSection';
import Dropdown from '@/components/ui/Dropdown';

const PropertiesMap = dynamic(() => import('@/components/PropertiesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-100 rounded-xl flex items-center justify-center">
      <p className="text-slate-500">กำลังโหลดแผนที่…</p>
    </div>
  ),
});

const ITEMS_PER_PAGE = 12;

function PropertiesContent() {
  const searchParams = useSearchParams();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  
  // Filters
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const props = await getPropertiesOnce(true);
        setProperties(props);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Search query
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        const loc = typeof p.location === 'object' ? p.location : null;
        const searchable = [
          p.title,
          loc?.district,
          loc?.province,
          p.propertyType,
          p.type,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchable.includes(query)) return false;
      }

      // Property type filter
      if (propertyType && p.propertyType !== propertyType && p.type !== propertyType) return false;

      // Location filter
      if (location) {
        const loc = typeof p.location === 'object' ? p.location : null;
        const locStr = [loc?.district, loc?.province, p.district, p.province].filter(Boolean).join(' ');
        if (!locStr.includes(location)) return false;
      }

      // Price range filter
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (min && p.price < min) return false;
        if (max && p.price > max) return false;
      }

      // Bedrooms filter
      if (bedrooms) {
        const minBeds = parseInt(bedrooms);
        if (p.bedrooms == null || p.bedrooms < minBeds) return false;
      }

      return true;
    });
  }, [properties, debouncedQuery, propertyType, location, priceRange, bedrooms]);

  // Sort properties
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'latest':
      default:
        return sorted;
    }
  }, [filteredProperties, sortBy]);

  // Properties with coordinates for map
  const mapProperties = useMemo(() => {
    return sortedProperties.filter(
      (p) => typeof p.lat === 'number' && typeof p.lng === 'number' && 
             !isNaN(p.lat) && !isNaN(p.lng)
    );
  }, [sortedProperties]);

  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / ITEMS_PER_PAGE));
  
  // Pagination
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProperties, currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setPropertyType('');
    setLocation('');
    setPriceRange('');
    setBedrooms('');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedQuery || propertyType || location || priceRange || bedrooms;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Title & Count */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-blue-900">รายการประกาศ</h1>
            <p className="text-slate-500 text-sm">
              พบ <span className="font-semibold text-blue-900">{filteredProperties.length}</span> รายการ
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อทำเล..."
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition"
              />
              {searchQuery.length > 0 && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
            </div>
            <button className="px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold shadow-sm transition">
              ค้นหา
            </button>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* ประเภทอสังหาฯ */}
            <Dropdown
              options={PROPERTY_TYPES.map((pt) => ({ value: pt.id, label: pt.label }))}
              value={propertyType}
              onChange={(val) => { setPropertyType(val); setCurrentPage(1); }}
              placeholder="ประเภทอสังหาฯ"
            />

            {/* พื้นที่/ทำเล */}
            <Dropdown
              options={[
                { value: 'ชลบุรี', label: 'ชลบุรี' },
                { value: 'พานทอง', label: 'พานทอง' },
                { value: 'บ้านบึง', label: 'บ้านบึง' },
                { value: 'ศรีราชา', label: 'ศรีราชา' },
                { value: 'ฉะเชิงเทรา', label: 'ฉะเชิงเทรา' },
                { value: 'ระยอง', label: 'ระยอง' },
              ]}
              value={location}
              onChange={(val) => { setLocation(val); setCurrentPage(1); }}
              placeholder="พื้นที่/ทำเล"
            />

            {/* ช่วงราคา */}
            <Dropdown
              options={[
                { value: '0-1000000', label: 'ต่ำกว่า 1 ล้าน' },
                { value: '1000000-3000000', label: '1-3 ล้าน' },
                { value: '3000000-5000000', label: '3-5 ล้าน' },
                { value: '5000000-10000000', label: '5-10 ล้าน' },
                { value: '10000000-', label: 'มากกว่า 10 ล้าน' },
              ]}
              value={priceRange}
              onChange={(val) => { setPriceRange(val); setCurrentPage(1); }}
              placeholder="ช่วงราคา"
            />

            {/* จำนวนห้องนอน */}
            <Dropdown
              options={[
                { value: '1', label: '1 ห้องนอน+' },
                { value: '2', label: '2 ห้องนอน+' },
                { value: '3', label: '3 ห้องนอน+' },
                { value: '4', label: '4 ห้องนอน+' },
              ]}
              value={bedrooms}
              onChange={(val) => { setBedrooms(val); setCurrentPage(1); }}
              placeholder="จำนวนห้องนอน"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - 25% */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-4">
            {/* Sort Dropdown */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <Dropdown
                options={[
                  { value: 'latest', label: 'ล่าสุด' },
                  { value: 'price-low', label: 'ราคาต่ำ-สูง' },
                  { value: 'price-high', label: 'ราคาสูง-ต่ำ' },
                ]}
                value={sortBy}
                onChange={setSortBy}
                placeholder="จัดเรียงตาม"
                label="จัดเรียงตาม"
              />
            </div>

            {/* Recommended Properties */}
            <RecommendedPropertiesSection 
              allProperties={properties} 
              currentFilters={{}}
              vertical={true}
            />
          </aside>

          {/* Right Content - 75% */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Map Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    showMap 
                      ? 'bg-blue-900 text-white' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Map className="h-4 w-4" />
                  {showMap ? 'ซ่อนแผนที่' : 'แสดงแผนที่'}
                </button>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            {/* Map */}
            {showMap && (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="h-[400px]">
                  <PropertiesMap properties={mapProperties} />
                </div>
              </div>
            )}

            {/* Property Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                      <div className="h-9 bg-slate-200 rounded-xl animate-pulse w-full mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">ไม่พบรายการที่ตรงกับเงื่อนไข</h2>
                <p className="text-slate-500 text-sm mb-4">ลองเปลี่ยนคำค้นหาหรือปรับตัวกรองใหม่</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-medium hover:bg-blue-800 transition"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {getPageNumbers()[0] > 1 && (
                    <>
                      <button 
                        onClick={() => handlePageChange(1)}
                        className="w-10 h-10 rounded-xl hover:bg-slate-100"
                      >
                        1
                      </button>
                      {getPageNumbers()[0] > 2 && <span className="text-slate-300">...</span>}
                    </>
                  )}
                  
                  {getPageNumbers().map(n => (
                    <button
                      key={n}
                      onClick={() => handlePageChange(n)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === n 
                          ? 'bg-blue-900 text-white shadow-sm' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  
                  {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                    <>
                      {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                        <span className="text-slate-300">...</span>
                      )}
                      <button 
                        onClick={() => handlePageChange(totalPages)}
                        className="w-10 h-10 rounded-xl hover:bg-slate-100"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  หน้าที่ {currentPage} จาก {totalPages}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
