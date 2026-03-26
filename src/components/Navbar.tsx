"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Heart,
  ChevronDown,
  Home,
  Sparkles,
  House,
  Flame,
  CreditCard,
  Building2,
} from "lucide-react";

const buyHomeLinks = [
  { href: "/properties?listingType=sale", label: "รวมโครงการทั้งหมด", icon: Home },
  { href: "/properties?listingType=sale&propertyCondition=มือ%201", label: "บ้านมือ 1", icon: Sparkles },
  { href: "/properties?listingType=sale&propertyCondition=มือ%202", label: "บ้านมือ 2", icon: House },
  { href: "/properties?listingType=rent&subListingType=installment_only", label: "บ้านผ่อนตรง", icon: Flame, highlight: true },
  { href: "/properties?project=NPA", label: "บ้าน NPA", icon: Building2, npaHighlight: true },
];

const serviceLinks = [
  { href: "/loan-services", label: "สินเชื่อ & ปิดภาระหนี้", icon: CreditCard },
  { href: "/post", label: "ฝากขาย / เช่า", icon: Flame },
  { href: "/blogs", label: "บทความ", icon: Sparkles },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileBuyOpen, setMobileBuyOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  
  // Timeout refs for dropdown close delay
  const buyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serviceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setBuyMenuOpen(false);
        setServiceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (buyTimeoutRef.current) clearTimeout(buyTimeoutRef.current);
      if (serviceTimeoutRef.current) clearTimeout(serviceTimeoutRef.current);
    };
  }, []);

  const handleBuyMouseEnter = () => {
    if (buyTimeoutRef.current) clearTimeout(buyTimeoutRef.current);
    setBuyMenuOpen(true);
  };

  const handleBuyMouseLeave = () => {
    buyTimeoutRef.current = setTimeout(() => {
      setBuyMenuOpen(false);
    }, 1000); // 1 second delay
  };

  const handleServiceMouseEnter = () => {
    if (serviceTimeoutRef.current) clearTimeout(serviceTimeoutRef.current);
    setServiceMenuOpen(true);
  };

  const handleServiceMouseLeave = () => {
    serviceTimeoutRef.current = setTimeout(() => {
      setServiceMenuOpen(false);
    }, 1000); // 1 second delay
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-white border-b border-gray-200">
      <nav className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 lg:max-w-7xl min-h-[60px] flex flex-wrap items-center justify-between gap-3 py-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink min-w-0 max-w-[calc(100%-56px)] lg:max-w-none">
          <img src="/logo.png" alt="SPS Property Solution" className="w-10 h-10 object-contain rounded-lg" />
          <span className="text-base font-semibold text-gray-900 whitespace-nowrap truncate hidden sm:inline">
            SPS Property Solution
          </span>
        </Link>

        {/* Desktop Menu */}
        <div ref={desktopMenuRef} className="hidden lg:flex items-center gap-6 flex-1 justify-center min-w-0">
          <Link href="/" className="nav-link text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 whitespace-nowrap no-underline py-2">
            หน้าหลัก
          </Link>

          {/* Buy Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setBuyMenuOpen(!buyMenuOpen);
                setServiceMenuOpen(false);
              }}
              onMouseEnter={handleBuyMouseEnter}
              onMouseLeave={handleBuyMouseLeave}
              className="nav-link inline-flex items-center gap-1 text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 whitespace-nowrap bg-transparent border-0 cursor-pointer py-2"
            >
              ซื้อบ้าน
              <ChevronDown className={`h-4 w-4 transition-transform ${buyMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <div
              onMouseEnter={handleBuyMouseEnter}
              onMouseLeave={handleBuyMouseLeave}
              className={`absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 transition-all duration-200 ${
                buyMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
              }`}
            >
              {buyHomeLinks.map(({ href, label, icon: Icon, highlight, npaHighlight }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm transition ${
                    highlight
                      ? "font-semibold text-red-600 hover:bg-red-50"
                      : npaHighlight
                      ? "font-semibold text-indigo-700 hover:bg-indigo-50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setBuyMenuOpen(false)}
                >
                  <Icon className={`h-4 w-4 ${highlight ? "text-red-500" : npaHighlight ? "text-indigo-500" : "text-slate-500"}`} />
                  {label}
                  {npaHighlight && (
                    <span className="ml-auto text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">NPA</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/properties?listingType=rent" className="nav-link text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 whitespace-nowrap no-underline py-2">
            เช่า
          </Link>

          {/* Service Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setServiceMenuOpen(!serviceMenuOpen);
                setBuyMenuOpen(false);
              }}
              onMouseEnter={handleServiceMouseEnter}
              onMouseLeave={handleServiceMouseLeave}
              className="nav-link inline-flex items-center gap-1 text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 whitespace-nowrap bg-transparent border-0 cursor-pointer py-2"
            >
              บริการของเรา
              <ChevronDown className={`h-4 w-4 transition-transform ${serviceMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <div
              onMouseEnter={handleServiceMouseEnter}
              onMouseLeave={handleServiceMouseLeave}
              className={`absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 transition-all duration-200 ${
                serviceMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
              }`}
            >
              {serviceLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setServiceMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/contact" className="nav-link text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 whitespace-nowrap no-underline py-2">
            ติดต่อเรา
          </Link>

          <Link
            href="/favorites"
            className="nav-link text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap no-underline py-2"
          >
            <Heart className="h-4 w-4" />
            รายการโปรด
          </Link>
        </div>

        {/* Right side buttons */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/post"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold whitespace-nowrap hover:bg-amber-600 transition-colors"
          >
            ลงประกาศฟรี
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
          aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden basis-full w-full py-3 border-t border-slate-100">
            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setMobileOpen(false)} className="w-full px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium min-h-[44px] flex items-center">
                หน้าหลัก
              </Link>

              <button
                type="button"
                onClick={() => setMobileBuyOpen((prev) => !prev)}
                className="w-full px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between min-h-[44px]"
              >
                <span>ซื้อบ้าน</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileBuyOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileBuyOpen && (
                <div className="w-full space-y-2 pl-4">
                  {buyHomeLinks.map(({ href, label, icon: Icon, highlight, npaHighlight }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileBuyOpen(false);
                      }}
                      className={`w-full rounded-xl border px-4 py-3.5 flex items-center gap-3 text-sm min-h-[48px] ${
                        highlight ? "font-semibold text-red-600" : npaHighlight ? "font-semibold text-indigo-700" : "text-slate-700"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${highlight ? "text-red-500" : npaHighlight ? "text-indigo-500" : "text-slate-500"}`} />
                      {label}
                    </Link>
                  ))}
                </div>
              )}

              <Link href="/properties?listingType=rent" onClick={() => setMobileOpen(false)} className="w-full px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium min-h-[44px] flex items-center">
                เช่า
              </Link>

              <button
                type="button"
                onClick={() => setMobileServiceOpen((prev) => !prev)}
                className="w-full px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between min-h-[44px]"
              >
                <span>บริการของเรา</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileServiceOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileServiceOpen && (
                <div className="w-full space-y-2 pl-4">
                  {serviceLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileServiceOpen(false);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 flex items-center gap-3 text-sm text-slate-700 min-h-[52px] hover:bg-slate-50 transition"
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      {label}
                    </Link>
                  ))}
                </div>
              )}

              <Link href="/contact" onClick={() => setMobileOpen(false)} className="w-full px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium min-h-[44px] flex items-center">
                ติดต่อเรา
              </Link>

              <Link href="/favorites" onClick={() => setMobileOpen(false)} className="w-full px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 min-h-[44px]">
                <Heart className="h-4 w-4" />
                รายการโปรด
              </Link>

              <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full px-4 py-3 rounded-xl text-blue-900 hover:bg-blue-50 font-medium flex items-center gap-2 min-h-[44px]">
                เข้าสู่ระบบ
              </Link>

              <Link href="/post" onClick={() => setMobileOpen(false)} className="w-full mt-2 inline-flex items-center justify-center px-4 py-3.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 min-h-[48px]">
                ลงประกาศฟรี
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}