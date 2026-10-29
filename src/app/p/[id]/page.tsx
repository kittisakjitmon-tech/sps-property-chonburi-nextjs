import { notFound, permanentRedirect } from 'next/navigation';
import { getPropertyById } from '@/lib/firestore';
import { getPropertyPath } from '@/lib/propertySlug';

export const dynamic = 'force-dynamic';

interface ShortPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShortPropertyPage({ params }: ShortPropertyPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();
  permanentRedirect(encodeURI(getPropertyPath(property)));
}
