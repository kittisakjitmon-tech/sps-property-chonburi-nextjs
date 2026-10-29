'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, X, Map, Grid, List, ChevronDown } from 'lucide-react';
import type { Property } from '@/lib/firestore';
import { PROPERTY_TYPES } from '@/constants/propertyTypes';
import { getPropertySearchIntent } from '@/lib/searchIntent';
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

const ITEMS_PER_PAGE = 24;
const LOAD_MORE_INCREMENT = 12;

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

type ViewMode = 'both' | 'list' | 'map';

const readPriceRange = (params: { get: (name: string) => string | null }) => {
  const current = params.get('priceRange');
  if (current) return current;
  const min = params.get('priceMin') || '';
  const max = params.get('priceMax') || '';
  return min || max ? `${min}-${max}` : '';
};

const readViewMode = (value: string | null): ViewMode =>
  value === 'list' || value === 'map' ? value : 'both';

export default function PropertiesClient({ initialProperties, loading = false }: PropertiesClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const lastUrlQueryRef = useRef(searchParams.get('q') || '');

  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [isInitialLoad, setIsInitialLoad] = useState(loading);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode(searchParams.get('view')));
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);

  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState(readPriceRange(searchParams));
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [listingType, setListingType] = useState(searchParams.get('listingType') || '');
  const [propertyCondition, setPropertyCondition] = useState(searchParams.get('propertyCondition') || '');
  const [subListingType, setSubListingType] = useState(searchParams.get('subListingType') || '');
  const [project, setProject] = useState(searchParams.get('project') || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete('priceMin');
    params.delete('priceMax');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    if (query !== lastUrlQueryRef.current) {
      setSearchQuery(query);
      setDebouncedQuery(query);
      lastUrlQueryRef.current = query;
    }
    setListingType(searchParams.get('listingType') || '');
    setPropertyCondition(searchParams.get('propertyCondition') || '');
    setSubListingType(searchParams.get('subListingType') || '');
    setProject(searchParams.get('project') || '');
    setLocation(searchParams.get('location') || '');
    setPropertyType(searchParams.get('propertyType') || '');
    setPriceRange(readPriceRange(searchParams));
    setBedrooms(searchParams.get('bedrooms') || '');
    setSortBy(searchParams.get('sort') || 'latest');
    setViewMode(readViewMode(searchParams.get('view')));
    setDisplayedCount(ITEMS_PER_PAGE);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const currentQuery = searchParams.get('q') || '';
    if (debouncedQuery !== currentQuery && debouncedQuery !== lastUrlQueryRef.current) {
      updateUrl({ q: debouncedQuery });
    }
  }, [debouncedQuery, searchParams, updateUrl]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        const loc = typeof p.location === 'object' ? p.location : null;
        const searchable = [
          p.title,
          typeof p.location === 'string' ? p.location : '',
          loc?.subDistrict,
          loc?.district,
          loc?.province,
          p.district,
          p.province,
          p.propertyType,
          p.type,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      if (propertyType && p.propertyType !== propertyType && p.type !== propertyType) return false;
      if (location) {
        const loc = typeof p.location === 'object' ? p.location : null;
        const locStr = [typeof p.location === 'string' ? p.location : '', loc?.subDistrict, loc?.district, loc?.province, p.district, p.province].filter(Boolean).join(' ');
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
        const propertyProject = (p as Property & { project?: string }).project;
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

  const paginatedProperties = useMemo(() => {
    return sortedProperties.slice(0, displayedCount);
  }, [sortedProperties, displayedCount]);

  const hasMore = sortedProperties.length > displayedCount;
  const showingFrom = sortedProperties.length > 0 ? 1 : 0;
  const showingTo = Math.min(displayedCount, sortedProperties.length);

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + LOAD_MORE_INCREMENT);
    window.scrollTo({ top: window.scrollY + 300, behavior: 'smooth' });
  };

  const changeFilter = (key: string, value: string, setter: (value: string) => void) => {
    setter(value);
    setDisplayedCount(ITEMS_PER_PAGE);
    updateUrl({ [key]: value });
  };

  const clearAllFilters = () => {
    lastUrlQueryRef.current = '';
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
    setDisplayedCount(ITEMS_PER_PAGE);
    updateUrl({
      q: '', propertyType: '', location: '', priceRange: '', bedrooms: '',
      listingType: '', propertyCondition: '', subListingType: '', project: '',
    });
  };

  const searchIntent = useMemo(
    () => getPropertySearchIntent(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const hasActiveFilters = debouncedQuery || propertyType || location || priceRange || bedrooms || listingType || propertyCondition || subListingType || project;

  const handleQuickLocation = (loc: string) => {
    changeFilter('location', location === loc ? '' : loc, setLocation);
  };

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    updateUrl({ view: mode === 'both' ? '' : mode });
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    updateUrl({ sort: value === 'latest' ? '' : value });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className="relative h-[280px] sm:h-[300px] md:h-[320px] overflow-hidden"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-900/50 to-blue-900/80" />
        <div className="relative h-full flex flex-col items-center justify-center px-4 py-4 max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 text-center">{searchIntent.title}</h1>
          <p className="text-blue-100 text-sm md:text-base mb-3 text-center" aria-live="polite">พบ {filteredProperties.length} รายการตามเงื่อนไขที่เลือก</p>
          <div className="w-full max-w-2xl">
            <div className="relative">
              <label htmlFor="properties-search" className="sr-only">ค้นหาทำเลหรือชื่อโครงการ</label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" aria-hidden="true" />
              <input
                id="properties-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ทำเลหรือชื่อโครงการ"
                className="w-full min-h-[52px] pl-12 pr-12 py-3 rounded-2xl border-2 border-white/50 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-300 transition-all text-base shadow-xl"
              />
              {searchQuery.length > 0 && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label="ล้างคำค้นหา" className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                  <X className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2" aria-label="กรองตามทำเลยอดนิยม">
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  aria-pressed={location === loc.value}
                  onClick={() => handleQuickLocation(loc.value)}
                  className={`min-h-[44px] px-4 rounded-full text-sm font-medium transition-all ${location === loc.value ? 'bg-white text-blue-900 shadow-lg' : 'bg-white/20 text-white hover:bg-white/40 border border-white/30'}`}
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
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
          <div className="flex sm:hidden items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowMobileFilters((open) => !open)}
              aria-expanded={showMobileFilters}
              aria-controls="property-filter-options"
              className="min-h-[44px] flex items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ตัวกรอง{hasActiveFilters ? <span className="w-2 h-2 rounded-full bg-blue-600" aria-label="มีตัวกรองที่เลือก" /> : null}
              <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {hasActiveFilters && <button type="button" onClick={clearAllFilters} className="min-h-[44px] px-3 text-sm text-red-600">ล้างตัวกรอง</button>}
          </div>
          <div id="property-filter-options" className={`${showMobileFilters ? 'grid' : 'hidden'} grid-cols-2 gap-2 pt-2 sm:pt-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3`}>
            {/* ประเภทอสังหาฯ */}
            <Dropdown
              options={PROPERTY_TYPES.map((pt) => ({ value: pt.id, label: pt.label }))}
              value={propertyType}
              onChange={(val) => changeFilter('propertyType', val, setPropertyType)}
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
              onChange={(val) => changeFilter('location', val, setLocation)}
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
              onChange={(val) => changeFilter('priceRange', val, setPriceRange)}
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
              onChange={(val) => changeFilter('bedrooms', val, setBedrooms)}
              placeholder="ห้องนอน"
            />

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              aria-expanded={showAdvancedFilters}
              aria-controls="advanced-filter-options"
              className={`col-span-2 sm:col-span-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${showAdvancedFilters ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}
            >
              เพิ่มเติม<ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div className="hidden sm:block flex-1" />
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 rounded-xl p-1" role="group" aria-label="รูปแบบการแสดงผล">
              <button type="button" onClick={() => handleViewMode('list')} aria-label="แสดงเฉพาะรายการ" aria-pressed={viewMode === 'list'} className={`min-w-[44px] min-h-[44px] p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}><List className="h-4 w-4 mx-auto" aria-hidden="true" /></button>
              <button type="button" onClick={() => handleViewMode('both')} aria-label="แสดงรายการและแผนที่" aria-pressed={viewMode === 'both'} className={`min-w-[44px] min-h-[44px] p-2 rounded-lg transition-all ${viewMode === 'both' ? 'bg-white shadow text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}><Grid className="h-4 w-4 mx-auto" aria-hidden="true" /></button>
              <button type="button" onClick={() => handleViewMode('map')} aria-label="แสดงเฉพาะแผนที่" aria-pressed={viewMode === 'map'} className={`min-w-[44px] min-h-[44px] p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white shadow text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}><Map className="h-4 w-4 mx-auto" aria-hidden="true" /></button>
            </div>
            {hasActiveFilters && <button type="button" onClick={clearAllFilters} className="hidden sm:block min-h-[44px] px-2 text-sm text-red-600 hover:text-red-700 hover:underline">ล้าง</button>}
          </div>

          {showAdvancedFilters && (
            <div id="advanced-filter-options" className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-3 pt-3 border-t border-slate-100">
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'sale', label: 'ซื้อ' },
                  { value: 'rent', label: 'เช่า' },
                ]}
                value={listingType}
                onChange={(val) => changeFilter('listingType', val, setListingType)}
                placeholder="ประเภทประกาศ"
              />
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'มือ 1', label: 'มือ 1 (ใหม่)' },
                  { value: 'มือ 2', label: 'มือ 2' },
                ]}
                value={propertyCondition}
                onChange={(val) => changeFilter('propertyCondition', val, setPropertyCondition)}
                placeholder="สภาพทรัพย์"
              />
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'installment_only', label: 'ผ่อนตรงเท่านั้น' },
                ]}
                value={subListingType}
                onChange={(val) => changeFilter('subListingType', val, setSubListingType)}
                placeholder="ผ่อนตรง"
              />
              <Dropdown
                options={[
                  { value: '', label: 'ทั้งหมด' },
                  { value: 'NPA', label: 'บ้าน NPA' },
                ]}
                value={project}
                onChange={(val) => changeFilter('project', val, setProject)}
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
                  <span className="text-slate-400 mx-1">|</span>
                  <span className="text-slate-500">แสดง {showingFrom}-{showingTo}</span>
                </p>
                <Dropdown
                  options={[
                    { value: 'latest', label: 'ล่าสุด' },
                    { value: 'price-low', label: 'ราคาต่ำ-สุด' },
                    { value: 'price-high', label: 'ราคาสูง-สุด' },
                  ]}
                  value={sortBy}
                  onChange={handleSort}
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

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    onClick={handleLoadMore}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    แสดงทรัพย์เพิ่มเติม ({LOAD_MORE_INCREMENT} รายการ)
                  </button>
                  <p className="text-slate-400 text-xs">
                    แสดง {showingTo} จาก {sortedProperties.length} รายการ
                  </p>
                </div>
              )}
              {!hasMore && sortedProperties.length > ITEMS_PER_PAGE && (
                <p className="mt-6 text-center text-slate-400 text-sm">
                  — แสดงทั้งหมด {sortedProperties.length} รายการ —
                </p>
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
                <span className="text-slate-400 mx-1">|</span>
                <span className="text-slate-500">แสดง {showingFrom}-{showingTo}</span>
              </p>
              <Dropdown
                options={[
                  { value: 'latest', label: 'ล่าสุด' },
                  { value: 'price-low', label: 'ราคาต่ำ-สุด' },
                  { value: 'price-high', label: 'ราคาสูง-สุด' },
                ]}
                value={sortBy}
                onChange={handleSort}
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

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={handleLoadMore}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  แสดงทรัพย์เพิ่มเติม ({LOAD_MORE_INCREMENT} รายการ)
                </button>
                <p className="text-slate-400 text-xs">
                  แสดง {showingTo} จาก {sortedProperties.length} รายการ
                </p>
              </div>
            )}
            {!hasMore && sortedProperties.length > ITEMS_PER_PAGE && (
              <p className="mt-6 text-center text-slate-400 text-sm">
                — แสดงทั้งหมด {sortedProperties.length} รายการ —
              </p>
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
            type="button"
            onClick={() => handleViewMode(viewMode === 'map' ? 'list' : 'map')}
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
