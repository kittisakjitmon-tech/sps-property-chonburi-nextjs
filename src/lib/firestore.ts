import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Types
export interface Property {
  id: string;
  title: string;
  slug: string;
  price: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  location: string | { subDistrict?: string; district?: string; province?: string };
  district?: string;
  province: string;
  images: string[];
  status: "available" | "sold" | "pending";
  featured?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Helper to get location string
export function getLocationString(location: Property["location"]): string {
  if (typeof location === "string") return location;
  if (!location) return "";
  const parts = [location.subDistrict, location.district, location.province].filter(Boolean);
  return parts.join(", ");
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  images: string[];
  youtubeUrl?: string;
  authorId?: string;
  authorName?: string;
  published?: boolean;
  featured?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PopularLocation {
  id: string;
  displayName: string;
  district?: string;
  province: string;
  imageUrl?: string;
  isActive?: boolean;
  order?: number;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  type: "manual" | "query";
  propertyIds?: string[];
  criteria?: Record<string, any>;
  isActive?: boolean;
  order?: number;
  isHighlighted?: boolean;
  isBlinking?: boolean;
  titleColor?: string;
}

// Helper function to convert Firestore timestamp to Date
export function toDate(timestamp?: Timestamp): Date | undefined {
  if (!timestamp) return undefined;
  return timestamp.toDate();
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function getPropertiesOnce(includeHidden = false): Promise<Property[]> {
  try {
    const propertiesRef = collection(db, "properties");
    const q = includeHidden
      ? query(propertiesRef, orderBy("createdAt", "desc"))
      : query(
          propertiesRef,
          where("status", "==", "available"),
          orderBy("createdAt", "desc")
        );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Property[];
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const docRef = doc(db, "properties", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Property;
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  try {
    const propertiesRef = collection(db, "properties");
    const q = query(propertiesRef, where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Property;
  } catch (error) {
    console.error("Error fetching property by slug:", error);
    return null;
  }
}

export async function getFeaturedProperties(limitCount = 4): Promise<Property[]> {
  try {
    const propertiesRef = collection(db, "properties");
    // Fetch available properties and filter featured in JS
    // This avoids needing a composite index for status + featured
    const q = query(
      propertiesRef,
      where("status", "==", "available"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const snapshot = await getDocs(q);
    const allProperties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Property[];
    
    // Filter featured properties in JavaScript
    return allProperties
      .filter((p) => p.featured === true)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    return [];
  }
}

// ─── Blogs ─────────────────────────────────────────────────────────────────

export async function getBlogsOnce(limitCount = 10): Promise<Blog[]> {
  try {
    const blogsRef = collection(db, "blogs");
    const q = query(
      blogsRef,
      where("published", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Blog[];
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

export async function getFeaturedBlogs(limitCount = 4): Promise<Blog[]> {
  try {
    const blogsRef = collection(db, "blogs");
    // Note: Old project uses `isFeatured` field
    const q = query(
      blogsRef,
      where("published", "==", true),
      where("isFeatured", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Blog[];
  } catch (error) {
    console.error("Error fetching featured blogs:", error);
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const blogsRef = collection(db, "blogs");
    const q = query(blogsRef, where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Blog;
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    return null;
  }
}

// ─── Popular Locations ───────────────────────────────────────────────────────

export async function getPopularLocationsOnce(): Promise<PopularLocation[]> {
  try {
    const locationsRef = collection(db, "popular_locations");
    const q = query(
      locationsRef,
      where("isActive", "==", true),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PopularLocation[];
  } catch (error) {
    console.error("Error fetching popular locations:", error);
    return [];
  }
}

// ─── Homepage Sections ────────────────────────────────────────────────────────

export async function getHomepageSectionsOnce(): Promise<HomepageSection[]> {
  try {
    const sectionsRef = collection(db, "homepage_sections");
    const q = query(
      sectionsRef,
      where("isActive", "==", true),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HomepageSection[];
  } catch (error) {
    console.error("Error fetching homepage sections:", error);
    return [];
  }
}

// ─── Hero Slides ──────────────────────────────────────────────────────────────

export interface HeroSlide {
  id: string;
  imageUrl?: string;
  image?: string;
  url?: string;
  order?: number;
  isActive?: boolean;
}

export async function getHeroSlidesOnce(): Promise<HeroSlide[]> {
  try {
    const slidesRef = collection(db, "hero_slides");
    const q = query(
      slidesRef,
      where("isActive", "==", true),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HeroSlide[];
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return [];
  }
}

// ─── Filter Helpers ───────────────────────────────────────────────────────────

export function filterPropertiesByCriteria(
  properties: Property[],
  criteria: Record<string, any>
): Property[] {
  return properties.filter((property) => {
    // Budget filter
    if (criteria.budgetMin && property.price < criteria.budgetMin) return false;
    if (criteria.budgetMax && property.price > criteria.budgetMax) return false;

    // Property type filter
    if (criteria.propertyType && property.propertyType !== criteria.propertyType)
      return false;

    // Bedrooms filter
    if (criteria.bedrooms && property.bedrooms < criteria.bedrooms) return false;

    // Location filter
    if (criteria.province && property.province !== criteria.province) return false;

    return true;
  });
}
