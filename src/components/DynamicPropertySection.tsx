import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import type { Property, HomepageSection } from "@/lib/firestore";
import { filterPropertiesByCriteria, getLocationString } from "@/lib/firestore";

interface DynamicPropertySectionProps {
  section: HomepageSection;
  properties: Property[];
}

export function DynamicPropertySection({ section, properties }: DynamicPropertySectionProps) {
  // Resolve properties for this section
  let sectionProperties: Property[] = [];
  
  if (section.type === "manual" && section.propertyIds?.length) {
    // Manual selection: get properties by IDs
    sectionProperties = section.propertyIds
      .map((id) => properties.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 4) as Property[];
  } else if (section.type === "query" && section.criteria) {
    // Query-based: filter properties by criteria
    const filtered = filterPropertiesByCriteria(properties, section.criteria);
    sectionProperties = filtered.slice(0, 4);
  }

  if (sectionProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
            {section.subtitle && (
              <p className="text-slate-500 text-sm mt-1">{section.subtitle}</p>
            )}
          </div>
          <Link
            href="/properties"
            className="text-blue-900 font-medium hover:underline flex items-center gap-1"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectionProperties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.slug || property.id}`}
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-video bg-slate-100">
                {property.images?.[0] ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <Building2 className="h-12 w-12 text-blue-300" />
                  </div>
                )}
                {property.propertyType && (
                  <div className="absolute top-3 right-3 bg-blue-900 text-white text-xs font-semibold px-2 py-1 rounded">
                    {property.propertyType}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-900 transition-colors">
                  {property.title}
                </h3>
                <p className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {getLocationString(property.location)}, {property.province}
                </p>
                <p className="text-xl font-bold text-blue-900">
                  ฿{property.price?.toLocaleString?.() || property.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

interface DynamicSectionsProps {
  sections: HomepageSection[];
  properties: Property[];
}

export function DynamicSections({ sections, properties }: DynamicSectionsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <>
      {sections.map((section) => (
        <DynamicPropertySection
          key={section.id}
          section={section}
          properties={properties}
        />
      ))}
    </>
  );
}