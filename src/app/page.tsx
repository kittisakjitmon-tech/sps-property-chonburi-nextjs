import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import Link from "next/link";
import {
  Building2,
  Award,
  Users,
  Clock,
  MapPin,
  MessageCircle,
  Home as HomeIcon,
  Wallet,
  BadgeCheck,
  Zap,
  Trophy,
  CheckCircle2,
  Lightbulb,
  Handshake,
  TrendingUp,
  Flame,
  Star,
  Clock3,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import {
  getPropertiesOnce,
  getFeaturedProperties,
  getFeaturedBlogs,
  getPopularLocationsOnce,
  getHomepageSectionsOnce,
  getLocationString,
  type Property,
  type Blog,
  type PopularLocation,
  type HomepageSection,
} from "@/lib/firestore";
import { generateBlogSlug } from "@/lib/blogSlug";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import HomeSearch from "@/components/HomeSearch";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyCardCompact from "@/components/PropertyCardCompact";
import PropertyTabsSection from "@/components/PropertyTabsSection";

// Metadata for SEO
export const metadata: Metadata = {
  title: "SPS Property Solution | บ้านคอนโดสวย อมตะซิตี้ ชลบุรี",
  description: "SPS Property Solution บ้านคอนโดสวย อมตะซิตี้ ชลบุรี - ค้นหาบ้านและคอนโดที่ใช่สำหรับคุณในอมตะซิตี้ ชลบุรี",
};

// Stats data
const stats = [
  { icon: Building2, value: "500+", label: "ทรัพย์สิน" },
  { icon: Award, value: "12+", label: "ปีประสบการณ์" },
  { icon: Users, value: "1,200+", label: "ลูกค้า" },
  { icon: Clock, value: "24/7", label: "บริการ" },
];



// Quick filters for sticky bar
const QUICK_FILTERS = [
  { id: "all", label: "ทั้งหมด", icon: HomeIcon },
  { id: "featured", label: "ทรัพย์เด่น", icon: Star },
  { id: "hotdeal", label: "🔥 ดีลร้อน", icon: Flame },
  { id: "near", label: "ใกล้ BTS", icon: MapPin },
  { id: "new", label: "🏠 ใหม่", icon: Sparkles },
  { id: "cheap", label: "💰 ราคาดี", icon: TrendingDown },
];

// Service highlights (compact)
const serviceHighlights = [
  { icon: CheckCircle2, title: "รับปิดหนี้ รวมหนี้ ผ่อนทางเดียว" },
  { icon: Building2, title: "บริการสินเชื่อครบวงจร ดูแลทุกขั้นตอน" },
  { icon: Lightbulb, title: "รับปรึกษาภาระหนี้สินเกินรายได้" },
  { icon: Handshake, title: "บริการครบวงจรทุกขั้นตอน" },
];

// Main Page Component
export default async function HomePage() {
  // Fetch all data in parallel
  const [properties, featuredProperties, blogs, locations, sections] = await Promise.all([
    getPropertiesOnce(false),
    getFeaturedProperties(6),
    getFeaturedBlogs(3),
    getPopularLocationsOnce(),
    getHomepageSectionsOnce(),
  ]);

  // Get newest properties sorted by createdAt (newest first, no time limit)
  const newProperties = [...properties]
    .filter(p => p.createdAt) // Only properties with createdAt
    .sort((a, b) => {
      const aTime = typeof a.createdAt === 'number'
        ? a.createdAt
        : (a.createdAt as any)?.toMillis?.() || 0;
      const bTime = typeof b.createdAt === 'number'
        ? b.createdAt
        : (b.createdAt as any)?.toMillis?.() || 0;
      return bTime - aTime; // Sort descending (newest first)
    })
    .slice(0, 6);

  return (
    <>
      <main className="min-h-screen bg-slate-50">

        {/* ── Hero Section (Compact) ── */}
        <HeroSlider>
          {/* Hero Content */}
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2">
              รวมภาระหนี้{" "}
              <span className="text-yellow-400 drop-shadow">ผ่อนบ้านทางเดียว</span>
            </h1>
            <p className="text-sm sm:text-base text-blue-200">
              อสังหาริมทรัพย์คุณภาพ อมตะซิตี้ · ชลบุรี
            </p>
          </div>

          {/* Search Box */}
          <HomeSearch />

          {/* Compact Service Highlights */}
          <div className="relative w-full max-w-4xl mx-auto mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {serviceHighlights.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all min-h-[30px] cursor-pointer"
                  >
                    <IconComponent className="h-4 w-4 text-yellow-400 shrink-0" />
                    <p className="text-white text-xs sm:text-sm font-medium leading-tight drop-shadow-sm">
                      {item.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location Tag */}
          <div className="flex items-center justify-center gap-2 text-gray-300 text-xs mt-3">
            <MapPin className="h-3.5 w-3.5" />
            <p>ชลบุรี ฉะเชิงเทรา ระยอง ปทุมธานี กทม.</p>
          </div>
        </HeroSlider>

        {/* ── Stats Strip (Compact) ── */}
        <section className="bg-blue-900 py-4 sm:py-5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex flex-col items-center gap-1 py-2 px-1">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mb-1" />
                    <span className="text-xl sm:text-3xl font-extrabold text-yellow-400 leading-none tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-[10px] sm:text-xs text-blue-200 font-medium mt-1">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Latest Properties Section (Featured) ── */}
        {newProperties.length > 0 && (
          <section className="py-4 sm:py-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-y border-cyan-100">
            <div className="max-w-7xl mx-auto px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🆕</span>
                  <h2 className="text-lg font-bold text-slate-900">บ้านล่าสุด</h2>
                  <span className="text-xs font-medium text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">
                    {newProperties.length} ทรัพย์
                  </span>
                </div>
                <Link
                  href="/properties"
                  className="text-xs font-semibold text-blue-900 hover:text-blue-700"
                >
                  ดูทั้งหมด →
                </Link>
              </div>

              {/* Horizontal Scroll Cards with Indicator */}
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 scroll-smooth">
                  {newProperties.map((property) => (
                    <div key={property.id} className="w-64 sm:w-72 shrink-0">
                      <PropertyCardCompact property={property} featured isNew />
                    </div>
                  ))}
                </div>
                {/* Gradient fade indicator for scroll */}
                <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-cyan-50 to-transparent pointer-events-none sm:hidden" />
              </div>
            </div>
          </section>
        )}

        {/* ── Main Property Section with Tabs ── */}
        <div className="border-t border-slate-200">
          <PropertyTabsSection
            initialProperties={featuredProperties.length > 0 ? featuredProperties : properties.slice(0, 24)}
            totalCount={properties.length}
          />
        </div>

        {/* ── CTA Banner (Compact) ── */}
        <section className="relative overflow-hidden bg-blue-900 py-6 sm:py-8">
          <div className="absolute inset-0 opacity-[0.07]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="md:max-w-xl">
                <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                  <MessageCircle className="h-3.5 w-3.5" />
                  ปรึกษาฟรี
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 leading-tight">
                  ต้องการความช่วยเหลือในการหาบ้าน?
                </h2>
                <p className="text-blue-200 text-xs sm:text-sm">
                  ทีมงานผู้เชี่ยวชาญพร้อมให้คำปรึกษา ตลอด 24 ชั่วโมง
                </p>
              </div>

              <a
                href="https://www.facebook.com/houseamata"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 text-sm whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" />
                ติดต่อ Facebook
              </a>
            </div>
          </div>
        </section>

        {/* ── Why Choose Us (Compact Grid) ── */}
        <section className="py-4 sm:py-6 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-yellow-400 rounded-full" />
              <h2 className="text-lg font-bold text-slate-900">ทำไมต้อง SPS</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              {[
                { Icon: HomeIcon, title: "ทรัพย์ครบ", desc: "ทุกประเภท", color: "bg-blue-100 text-blue-700" },
                { Icon: Wallet, title: "ปิดหนี้", desc: "รวมหนี้ได้", color: "bg-emerald-100 text-emerald-700" },
                { Icon: BadgeCheck, title: "ครบวงจร", desc: "ดูแลจบ", color: "bg-purple-100 text-purple-700" },
                { Icon: MapPin, title: "รู้ทำเล", desc: "ชลบุรี", color: "bg-amber-100 text-amber-700" },
                { Icon: Zap, title: "ตอบเร็ว", desc: "24/7", color: "bg-cyan-100 text-cyan-700" },
                { Icon: Trophy, title: "12 ปี", desc: "ประสบการณ์", color: "bg-rose-100 text-rose-700" },
              ].map(({ Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer min-h-[100px]"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">{title}</h3>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Popular Locations (Compact) ── */}
        {locations.length > 0 && (
          <section className="py-4 sm:py-6 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 bg-yellow-400 rounded-full" />
                  <h2 className="text-lg font-bold text-slate-900">ทำเลยอดฮิต</h2>
                </div>
                <Link href="/properties" className="text-xs font-semibold text-blue-900 hover:text-blue-700">
                  ดูทั้งหมด →
                </Link>
              </div>

              {/* Horizontal Scroll for Locations with Scroll Indicator */}
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 scroll-smooth">
                  {locations.slice(0, 6).map((loc) => (
                    <Link
                      key={loc.id}
                      href={`/properties?location=${encodeURIComponent(loc.district || loc.province)}`}
                      className="group relative shrink-0 w-64 sm:w-72 aspect-video rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-white/30" />
                      </div>
                      {loc.imageUrl && (
                        <img
                          src={loc.imageUrl}
                          alt={loc.displayName}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="flex items-center gap-1.5 text-white text-sm font-bold drop-shadow">
                          <MapPin className="h-4 w-4 text-yellow-400" />
                          {loc.displayName}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* Gradient fade indicator for scroll */}
                <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none sm:hidden" />
              </div>
            </div>
          </section>
        )}

        {/* ── Featured Blogs (Compact) ── */}
        {blogs.length > 0 && (
          <section className="py-4 sm:py-6 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full" />
                  <h2 className="text-lg font-bold text-slate-900">บทความน่าสนใจ</h2>
                </div>
                <Link href="/blogs" className="text-xs font-semibold text-blue-900 hover:text-blue-700">
                  ดูทั้งหมด →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {blogs.slice(0, 3).map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blogs/${generateBlogSlug(blog)}`}
                    className="group bg-slate-50 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      {blog.images?.[0] ? (
                        <img
                          src={blog.images[0]}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50">
                          <span className="text-blue-400 text-xs">ไม่มีรูป</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-900 transition-colors leading-snug">
                        {blog.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  );
}
