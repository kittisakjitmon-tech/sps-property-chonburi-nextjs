"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Star,
  Users,
  Clock,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import Link from "next/link";

// Animation Hook
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated Section Component
function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
}) {
  const { ref, isInView } = useInView(0.1);
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Staggered Animation for Grid Items
function StaggeredGrid({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { ref, isInView } = useInView(0.1);
  
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {children}
    </div>
  );
}

// Sample Portfolio Data
const portfolioData = [
  {
    id: 1,
    title: "โอนบ้านเดี่ยว ชลบุรี",
    category: "บ้านเดี่ยว",
    location: "ชลบุรี",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    year: 2025,
    description: "โอนกรรมสิทธิ์บ้านเดี่ยว 2 ชั้น พร้อมสวน",
  },
  {
    id: 2,
    title: "โอนคอนโด บางนา",
    category: "คอนโด",
    location: "บางนา",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    year: 2025,
    description: "โอนคอนโด High Rise 1 ห้องนอน",
  },
  {
    id: 3,
    title: "โอนทาวน์เฮ้าส์ พัทยา",
    category: "ทาวน์เฮ้าส์",
    location: "พัทยา",
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
    year: 2025,
    description: "โอนทาวน์เฮ้าส์ 3 ชั้น ใกล้หาด",
  },
  {
    id: 4,
    title: "โอนที่ดิน ระยอง",
    category: "ที่ดิน",
    location: "ระยอง",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    year: 2024,
    description: "โอนที่ดิน 5 ไร่ สำหรับพัฒนาอสังหา",
  },
  {
    id: 5,
    title: "โอนบ้าน สมุทรปราการ",
    category: "บ้านเดี่ยว",
    location: "สมุทรปราการ",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    year: 2024,
    description: "โอนบ้านจัดสรร ใหม่ 100%",
  },
  {
    id: 6,
    title: "โอนคอนโด พัทยา",
    category: "คอนโด",
    location: "พัทยา",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    year: 2024,
    description: "โอนคอนโด Sea View 2 ห้องนอน",
  },
  {
    id: 7,
    title: "โอนอพาร์ตเมนต์ ศรีราชา",
    category: "อพาร์ตเมนต์",
    location: "ศรีราชา",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
    year: 2024,
    description: "โอนอพาร์ตเมนต์ 10 ยูนิต",
  },
  {
    id: 8,
    title: "โอนที่ดิน ฉะเชิงเทรา",
    category: "ที่ดิน",
    location: "ฉะเชิงเทรา",
    image: "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800",
    year: 2024,
    description: "โอนที่ดิน 10 ไร่ เกษตรกรรม",
  },
  {
    id: 9,
    title: "โอนบ้านเดี่ยว ระยอง",
    category: "บ้านเดี่ยว",
    location: "ระยอง",
    image: "https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800",
    year: 2024,
    description: "โอนบ้านพร้อมที่จอดรถ 2 คัน",
  },
  {
    id: 10,
    title: "โอนคอนโด บางลำภาร่วม",
    category: "คอนโด",
    location: "บางลำภาร่วม",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    year: 2024,
    description: "โอนคอนโดใจกลางเมือง",
  },
  {
    id: 11,
    title: "โอนทาวน์เฮ้าส์ ชลบุรี",
    category: "ทาวน์เฮ้าส์",
    location: "ชลบุรี",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
    year: 2023,
    description: "โอนทาวน์เฮ้าส์ มือ 2 พร้อมอยู่",
  },
  {
    id: 12,
    title: "โอนที่ดิน สัตหีบ",
    category: "ที่ดิน",
    location: "สัตหีบ",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    year: 2023,
    description: "โอนที่ดินติดถนน ใกล้ชายหาด",
  },
];

const categories = ["ทั้งหมด", "บ้านเดี่ยว", "คอนโด", "ทาวน์เฮ้าส์", "ที่ดิน", "อพาร์ตเมนต์"];
const areas = ["ทั้งหมด", "ชลบุรี", "พัทยา", "ระยอง", "บางนา", "สมุทรปราการ", "ศรีราชา", "ฉะเชิงเทรา"];

const testimonials = [
  {
    name: "คุณสมชาย",
    location: "ชลบุรี",
    review: "บริการดีมากค่ะ โอนบ้านเสร็จภายใน 7 วัน ทำงานรวดเร็วและถูกต้อง แนะนำเลยค่ะ",
    rating: 5,
  },
  {
    name: "คุณแดง",
    location: "พัทยา",
    review: "ตอนแรกกังวลเรื่องเอกสาร แต่ทีมงานช่วยดูแลทุกอย่างจนโอนสำเร็จ ขอบคุณมากค่ะ",
    rating: 5,
  },
  {
    name: "คุณวิชัย",
    location: "ระยอง",
    review: "ประทับใจกับการให้บริการ มีทีมงานมืออาชีพ ตอบคำถามได้ตลอดเวลา",
    rating: 5,
  },
];

// Counter Animation Hook
function useCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * (end - start) + start));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration, start]);

  return { count, ref };
}

