'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Home as HomeIcon, TrendingDown, Sparkles } from 'lucide-react';
import PropertyCardCompact from './PropertyCardCompact';
import type { Property } from '@/lib/firestore';

interface PropertyTabsSectionProps {
  initialProperties: Property[];
  totalCount: number;
}

type TabId = 'all' | 'price' | 'new';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'ทั้งหมด', icon: HomeIcon },
  { id: 'price', label: 'ราคาดี', icon: TrendingDown },
  { id: 'new', label: 'ใหม่', icon: Sparkles },
];


export default function PropertyTabsSection({ initialProperties, totalCount }: PropertyTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const filteredProperties = useMemo(() => {
    let filtered = [...initialProperties];

    switch (activeTab) {
      case 'price':
        // Sort by price (lowest first), filter out undefined prices
        filtered = filtered
          .filter(p => p.price != null)
          .sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'new':
        // Sort by createdAt (newest first), no time limit
        filtered = filtered
          .filter(p => p.createdAt)
          .sort((a, b) => {
            const aTime = typeof a.createdAt === 'number'
              ? a.createdAt
              : (a.createdAt as any)?.toMillis?.() || 0;
            const bTime = typeof b.createdAt === 'number'
              ? b.createdAt
              : (b.createdAt as any)?.toMillis?.() || 0;
            return bTime - aTime;
          });
        break;
      default:
        // 'all' - keep original order
        break;
    }

    return filtered;
  }, [initialProperties, activeTab]);

  // Get count for each tab
  const tabCounts = useMemo(() => ({
    all: initialProperties.length,
    price: initialProperties.filter(p => p.price != null).length,
    new: initialProperties.filter(p => p.createdAt).length,
  }), [initialProperties]);

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Section Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-slate-900">ทรัพย์แนะนำ</h2>
          </div>

          {/* Tab Navigation - Visible on all screens with horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-1/3 items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shrink-0 min-h-[44px] ${activeTab === tab.id
                  ? 'bg-blue-900 text-white font-semibold shadow-md'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-white/70'
                  }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-600'
                  }`}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid - Consistent Sizing */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredProperties.length > 0 ? (
            filteredProperties.slice(0, 12).map((property) => (
              <PropertyCardCompact
                key={property.id}
                property={property}
                isNew={activeTab === 'new'}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-base font-medium">ไม่พบทรัพย์ในหมวดนี้</p>
              <p className="text-sm text-slate-400 mt-1">ลองเลือกหมวดอื่นดูนะ</p>
            </div>
          )}
        </div>

        {/* Load More */}
        <div className="mt-6 text-center">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 hover:shadow-lg transition-all duration-200 min-h-[48px]"
          >
            ดูทรัพย์ทั้งหมด ({totalCount}+)
          </Link>
        </div>
      </div>
    </section>
  );
}
