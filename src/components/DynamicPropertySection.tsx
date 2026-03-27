import PropertyCardCompact from './PropertyCardCompact';
import type { Property, HomepageSection } from "@/lib/firestore";
import { filterPropertiesByCriteria } from "@/lib/firestore";

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
      .slice(0, 6) as Property[];
  } else if (section.type === "query" && section.criteria) {
    // Query-based: filter properties by criteria
    const filtered = filterPropertiesByCriteria(properties, section.criteria);
    sectionProperties = filtered.slice(0, 6);
  }

  if (sectionProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            {section.subtitle && (
              <p className="text-slate-500 text-xs mt-0.5">{section.subtitle}</p>
            )}
          </div>
          <a
            href="/properties"
            className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            ดูทั้งหมด →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {sectionProperties.map((property) => (
            <PropertyCardCompact key={property.id} property={property} />
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
