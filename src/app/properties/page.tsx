'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  Search, X, MapPin, Home, SlidersHorizontal, Sparkles, 
  ShieldCheck, Map, Grid, ChevronLeft, ChevronRight, List
} from 'lucide-react';
import { getPropertiesOnce, type Property } from '@/lib/firestore';
import { PROPERTY_TYPES } from '@/constants/propertyTypes';
import PropertyCard from '@/components/PropertyCard';
import ActiveSearchCriteriaBar from '@/components/ActiveSearchCriteriaBar';
import AdvancedFiltersPanel from '@/components/AdvancedFiltersPanel';

const PropertiesMap = dynamic(() => import('@/components/PropertiesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] bg-slate-100 rounded-2xl flex items-center justify-center">
      <p className="text-slate-500">กำลังโหลดแผนที่…</p>
    </div>
  ),
});

const ITEMS_PER_PAGE = 12;

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Filters
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [subStatus, setSubStatus] = useState(searchParams.get('status') || '');
  const [listingType, setListingType] = useState<'sale' | 'rent' | ''>('');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [bathrooms, setBathrooms] = useState(searchParams.get('bathrooms') || '');
  const [areaMin, setAreaMin] = useState(searchParams.get('areaMin') || '');
  const [areaMax, setAreaMax] = useState(searchParams.get('areaMax') || '');
  
  const resultsTopRef = useRef<HTMLDivElement>(null);

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

      // Property type
      if (propertyType && p.propertyType !== propertyType && p.type !== propertyType) return false;

      // Location
      if (location) {
        const loc = typeof p.location === 'object' ? p.location : null;
        const locStr = [loc?.district, loc?.province, p.district, p.province].filter(Boolean).join(' ');
        if (!locStr.includes(location)) return false;
      }

      // Price range
      if (priceMin && p.price < parseInt(priceMin)) return false;
      if (priceMax && p.price > parseInt(priceMax)) return false;

      // Bedrooms
      if (bedrooms && p.bedrooms != null && p.bedrooms < parseInt(bedrooms)) return false;

      // Bathrooms
      if (bathrooms && p.bathrooms != null && p.bathrooms < parseInt(bathrooms)) return false;

      // Area
      if (areaMin && p.area != null && p.area < parseInt(areaMin)) return false;
      if (areaMax && p.area != null && p.area > parseInt(areaMax)) return false;

      return true;
    });
  }, [properties, debouncedQuery, propertyType, location, priceMin, priceMax, bedrooms, bathrooms, areaMin, areaMax]);

  // Properties with coordinates for map
  const mapProperties = useMemo(() => {
    return filteredProperties.filter(
      (p) => typeof p.lat === 'number' && typeof p.lng === 'number' && 
             !isNaN(p.lat) && !isNaN(p.lng)
    );
  }, [filteredProperties]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / ITEMS_PER_PAGE));
  
  // Pagination
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProperties, currentPage]);

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

  const handleRemoveFilter = (filter: { type: string }) => {
    switch (filter.type) {
      case 'keyword':
        setSearchQuery('');
        setDebouncedQuery('');
        break;
      case 'propertyType':
        setPropertyType('');
        break;
      case 'location':
        setLocation('');
        break;
      case 'propertySubStatus':
        setSubStatus('');
        break;
      case 'price':
        setPriceMin('');
        setPriceMax('');
        break;
      case 'bedrooms':
        setBedrooms('');
        break;
      case 'bathrooms':
        setBathrooms('');
        break;
      case 'area':
        setAreaMin('');
        setAreaMax('');
        break;
      case 'isRental':
        setListingType('');
        break;
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setPropertyType('');
    setLocation('');
    setSubStatus('');
    setListingType('');
    setPriceMin('');
    setPriceMax('');
    setBedrooms('');
    setBathrooms('');
    setAreaMin('');
    setAreaMax('');
    setCurrentPage(1);
  };

  const handleUpdateAdvancedFilters = (updates: Record<string, string>) => {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'priceMin': setPriceMin(value); break;
        case 'priceMax': setPriceMax(value); break;
        case 'bedrooms': setBedrooms(value); break;
        case 'bathrooms': setBathrooms(value); break;
        case 'areaMin': setAreaMin(value); break;
        case 'areaMax': setAreaMax(value); break;
      }
    });
  };

  const hasActiveFilters = debouncedQuery || propertyType || location || priceMin || priceMax || bedrooms || bathrooms || areaMin || areaMax;

  const currentFilters = {
    keyword: debouncedQuery,
    propertyType,
    location,
    propertySubStatus: subStatus,
    priceMin,
    priceMax,
    bedrooms,
    bathrooms,
    areaMin,
    areaMax,
    isRental: listingType === 'rent' ? true : listingType === 'sale' ? false : undefined,
  };

  return (
    <div className="min-h-screen bg-slate-50" ref={resultsTopRef}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 tracking-tight">
            {listingType === 'rent' ? 'ทรัพย์สินให้เช่า' : listingType === 'sale' ? 'ทรัพย์สินขาย' : 'รายการประกาศ'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            พบ <span className="font-semibold text-blue-900">{filteredProperties.length}</span> รายการ
            {totalPages > 1 && ` (หน้า ${currentPage} จาก ${totalPages})`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Box */}
        <div className="mb-6">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาทำเล, รหัสทรัพย์..."
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
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden sm:inline">ตัวกรอง</span>
            </button>
            <div className="flex-shrink-0 flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => { setViewMode('grid'); setShowMap(false); }}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => { setViewMode('map'); setShowMap(true); }}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'map' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Map className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Property Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  ประเภทอสังหาฯ
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => { setPropertyType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 bg-slate-50"
                >
                  <option value="">ทั้งหมด</option>
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt.id} value={pt.id}>{pt.label}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  พื้นที่ / ทำเล
                </label>
                <select
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 bg-slate-50"
                >
                  <option value="">ทุกทำเล</option>
                  <option value="ชลบุรี">ชลบุรี</option>
                  <option value="พานทอง">พานทอง</option>
                  <option value="บ้านบึง">บ้านบึง</option>
                  <option value="ศรีราชา">ศรีราชา</option>
                  <option value="ฉะเชิงเทรา">ฉะเชิงเทรา</option>
                  <option value="ระยอง">ระยอง</option>
                </select>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  สภาพบ้าน
                </label>
                <select
                  value={subStatus}
                  onChange={(e) => { setSubStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 bg-slate-50"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="มือ 1">มือ 1 (ใหม่)</option>
                  <option value="มือ 2">มือ 2 (พร้อมอยู่)</option>
                </select>
              </div>

              {/* ซื้อ/เช่า */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  เงื่อนไขสัญญา
                </label>
                <select
                  value={listingType}
                  onChange={(e) => { setListingType(e.target.value as '' | 'sale' | 'rent'); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 bg-slate-50"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="sale">ขายปกติ</option>
                  <option value="rent">เช่าปกติ</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            <AdvancedFiltersPanel
              filters={{ priceMin, priceMax, bedrooms, bathrooms, areaMin, areaMax }}
              onUpdateFilters={handleUpdateAdvancedFilters}
              onApply={() => setCurrentPage(1)}
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 text-sm text-blue-900 hover:underline font-medium"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        <ActiveSearchCriteriaBar
          keyword={currentFilters.keyword}
          filters={currentFilters}
          resultCount={filteredProperties.length}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={clearAllFilters}
        />

        {/* Map Section */}
        {showMap && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
            <div className="h-[320px]">
              <PropertiesMap properties={mapProperties} />
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
                <div className="w-full aspect-[4/3] bg-slate-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                  <div className="h-9 bg-slate-200 rounded-lg animate-pulse w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="mt-12 flex flex-col items-center gap-4">
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
                      ? 'bg-blue-900 text-white shadow-lg' 
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
