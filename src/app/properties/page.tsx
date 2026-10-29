import { Suspense } from 'react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { getPropertiesOnce, type Property } from '@/lib/firestore';
import { filterPropertiesForSeo, getPropertySearchIntent } from '@/lib/searchIntent';
import { getPropertyPath } from '@/lib/propertySlug';
import { absoluteUrl } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import PropertiesClient from './PropertiesClient';

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

function toUrlSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value) params.set(key, value);
  });
  return params;
}

export async function generateMetadata({ searchParams }: { searchParams: PageSearchParams }): Promise<Metadata> {
  const intent = getPropertySearchIntent(toUrlSearchParams(await searchParams));
  return {
    title: intent.title,
    description: intent.description,
    alternates: { canonical: intent.canonicalPath },
    robots: { index: intent.indexable, follow: true },
    openGraph: {
      title: intent.title,
      description: intent.description,
      url: intent.canonicalPath,
      type: 'website',
    },
    twitter: { title: intent.title, description: intent.description },
  };
}

export default async function PropertiesPage({ searchParams }: { searchParams: PageSearchParams }) {
  const intent = getPropertySearchIntent(toUrlSearchParams(await searchParams));
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

  const filteredProperties = filterPropertiesForSeo(properties, intent.filters);
  const pageUrl = absoluteUrl(intent.canonicalPath);
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      '@id': `${pageUrl}#search`,
      url: pageUrl,
      name: intent.title,
      description: intent.description,
      inLanguage: 'th',
      mainEntity: { '@id': `${pageUrl}#list` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${pageUrl}#list`,
      numberOfItems: filteredProperties.length,
      itemListElement: filteredProperties.slice(0, 24).map((property, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(getPropertyPath(property)),
        name: property.title || 'อสังหาริมทรัพย์',
        image: property.coverImageUrl || property.images?.[0],
      })),
    },
  ];

  return (
    <>
      {intent.indexable && <JsonLd data={structuredData} />}
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
    </>
  );
}
