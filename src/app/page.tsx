import type { Metadata } from "next";
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
  CalendarDays,
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
import { DynamicSections } from "@/components/DynamicPropertySection";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import HomeSearch from "@/components/HomeSearch";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";

// Metadata for SEO
export const metadata: Metadata = {
  title: "SPS Property Solution | บ้านคอนโดสวย อมตะซิตี้ ชลบุรี",
  description: "SPS Property Solution บ้านคอนโดสวย อมตะซิตี้ ชลบุรี - ค้นหาบ้านและคอนโดที่ใช่สำหรับคุณในอมตะซิตี้ ชลบุรี",
};

// Server Component - Fetch data on server
async function FeaturedPropertiesSection() {
  const properties = await getFeaturedProperties(4);

  if (properties.length === 0) {
    return (
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500">ยังไม่มีทรัพย์เด่นในขณะนี้</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <span className="w-1 h-7 bg-yellow-400 rounded-full" />
            <h2 className="text-2xl font-bold text-slate-900">ทรัพย์เด่น</h2>
          </div>
          <Link
            href="/properties?featured=true"
            className="text-sm font-semibold text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-900 hover:text-white px-4 py-1.5 rounded-full transition-all"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} home />
          ))}
        </div>
      </div>
    </section>
  );
}

// Featured Blogs Section
async function FeaturedBlogsSection() {
  const blogs = await getFeaturedBlogs(4);

  if (blogs.length === 0) {
    return null;
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="py-8 sm:py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <span className="w-1 h-7 bg-blue-600 rounded-full" />
            <h2 className="text-2xl font-bold text-slate-900">บทความน่าสนใจ</h2>
          </div>
          <Link
            href="/blogs"
            className="text-sm font-semibold text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-900 hover:text-white px-4 py-1.5 rounded-full transition-all"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {blogs.slice(0, 4).map((blog) => (
            <Link
              key={blog.id}
              href={`/blogs/${blog.slug || blog.id}`}
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-sm hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-video bg-slate-100">
                {blog.images?.[0] ? (
                  <img
                    src={blog.images[0]}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <span className="text-blue-400 text-sm">ไม่มีรูปภาพ</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3 sm:p-5">
                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-900 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {blog.content?.substring(0, 100)}...
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Popular Locations Section
async function PopularLocationsSection() {
  const locations = await getPopularLocationsOnce();

  if (locations.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <span className="w-1 h-7 bg-yellow-400 rounded-full" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                ทำเลยอดฮิต
              </h2>
              <p className="text-slate-500 text-sm">พื้นที่แนะนำในชลบุรีและใกล้เคียง</p>
            </div>
          </div>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-900 hover:text-white px-4 py-1.5 rounded-full transition-all"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.slice(0, 6).map((loc) => (
            <Link
              key={loc.id}
              href={`/properties?location=${encodeURIComponent(loc.district || loc.province)}`}
              className="group relative aspect-video rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-sm transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-white/40" />
              </div>
              {loc.imageUrl && (
                <img
                  src={loc.imageUrl}
                  alt={loc.displayName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute bottom-4 left-4 right-4 text-white text-xl font-bold drop-shadow">
                {loc.displayName}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Stats data
const stats = [
  { icon: Building2, value: "500+", label: "ทรัพย์สินทั้งหมด" },
  { icon: Award, value: "12+", label: "ปีประสบการณ์" },
  { icon: Users, value: "1,200+", label: "ลูกค้าที่ไว้วางใจ" },
  { icon: Clock, value: "24/7", label: "บริการตลอดเวลา" },
];

const serviceHighlights = [
  { icon: CheckCircle2, title: "รับปิดหนี้ รวมหนี้ ผ่อนทางเดียว", color: "text-emerald-300" },
  { icon: Building2, title: "บริการสินเชื่อครบวงจร", color: "text-blue-200" },
  { icon: Lightbulb, title: "รับปรึกษาภาระหนี้สินเกินรายได้", color: "text-amber-300" },
  { icon: Handshake, title: "บริการครบวงจรทุกขั้นตอน", color: "text-purple-200" },
  { icon: TrendingUp, title: "รับนักลงทุนพร้อมบริหารงานเช่า", color: "text-cyan-200" },
];

const whyChooseUs = [
  { Icon: HomeIcon, title: "ทรัพย์ครบทุกประเภท", desc: "บ้านเดี่ยว ทาวน์โฮม คอนโด ในพื้นที่อมตะซิตี้และชลบุรี", color: "bg-blue-50 text-blue-700" },
  { Icon: Wallet, title: "รับปิดหนี้ รวมหนี้", desc: "บริการปรึกษาและจัดการภาระหนี้ ผ่อนบ้านทางเดียว", color: "bg-emerald-50 text-emerald-700" },
  { Icon: BadgeCheck, title: "บริการครบวงจร", desc: "ดูแลตั้งแต่ต้นจนจบ ทำสัญญา โอนกรรมสิทธิ์", color: "bg-purple-50 text-purple-700" },
  { Icon: MapPin, title: "รู้จักทำเลดี", desc: "ทีมงานชำนาญพื้นที่ ชลบุรี ฉะเชิงเทรา ระยอง", color: "bg-amber-50 text-amber-700" },
  { Icon: Zap, title: "ตอบสนองรวดเร็ว", desc: "ทีมงานพร้อมให้คำปรึกษา 24/7 ผ่าน Facebook", color: "bg-cyan-50 text-cyan-700" },
  { Icon: Trophy, title: "ประสบการณ์กว่า 12 ปี", desc: "ไว้วางใจโดยลูกค้ากว่า 1,200 ราย", color: "bg-rose-50 text-rose-700" },
];

// Dynamic Property Sections (from homepage_sections)
async function DynamicPropertiesSection() {
  try {
    const [properties, sections] = await Promise.all([
      getPropertiesOnce(false),
      getHomepageSectionsOnce(),
    ]);

    if (sections.length === 0 || properties.length === 0) {
      return null;
    }

    return <DynamicSections sections={sections} properties={properties} />;
  } catch (error) {
    console.error("Error loading dynamic sections:", error);
    return null;
  }
}

// Main Page Component
export default async function HomePage() {
  return (
    <>
      <main className="min-h-screen">
        {/* ── Hero Section with Slider ── */}
        <HeroSlider>
          {/* Hero Content */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4">
              รวมภาระหนี้{" "}
              <span className="text-yellow-400 drop-shadow">ผ่อนบ้านทางเดียว</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-200">
              อสังหาริมทรัพย์คุณภาพ อมตะซิตี้ · ชลบุรี
            </p>
          </div>
          {/* Search Box */}
          <HomeSearch />

          {/* Service Highlights */}
          <div className="max-w-4xl mt-4 mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {serviceHighlights.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-white/15 border border-white/25"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                      <IconComponent className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <p className="text-white text-base sm:text-lg leading-relaxed font-medium">
                      {item.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>



          {/* Location Tag */}
          <div className="flex items-center justify-center gap-2 text-gray-300 text-sm mt-6">
            <MapPin className="h-4 w-4" />
            <p>พื้นที่ให้บริการ: ชลบุรี ฉะเชิงเทรา ระยอง ปทุมธานี กทม.</p>
          </div>
        </HeroSlider>

        {/* ── Stats Strip ── */}
        <section className="bg-blue-900 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1">
                      <Icon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-2xl sm:text-4xl font-extrabold text-yellow-400 leading-none">
                      {stat.value}
                    </span>
                    <span className="text-sm text-blue-200 font-medium">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ── Featured Blogs (Server Component) ── */}
        <FeaturedBlogsSection />

        {/* ── Dynamic Property Sections (from homepage_sections) ── */}
        <DynamicPropertiesSection />

        {/* ── CTA Banner ── */}
        <section className="relative overflow-hidden bg-blue-900 py-12 sm:py-16">
          <div className="absolute inset-0 opacity-[0.07]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="md:max-w-xl">
                <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                  <MessageCircle className="h-3.5 w-3.5" />
                  ปรึกษาฟรี ไม่มีค่าใช้จ่าย
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                  ต้องการความช่วยเหลือ<br className="hidden sm:block" />ในการหาบ้าน?
                </h2>
                <p className="text-blue-200 text-sm sm:text-base leading-relaxed">
                  ทีมงานผู้เชี่ยวชาญพร้อมให้คำปรึกษา ตอบทุกคำถาม ตลอด 24 ชั่วโมง
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 md:shrink-0">
                <a
                  href="https://www.facebook.com/houseamata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 text-sm whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" />
                  ติดต่อผ่าน Facebook
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Choose Us ── */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-3">
                ทำไมต้องเลือก SPS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                ครบ · เร็ว · เชื่อใจได้
              </h2>
              <p className="text-slate-500 mt-2 text-sm sm:text-base max-w-xl mx-auto">
                เราดูแลทุกขั้นตอนตั้งแต่ค้นหาจนถึงโอนกรรมสิทธิ์
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {whyChooseUs.map(({ Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center px-6 py-8 rounded-2xl hover:bg-white hover:shadow-sm transition-all duration-300"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${color}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Popular Locations (Server Component) ── */}
        <PopularLocationsSection />


      </main>

    </>
  );
}