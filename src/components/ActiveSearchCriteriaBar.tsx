'use client';

import { X } from 'lucide-react';
import { getPropertyLabel } from '@/constants/propertyTypes';

interface ActiveSearchCriteriaBarProps {
  keyword?: string;
  filters?: {
    tag?: string;
    isRental?: boolean;
    propertySubStatus?: string;
    feature?: string;
    project?: string;
    propertyType?: string;
    location?: string;
    priceMin?: string;
    priceMax?: string;
    bedrooms?: string;
    bathrooms?: string;
    areaMin?: string;
    areaMax?: string;
  };
  resultCount?: number;
  onRemoveFilter: (filter: { type: string }) => void;
  onClearAll: () => void;
}

interface FilterChip {
  type: string;
  label: string;
  value: string | { min?: string; max?: string };
  highlight?: boolean;
  npaHighlight?: boolean;
}

export default function ActiveSearchCriteriaBar({
  keyword = '',
  filters = {},
  resultCount = 0,
  onRemoveFilter,
  onClearAll,
}: ActiveSearchCriteriaBarProps) {
  const activeFilters: FilterChip[] = [];

  // 1. Keyword
  if (keyword && keyword.trim()) {
    activeFilters.push({
      type: 'keyword',
      label: `🔍 ${keyword}`,
      value: keyword,
    });
  }

  // 2. Tag (จาก homepage section)
  if (filters.tag && filters.tag.trim()) {
    activeFilters.push({
      type: 'tag',
      label: `🏷️ ${filters.tag}`,
      value: filters.tag,
      highlight: true,
    });
  }

  // 3. ประเภท (ซื้อ/เช่า)
  if (filters.isRental === true) {
    activeFilters.push({
      type: 'isRental',
      label: 'เช่า',
      value: 'rent',
    });
  } else if (filters.isRental === false) {
    activeFilters.push({
      type: 'isRental',
      label: 'ซื้อ',
      value: 'buy',
    });
  }

  // 4. สถานะ (มือ 1/มือ 2)
  if (filters.propertySubStatus) {
    activeFilters.push({
      type: 'propertySubStatus',
      label: filters.propertySubStatus,
      value: filters.propertySubStatus,
    });
  }

  // 5. คุณสมบัติพิเศษ (ผ่อนตรง)
  if (filters.feature === 'directInstallment') {
    activeFilters.push({
      type: 'feature',
      label: '🏠 ผ่อนตรง',
      value: 'directInstallment',
      highlight: true,
    });
  }

  // 6. โครงการ (NPA etc.)
  if (filters.project && filters.project.trim()) {
    activeFilters.push({
      type: 'project',
      label: `🏢 โครงการ: ${filters.project}`,
      value: filters.project,
      npaHighlight: true,
    });
  }

  if (filters.propertyType) {
    activeFilters.push({
      type: 'propertyType',
      label: getPropertyLabel(filters.propertyType),
      value: filters.propertyType,
    });
  }

  // 7. ทำเล
  if (filters.location) {
    activeFilters.push({
      type: 'location',
      label: `📍 ${filters.location}`,
      value: filters.location,
    });
  }

  // 8. ราคา
  if (filters.priceMin || filters.priceMax) {
    const formatPriceValue = (price: string) => {
      if (!price) return '';
      const num = Number(price);
      if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
      }
      return num.toLocaleString('th-TH');
    };
    const min = filters.priceMin ? formatPriceValue(filters.priceMin) : '';
    const max = filters.priceMax ? formatPriceValue(filters.priceMax) : '';
    const priceLabel = min && max ? `${min} - ${max}` : min || max;
    activeFilters.push({
      type: 'price',
      label: `💰 ${priceLabel}`,
      value: { min: filters.priceMin, max: filters.priceMax },
    });
  }

  // 9. ห้องนอน
  if (filters.bedrooms) {
    activeFilters.push({
      type: 'bedrooms',
      label: `🛏️ ${filters.bedrooms === '5' ? '5+' : filters.bedrooms} ห้อง`,
      value: filters.bedrooms,
    });
  }

  // 10. ห้องน้ำ
  if (filters.bathrooms) {
    activeFilters.push({
      type: 'bathrooms',
      label: `🚿 ${filters.bathrooms === '4' ? '4+' : filters.bathrooms} ห้อง`,
      value: filters.bathrooms,
    });
  }

  // 11. พื้นที่
  if (filters.areaMin || filters.areaMax) {
    const formatArea = (area: string) => {
      if (!area) return '';
      return `${Number(area).toLocaleString('th-TH')} ตร.ม.`;
    };
    const min = filters.areaMin ? formatArea(filters.areaMin) : '';
    const max = filters.areaMax ? formatArea(filters.areaMax) : '';
    const areaLabel = min && max ? `${min} - ${max}` : min || max;
    activeFilters.push({
      type: 'area',
      label: `📐 ${areaLabel}`,
      value: { min: filters.areaMin, max: filters.areaMax },
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm font-medium text-slate-500">
          {resultCount > 0 ? (
            <>แสดงผลลัพธ์ที่ตรงกับ:</>
          ) : (
            <>ไม่มีตัวกรองที่ใช้งานอยู่</>
          )}
        </span>
        {activeFilters.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline ml-auto"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter, idx) => (
          <button
            key={`${filter.type}-${idx}`}
            onClick={() => onRemoveFilter({ type: filter.type })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter.highlight
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : filter.npaHighlight
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <span>{filter.label}</span>
            <X className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
