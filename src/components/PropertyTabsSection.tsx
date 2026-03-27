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
  { id: 'new', label: '🏠 ใหม่', icon: Sparkles },
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

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header with Tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-slate-900">ทรัพย์แนะนำ</h2>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid - Dense Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {filteredProperties.length > 0 ? (
            filteredProperties.slice(0, 12).map((property) => (
              <PropertyCardCompact 
                key={property.id} 
                property={property} 
                isNew={activeTab === 'new'}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-500">
              ไม่พบทรัพย์ในหมวดนี้
            </div>
          )}
        </div>

        {/* Load More */}
        <div className="mt-4 text-center">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            ดูทรัพย์ทั้งหมด ({totalCount}+)
          </Link>
        </div>
      </div>
    </section>
  );
}
