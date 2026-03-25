'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Trash2, ChevronLeft } from 'lucide-react';
import { getPropertiesOnce } from '@/lib/firestore';
import { formatPriceShort } from '@/lib/priceFormat';
import { getPropertyLabel } from '@/constants/propertyTypes';
import { getCloudinaryThumbUrl } from '@/lib/cloudinary';
import { getPropertyPath } from '@/lib/propertySlug';
import type { Property } from '@/lib/firestore';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sps_property_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Load property details for favorites
  useEffect(() => {
    const fetchFavoriteProperties = async () => {
      if (favorites.length === 0) {
        setFavoriteProperties([]);
        setLoading(false);
        return;
      }

      try {
        const allProps = await getPropertiesOnce(true);
        const favProps = allProps.filter((p) => favorites.includes(p.id));
        setFavoriteProperties(favProps);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setFavoriteProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteProperties();
  }, [favorites]);

  const removeFavorite = (propertyId: string) => {
    const updated = favorites.filter((id) => id !== propertyId);
    setFavorites(updated);
    localStorage.setItem('sps_property_favorites', JSON.stringify(updated));
  };

  const clearAll = () => {
    setFavorites([]);
    localStorage.setItem('sps_property_favorites', JSON.stringify([]));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                <Heart className="h-7 w-7 text-red-500" />
                รายการโปรด
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {favoriteProperties.length} รายการ
              </p>
            </div>
            {favoriteProperties.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex gap-4 animate-pulse">
                <div className="w-32 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : favoriteProperties.length > 0 ? (
          <div className="space-y-4">
            {favoriteProperties.map((property) => {
              const loc = typeof property.location === 'object' ? property.location : null;
              const locationStr = loc?.district || property.district || '';
              const isRental = property.isRental || property.listingType === 'rent';
              const typeLabel = getPropertyLabel(property.type || property.propertyType || '');
              const coverImage = property.coverImageUrl || property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200';

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <Link href={getPropertyPath(property)} className="shrink-0">
                    <div className="w-32 h-24 rounded-lg overflow-hidden">
                      <img
                        src={getCloudinaryThumbUrl(coverImage) || coverImage}
                        alt={typeLabel}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link href={getPropertyPath(property)} className="block">
                      <h3 className="font-semibold text-gray-900 truncate hover:text-blue-900">
                        {typeLabel}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {locationStr || '—'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        🛏 {property.bedrooms ?? '-'} • 🚿 {property.bathrooms ?? '-'}
                      </p>
                    </Link>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <p className="font-bold text-orange-600">
                      {formatPriceShort(property.price, isRental)}
                    </p>
                    <button
                      onClick={() => removeFavorite(property.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="ลบออกจากรายการโปรด"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีรายการโปรด</h2>
            <p className="text-gray-500 mb-6">เริ่มต้นเพิ่มทรัพย์ที่สนใจลงในรายการโปรด</p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
            >
              <ChevronLeft className="h-5 w-5" />
              ดูรายการทรัพย์สิน
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
