'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Search, X, MapPin, Home, Map, Grid, List,
  ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { Property } from '@/lib/firestore';
import { PROPERTY_TYPES } from '@/constants/propertyTypes';
import PropertyCard from '@/components/PropertyCard';
import Dropdown from '@/components/ui/Dropdown';

const PropertiesMap = dynamic(() => import('@/components/PropertiesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-100 rounded-xl flex items-center justify-center">
      <p className="text-slate-500">กำลังโหลดแผนที่…</p>
    </div>
  ),
});

const ITEMS_PER_PAGE = 12;

const QUICK_LOCATIONS = [
  { label: 'ชลบุรี', value: 'ชลบุรี' },
  { label: 'พานทอง', value: 'พานทอง' },
  { label: 'ศรีราชา', value: 'ศรีราชา' },
  { label: 'บ้านบึง', value: 'บ้านบึง' },
];

interface PropertiesClientProps {
  initialProperties: Property[];
  loading?: boolean;
}

export default function PropertiesClient({ initialProperties, loading = false }: PropertiesClientProps) {
  const searchParams = useSearchParams();
  
  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [isInitialLoad, setIsInitialLoad] = useState(loading);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<'both' | 'list' | 'map'>('both');
  const [sortBy, setSortBy] = useState('latest');
  
  // Filters
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [listingType, setListingType] = useState('');
  const [propertyCondition, setPropertyCondition] = useState('');
  const [subListingType, setSubListingType] = useState('');
  const [project, setProject] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const sp = searchParams;
    const lt = sp.get('listingType') || '';
    const pc = sp.get('propertyCondition') || '';
    const slt = sp.get('subListingType') || '';
    const proj = sp.get('project') || '';
    const loc = sp.get('location') || '';
    const pt = sp.get('propertyType') || '';
    const pr = sp.get('priceRange') || '';
    const bd = sp.get('bedrooms') || '';

    setListingType(lt);
    setPropertyCondition(pc);
    setSubListingType(slt);
    setProject(proj);
    setLocation(loc);
    setPropertyType(pt);
    setPriceRange(pr);
    setBedrooms(bd);
    setCurrentPage(1);
  }, [searchParams]);

  // If no initial properties (SSR failed), fetch client-side
  useEffect(() => {
    if (initialProperties.length === 0 && !isInitialLoad) {
      const fetchProperties = async () => {
        setIsInitialLoad(true);
        try {
          const { getPropertiesOnce } = await import('@/lib/firestore');
          const props = await getPropertiesOnce(true);
          setProperties(props);
        } catch (error) {
          console.error('Error fetching properties:', error);
        } finally {
          setIsInitialLoad(false);
        }
      };
      fetchProperties();
    }
  }, [initialProperties, isInitialLoad]);

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
      if (propertyType && p.propertyType !== propertyType && p.type !== propertyType) return false;
      if (location) {
        const loc = typeof p.location === 'object' ? p.location : null;
        const locStr = [loc?.district, loc?.province, p.district, p.province].filter(Boolean).join(' ');
        if (!locStr.includes(location)) return false;
      }
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (min && p.price < min) return false;
        if (max && p.price > max) return false;
      }
      if (bedrooms) {
        const minBeds = parseInt(bedrooms);
        if (p.bedrooms == null || p.bedrooms < minBeds) return false;
      }
      if (listingType) {
        const isRental = p.listingType === 'rent' || p.isRental;
        if (listingType === 'sale' && isRental) return false;
        if (listingType === 'rent' && !isRental) return false;
      }
      if (propertyCondition) {
        if (p.propertyCondition !== propertyCondition) return false;
      }
      if (subListingType) {
        if (p.subListingType !== subListingType) return false;
      }
      if (project) {
        const propertyProject = (p as any).project;
        if (propertyProject !== project) return false;
      }
      return true;
    });
  }, [properties, debouncedQuery, propertyType, location, priceRange, bedrooms, listingType, propertyCondition, subListingType, project]);

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
    setListingType('');
    setPropertyCondition('');
    setSubListingType('');
    setProject('');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedQuery || propertyType || location || priceRange || bedrooms || listingType || propertyCondition || subListingType || project;

  // Quick search handler
  const handleQuickLocation = (loc: string) => {
    setLocation(loc);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== HERO BANNER WITH SEARCH ===== */}
      <div 
        className="relative h-[280px] md:h-[320px] overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-900/50 to-blue-900/80" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 py-6 max-w-5xl mx-auto">
          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 text-center">
            ค้นหาบ้านในฝัน
          </h1>
          <p className="text-blue-200 text-sm md:text-base mb-4 text-center">
            พบ {filteredProperties.length} รายการในชลบุรีและพื้นที่ใกล้เคียง
          </p>
          
          {/* Search Box */}
          <div className="w-full max-w-2xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาทำเล, ชื่อโครงการ..."
                className="w-full pl-14 pr-14 py-4 rounded-2xl border-2 border-white/50 bg-white/95 backdrop-blur-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-white focus:bg-white transition-all text-base shadow-xl"
              />
              {searchQuery.length > 0 && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              )}
            </div>
            
            {/* Quick Location Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => handleQuickLocation(loc.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    location === loc.value
                      ? 'bg-white text-blue-900 shadow-lg'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 border border-white/30'
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="bg-white border-b border-slate-200 sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* ประเภทอสังหาฯ */}
            <Dropdown
              options={PROPERTY_TYPES.map((pt) => ({ value: pt.id, label: pt.label }))}
              value={propertyType}
              onChange={(val) => { setPropertyType(val); setCurrentPage(1); }}
              placeholder="ประเภท"
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
              placeholder="ทำเล"
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
              placeholder="ราคา"
            />

            {/* ห้องนอน */}
            <Dropdown
              options={[
                { value: '1', label: '1 ห้องนอน+' },
                { value: '2', label: '2 ห้องนอน+' },
                { value: '3', label: '3 ห้องนอน+' },
                { value: '4', label: '4 ห้องนอน+' },
              ]}
              value={bedrooms}
              onChange={(val) => { setBedrooms(val); setCurrentPage(1); }}
              placeholder="ห้องนอน"
            />

            {/* เพิ่มเติม */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                showAdvancedFilters 
                  ? 'border-blue-200 bg-blue-50 text-blue-700' 
                  : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700'
              }`}
            >
              เพิ่มเติม
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View Toggle - Desktop */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('both')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'both' ? 'bg-white shadow text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white shadow text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Map className="h-4 w-4" />
              </button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'sale', label: 'ซื้อ' },
                  { value: 'rent', label: 'เช่า' },
                ]}
                value={listingType}
                onChange={(val) => { setListingType(val); setCurrentPage(1); }}
                placeholder="ประเภทประกาศ"
              />
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'มือ 1', label: 'มือ 1 (ใหม่)' },
                  { value: 'มือ 2', label: 'มือ 2' },
                ]}
                value={propertyCondition}
                onChange={(val) => { setPropertyCondition(val); setCurrentPage(1); }}
                placeholder="สภาพทรัพย์"
              />
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'installment_only', label: 'ผ่อนตรงเท่านั้น' },
                ]}
                value={subListingType}
                onChange={(val) => { setSubListingType(val); setCurrentPage(1); }}
                placeholder="ผ่อนตรง"
              />
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'NPA', label: 'บ้าน NPA' },
                ]}
                value={project}
                onChange={(val) => { setProject(val); setCurrentPage(1); }}
                placeholder="โครงการพิเศษ"
              />
            </div>
          )}
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* View Mode: Both (Default) */}
        {viewMode === 'both' && (
          <div className="flex gap-6">
            {/* Property List - Left */}
            <div className="flex-1 min-w-0">
              {/* Results Count & Sort */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600 text-sm">
                  พบ <span className="font-semibold text-blue-900">{filteredProperties.length}</span> รายการ
                </p>
                <Dropdown
                  options={[
                    { value: 'latest', label: 'ล่าสุด' },
                    { value: 'price-low', label: 'ราคาต่ำ-สุด' },
                    { value: 'price-high', label: 'ราคาสูง-สุด' },
                  ]}
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="จัดเรียง"
                />
              </div>

              {/* Property Grid */}
              {isInitialLoad ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                        <div className="h-9 bg-slate-100 rounded-xl animate-pulse w-full mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginatedProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  <p className="text-slate-500 text-sm">ลองเปลี่ยนคำค้นหาหรือปรับตัวกรองใหม่</p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-4 px-6 py-2.5 rounded-xl bg-blue-900 text-white font-medium hover:bg-blue-800 transition"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {getPageNumbers().map((n) => (
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
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Map - Right Sticky */}
            <div className="hidden lg:block w-[400px] xl:w-[450px] shrink-0">
              <div className="sticky top-[140px]">
                <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 h-[calc(100vh-180px)]">
                  <PropertiesMap properties={mapProperties} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode: List Only */}
        {viewMode === 'list' && (
          <div>
            {/* Results Count & Sort */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 text-sm">
                พบ <span className="font-semibold text-blue-900">{filteredProperties.length}</span> รายการ
              </p>
              <Dropdown
                options={[
                  { value: 'latest', label: 'ล่าสุด' },
                  { value: 'price-low', label: 'ราคาต่ำ-สุด' },
                  { value: 'price-high', label: 'ราคาสูง-สุด' },
                ]}
                value={sortBy}
                onChange={setSortBy}
                placeholder="จัดเรียง"
              />
            </div>

            {/* Property Grid */}
            {isInitialLoad ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                      <div className="h-9 bg-slate-100 rounded-xl animate-pulse w-full mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">ไม่พบรายการ</h2>
                <p className="text-slate-500 text-sm">ลองเปลี่ยนคำค้นหาหรือปรับตัวกรอง</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {getPageNumbers().map((n) => (
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
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Mode: Map Only */}
        {viewMode === 'map' && (
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 h-[calc(100vh-200px)]">
            <PropertiesMap properties={mapProperties} />
          </div>
        )}

        {/* Mobile Map Toggle */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="flex items-center gap-2 px-6 py-4 rounded-full bg-blue-900 text-white font-semibold shadow-xl hover:bg-blue-800 transition-all"
          >
            {viewMode === 'map' ? (
              <>
                <List className="h-5 w-5" />
                ดูรายการ
              </>
            ) : (
              <>
                <Map className="h-5 w-5" />
                ดูแผนที่
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
