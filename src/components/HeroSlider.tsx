"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import { getHeroSlidesOnce } from "@/lib/firestore";
import { getOptimizedImageUrl, isValidImageUrl } from "@/lib/cloudinary";
import OptimizedImage from "@/components/OptimizedImage";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=75&auto=format";
const HERO_WIDTH = 1600;
const HERO_HEIGHT = 900;

interface HeroSlide {
  id: string;
  imageUrl?: string;
  image?: string;
  url?: string;
}

function getSlideImageUrl(slide: HeroSlide): string {
  const raw = slide.imageUrl || slide.image || slide.url || DEFAULT_IMAGE;
  if (raw === DEFAULT_IMAGE) return raw;
  if (isValidImageUrl(raw)) return getOptimizedImageUrl(raw, { width: HERO_WIDTH, height: HERO_HEIGHT, crop: "fill" }) || raw;
  return raw;
}

export default function HeroSlider({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);

  useEffect(() => {
    let active = true;
    getHeroSlidesOnce()
      .then((list) => {
        if (active) setSlides(list.length > 0 ? list : [{ id: "default", imageUrl: DEFAULT_IMAGE }]);
      })
      .catch(() => {
        if (active) setSlides([{ id: "default", imageUrl: DEFAULT_IMAGE }]);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className={`relative sm:min-h-[60vh] flex items-center justify-center overflow-hidden ${className}`} aria-label="ค้นหาอสังหาริมทรัพย์">
      {slides === null ? (
        <OptimizedImage src={DEFAULT_IMAGE} alt="" fill sizes="100vw" priority className="object-cover" aria-hidden="true" />
      ) : (
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          autoplay={slides.length > 1 ? { delay: 5000, disableOnInteraction: false } : false}
          pagination={{ clickable: true, bulletClass: "swiper-pagination-bullet !bg-white/50 !w-2 !h-2 !mx-1", bulletActiveClass: "!bg-yellow-400 !w-6" }}
          loop={slides.length > 1}
          className="!absolute !inset-0 !w-full !h-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <OptimizedImage src={getSlideImageUrl(slide)} alt="" fill sizes="100vw" priority={index === 0} className="object-cover" aria-hidden="true" />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75 z-[1]" />
      <div className="relative z-[2] w-full flex flex-col items-center justify-center sm:min-h-[60vh] py-6 sm:py-12 px-4">
        {children}
      </div>
    </section>
  );
}
