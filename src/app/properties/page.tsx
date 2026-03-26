import { Suspense } from 'react';
import { getPropertiesOnce, type Property } from '@/lib/firestore';
import PropertiesClient from './PropertiesClient';

export default async function PropertiesPage() {
  let properties: Property[] = [];
  let loading = true;
  
  try {
    properties = await getPropertiesOnce(true);
  } catch (error) {
    console.error('Error fetching properties:', error);
    properties = [];
  } finally {
    loading = false;
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PropertiesClient initialProperties={properties} loading={loading} />
    </Suspense>
  );
}
