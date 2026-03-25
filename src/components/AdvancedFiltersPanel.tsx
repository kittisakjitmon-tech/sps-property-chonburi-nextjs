'use client';

import { useState } from 'react';
import { ChevronDown, DollarSign, Bed, Bath, Maximize2, X } from 'lucide-react';

interface AdvancedFiltersPanelProps {
  filters: {
    priceMin?: string;
    priceMax?: string;
    bedrooms?: string;
    bathrooms?: string;
    areaMin?: string;
    areaMax?: string;
  };
  onUpdateFilters: (filters: Record<string, string>) => void;
  onApply: () => void;
}

export default function AdvancedFiltersPanel({
  filters,
  onUpdateFilters,
  onApply,
}: AdvancedFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApplyFilters = () => {
    onApply();
    setIsExpanded(false);
  };

  const handleClearAdvancedFilters = () => {
    onUpdateFilters({
      priceMin: '',
      priceMax: '',
      bedrooms: '',
      bathrooms: '',
      areaMin: '',
      areaMax: '',
    });
  };

  const activeCount = [
    filters.priceMin,
    filters.priceMax,
    filters.bedrooms,
    filters.bathrooms,
    filters.areaMin,
    filters.areaMax,
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-5 py-3 rounded-xl border-2 transition-all duration-200 ${
          isExpanded
            ? 'bg-blue-50 border-blue-500 text-blue-900'
            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">ตัวกรองเพิ่มเติม</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable Panel */}
      {isExpanded && (
        <div className="mt-3 p-6 bg-white border-2 border-blue-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-6">
            {/* ราคา */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <div className="p-1.5 rounded-lg bg-green-100 text-green-700">
                  <DollarSign className="h-4 w-4" />
                </div>
                ราคา (บาท)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="ราคาต่ำสุด"
                  value={filters.priceMin || ''}
                  onChange={(e) => onUpdateFilters({ priceMin: e.target.value })}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="ราคาสูงสุด"
                  value={filters.priceMax || ''}
                  onChange={(e) => onUpdateFilters({ priceMax: e.target.value })}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* พื้นที่ */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <Maximize2 className="h-4 w-4" />
                </div>
                พื้นที่ (ตร.ว.)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="พื้นที่ขั้นต่ำ"
                  value={filters.areaMin || ''}
                  onChange={(e) => onUpdateFilters({ areaMin: e.target.value })}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="พื้นที่สูงสุด"
                  value={filters.areaMax || ''}
                  onChange={(e) => onUpdateFilters({ areaMax: e.target.value })}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* ห้องนอน */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <Bed className="h-4 w-4" />
                </div>
                จำนวนห้องนอน
              </label>
              <div className="flex flex-wrap gap-2">
                {['', '1', '2', '3', '4', '5'].map((val) => (
                  <button
                    key={val || 'any'}
                    type="button"
                    onClick={() => onUpdateFilters({ bedrooms: val })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filters.bedrooms === val
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val === '' ? 'ทั้งหมด' : `${val}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* ห้องน้ำ */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700">
                  <Bath className="h-4 w-4" />
                </div>
                จำนวนห้องน้ำ
              </label>
              <div className="flex flex-wrap gap-2">
                {['', '1', '2', '3', '4'].map((val) => (
                  <button
                    key={val || 'any'}
                    type="button"
                    onClick={() => onUpdateFilters({ bathrooms: val })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filters.bathrooms === val
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val === '' ? 'ทั้งหมด' : `${val}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearAdvancedFilters}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                <X className="h-4 w-4" />
                ล้างตัวกรอง
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-colors"
              >
                ค้นหา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
