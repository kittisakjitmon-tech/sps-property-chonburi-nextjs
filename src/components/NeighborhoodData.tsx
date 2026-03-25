'use client';

import { useState, useEffect } from 'react';
import { Factory, ShoppingBag, Hospital, GraduationCap, MapPin, Car } from 'lucide-react';

interface NeighborhoodDataProps {
  property?: any;
}

const TYPE_ICONS: Record<string, any> = {
  hospital: Hospital,
  education: GraduationCap,
  mall: ShoppingBag,
  industrial: Factory,
};

const TYPE_ORDER = ['industrial', 'mall', 'hospital', 'education'];

const TYPE_TITLES: Record<string, string> = {
  industrial: 'นิคมอุตสาหกรรม',
  mall: 'ห้างสรรพสินค้า',
  hospital: 'โรงพยาบาล',
  education: 'การศึกษา',
};

export default function NeighborhoodData({ property }: NeighborhoodDataProps) {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loc = typeof property?.location === 'object' ? property.location : {};
  const hasMapUrl = !!(property?.mapUrl);
  const hasCoords = !!(loc?.lat && loc?.lng);

  useEffect(() => {
    // Use nearbyPlaces from property if available
    if (property?.nearbyPlaces && Array.isArray(property.nearbyPlaces) && property.nearbyPlaces.length > 0) {
      setPlaces(property.nearbyPlaces);
      return;
    }
    // For now, use mock data or empty
    setPlaces([]);
  }, [property?.nearbyPlaces]);

  const groupedPlaces = places.reduce((groups: Record<string, any[]>, place: any) => {
    const type = place.type === 'shopping' ? 'mall' : place.type === 'school' ? 'education' : place.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push({ ...place, type });
    return groups;
  }, { industrial: [], mall: [], hospital: [], education: [] });

  // Fallback: No map
  if (!hasMapUrl) {
    return (
      <div className="bg-slate-100 rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">สถานที่สำคัญใกล้เคียง</h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <MapPin className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">ยังไม่มี Map</p>
          <p className="text-xs mt-1">ข้อมูลสถานที่สำคัญจะปรากฏขึ้นเมื่อระบุพิกัดแผนที่</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-blue-900 mb-4">สถานที่สำคัญใกล้เคียง</h3>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-sm">กำลังค้นหาสถานที่ใกล้เคียง…</p>
        </div>
      ) : error ? (
        <div className="py-6 text-center text-slate-500 text-sm">{error}</div>
      ) : !hasCoords ? (
        <div className="py-6 text-center text-slate-500 text-sm">
          ข้อมูลสถานที่สำคัญจะปรากฏขึ้นเมื่อระบุพิกัดแผนที่
        </div>
      ) : places.length > 0 ? (
        <div className="space-y-4">
          {TYPE_ORDER.filter((type) => groupedPlaces[type]?.length > 0).map((type) => {
            const Icon = TYPE_ICONS[type] || MapPin;
            return (
              <div key={type} className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-blue-900" />
                  </div>
                  <h4 className="font-semibold text-blue-900">{TYPE_TITLES[type]}</h4>
                </div>
                <div className="space-y-2">
                  {groupedPlaces[type].map((place: any, index: number) => (
                    <div key={`${place.name}-${index}`} className="rounded-lg bg-white border border-slate-100 p-3">
                      <p className="text-sm font-medium text-slate-800">
                        {place.name} - {place.distanceText || 'ตรวจสอบจากแผนที่'} ({place.durationText || 'ตรวจสอบจากแผนที่'})
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Car className="h-3.5 w-3.5" />
                        <span>โหมดขับรถ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-slate-500 text-sm">
          ข้อมูลสถานที่สำคัญจะปรากฏขึ้นเมื่อระบุพิกัดแผนที่
        </div>
      )}
    </div>
  );
}
