"use client";

import { useState, useEffect } from "react";
import { getHeroSlidesOnce } from "@/lib/firestore";

interface Slide {
  id: string;
  imageUrl?: string;
  image?: string;
  url?: string;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75&auto=format";

function getSlideImageUrl(slide: Slide): string {
  return slide?.imageUrl || slide?.image || slide?.url || DEFAULT_IMAGE;
}

interface HeroSliderProps {
  children: React.ReactNode;
  className?: string;
}

export default function HeroSlider({ children, className = "" }: HeroSliderProps) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    getHeroSlidesOnce()
      .then((list) => {
        const finalSlides = list.length > 0 ? list : [{ id: "default", imageUrl: DEFAULT_IMAGE }];
        setSlides(finalSlides as Slide[]);
      })
      .catch(() => {
        setSlides([{ id: "default", imageUrl: DEFAULT_IMAGE }]);
      });
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  // Loading state
  if (slides === null) {
    return (
      <section className={`relative flex items-center justify-center min-h-[85vh] overflow-hidden ${className}`}>
        <img
          src={DEFAULT_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75 z-[1]" />
        <div className="relative z-[2] w-full flex flex-col items-center justify-center min-h-[85vh] py-16 md:py-20 px-4">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className={`relative min-h-[85vh] flex items-center justify-center ${className}`}>
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 z-0" : "opacity-0 z-[-1]"
          }`}
        >
          <img
            src={getSlideImageUrl(slide)}
            alt=""
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75 z-[1]" />

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3] flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-yellow-400 w-6" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-[2] w-full flex flex-col items-center justify-center min-h-[85vh] py-16 md:py-20 px-4">
        {children}
      </div>
    </section>
  );
}