// Animated Counter Component
function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const { count, ref } = useCounter(end, duration);
  
  return (
    <div ref={ref} className="font-bold text-4xl">
      {count}{suffix}
    </div>
  );
}

// Simple Lightbox Component
function SimpleLightbox({ 
  isOpen, 
  onClose, 
  items, 
  currentIndex, 
  setCurrentIndex 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  items: typeof portfolioData;
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIndex(Math.max(0, currentIndex - 1));
      if (e.key === "ArrowRight") setCurrentIndex(Math.min(items.length - 1, currentIndex + 1));
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, currentIndex, items.length, onClose, setCurrentIndex]);

  if (!isOpen || !items[currentIndex]) return null;

  const item = items[currentIndex];

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center animate-fadeIn">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 disabled:opacity-30"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
        disabled={currentIndex === items.length - 1}
        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 disabled:opacity-30"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      <div className="relative w-full max-w-5xl h-[70vh] mx-16 animate-scaleIn">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 animate-slideUp">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-white text-xl font-bold">{item.title}</h3>
          <p className="text-white/80 flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            {item.location} • {item.category} • {item.year}
          </p>
          <p className="text-white/70 mt-2">{item.description}</p>
          <p className="text-white/50 text-sm mt-2">{currentIndex + 1} / {items.length}</p>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [selectedArea, setSelectedArea] = useState("ทั้งหมด");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const filteredData = portfolioData.filter((item) => {
    const categoryMatch = selectedCategory === "ทั้งหมด" || item.category === selectedCategory;
    const areaMatch = selectedArea === "ทั้งหมด" || item.location === selectedArea;
    return categoryMatch && areaMatch;
  });

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
          <Image
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920"
            alt="Portfolio Hero"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="animate-bounceIn">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              ผลงานการโอนบ้าน
              <span className="block text-amber-400">500+ ราย</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              บริการโอนบ้าน คอนโด ที่ดิน รวดเร็ว ถูกต้อง ไว้ใจได้
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center animate-fadeInUp delay-200">
            <button 
              onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              ดูผลงาน
            </button>
            <Link 
              href="/contact"
              className="px-8 py-3 bg-white/10 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/30 hover:scale-105"
            >
              ปรึกษาฟรี
            </Link>
          </div>
        </div>

        <button 
          onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 hover:text-white animate-bounce"
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedSection delay={0} className="text-center group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-8 w-8 text-green-600 group-hover:scale-125 transition-transform" />
                <span className="text-4xl font-bold text-gray-900"><AnimatedCounter end={500} suffix="+" /></span>
              </div>
              <p className="text-gray-600">รายโอนสำเร็จ</p>
            </AnimatedSection>
            <AnimatedSection delay={100} className="text-center group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-8 w-8 text-blue-600 group-hover:scale-125 transition-transform" />
                <span className="text-4xl font-bold text-gray-900"><AnimatedCounter end={5} suffix=" ปี" /></span>
              </div>
              <p className="text-gray-600">ประสบการณ์</p>
            </AnimatedSection>
            <AnimatedSection delay={200} className="text-center group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-8 w-8 text-amber-500 fill-amber-500 group-hover:scale-125 transition-transform" />
                <span className="text-4xl font-bold text-gray-900"><AnimatedCounter end={98} suffix="%" /></span>
              </div>
              <p className="text-gray-600">ลูกค้าพึงพอใจ</p>
            </AnimatedSection>
            <AnimatedSection delay={300} className="text-center group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-8 w-8 text-purple-600 group-hover:scale-125 transition-transform" />
                <span className="text-4xl font-bold text-gray-900"><AnimatedCounter end={100} suffix="%" /></span>
              </div>
              <p className="text-gray-600">โอนสำเร็จ</p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ทำไมต้องเลือกเรา
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              บริการโอนบ้านครบวงจร ด้วยทีมงานมืออาชีพ ประสบการณ์กว่า 5 ปี
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">รวดเร็ว</h3>
                <p className="text-gray-600">โอนเสร็จภายใน 7-14 วัน ไม่ต้องรอนาน</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">ถูกต้อง</h3>
                <p className="text-gray-600">เอกสารครบถ้วน ตรวจสอบได้ ปลอดภัย 100%</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">ใส่ใจ</h3>
                <p className="text-gray-600">ดูแลทุกขั้นตอน ให้คำปรึกษาตลอดการทำงาน</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ขั้นตอนการโอน
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              ง่ายๆ เพียง 4 ขั้นตอน กับการโอนบ้านที่ไม่ยุ่งยาก
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: "ปรึกษาฟรี", desc: "ติดต่อมาก ประเมินราคา และข้อมูลเบื้องต้น", icon: MessageCircle },
              { step: 2, title: "เตรียมเอกสาร", desc: "รวบรวมเอกสารที่จำเป็น ตรวจสอบความถูกต้อง", icon: FileText },
              { step: 3, title: "ดำเนินการโอน", desc: "นัดลงนาม จ่ายค่าประกัน โอนกรรมสิทธิ์", icon: ArrowRight },
              { step: 4, title: "เสร็จสิ้น", desc: "รับโฉนด เอกสารการโอนครบถ้วน", icon: CheckCircle },
            ].map((item, index) => (
              <AnimatedSection key={item.step} delay={index * 100}>
                <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                  <div className="absolute -top-4 left-6 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <item.icon className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Gallery Section */}
      <section id="gallery" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ผลงานที่ผ่านมา
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              รวบรวมผลงานการโอนบ้าน คอนโด ที่ดิน ทั่วภาคตะวันออก
            </p>
          </AnimatedSection>

          {/* Filters */}
          <AnimatedSection className="flex flex-wrap gap-4 mb-8 justify-center">
            <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-xl">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "text-gray-600 hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform"
            >
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </AnimatedSection>

          {/* Gallery Grid */}
          <StaggeredGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredData.map((item, index) => (
              <div
                key={item.id}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                onClick={() => openLightbox(index)}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-120"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </p>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                  {item.category}
                </div>
              </div>
            ))}
          </StaggeredGrid>

          {filteredData.length === 0 && (
            <AnimatedSection className="text-center py-16">
              <p className="text-gray-500">ไม่พบผลงานในหมวดหมู่ที่เลือก</p>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ลูกค้าพูดถึงเรา
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              รีวิวจากลูกค้าจริงที่ใช้บริการ
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/90 mb-6 italic">"{item.review}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">
                      {item.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-white/70 text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              พื้นที่ให้บริการ
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              บริการโอนบ้าน ครอบคลุมภาคตะวันออกและกรุงเทพฯ
            </p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {["ชลบุรี", "พัทยา", "ระยอง", "บางนา", "สมุทรปราการ", "ศรีราชา", "ฉะเชิงเทรา", "สัตหีบ", "มาบตาพุด", "แหลมแม่โยน", "กรุงเทพฯ", "นนทบุรี"].map((area, index) => (
              <button
                key={area}
                className="px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-gray-700 hover:text-blue-700 font-medium transition-all hover:scale-110 flex items-center justify-center gap-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MapPin className="h-4 w-4" />
                {area}
              </button>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-amber-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full animate-pulse" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              อยากโอนบ้าน? ปรึกษาฟรี!
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              ทีมงานพร้อมให้บริการ ตอบทุกคำถาม ช่วยประเมินราคา และดำเนินการโอนให้ครบถ้วน
            </p>
          </AnimatedSection>
          <AnimatedSection delay={200} className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:0891234567"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-amber-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:scale-110 hover:shadow-xl"
            >
              <Phone className="h-5 w-5" />
              โทรเลย
            </a>
            <a
              href="https://line.me/ti/p/~yourlineid"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg hover:scale-110 hover:shadow-xl"
            >
              <MessageCircle className="h-5 w-5" />
              LINE
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-lg hover:scale-110 hover:shadow-xl"
            >
              <Mail className="h-5 w-5" />
              ติดต่อเรา
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Simple Lightbox */}
      <SimpleLightbox 
        isOpen={lightboxOpen} 
        onClose={closeLightbox} 
        items={filteredData}
        currentIndex={lightboxIndex}
        setCurrentIndex={setLightboxIndex}
      />

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease forwards;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.8s ease forwards;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease forwards;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
        
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
