'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Building2, ChevronDown, KeyRound, Sparkles, Search, MapPin } from "lucide-react";
import { PROPERTY_TYPES } from "@/constants/propertyTypes";

const PRICE_RANGES = [
  { label: "ทุกราคา", min: "", max: "" },
  { label: "ไม่เกิน 1 ล้าน", min: "", max: "1000000" },
  { label: "1 - 2 ล้าน", min: "1000000", max: "2000000" },
  { label: "2 - 3 ล้าน", min: "2000000", max: "3000000" },
  { label: "3 - 5 ล้าน", min: "3000000", max: "5000000" },
  { label: "5 - 10 ล้าน", min: "5000000", max: "10000000" },
  { label: "10 ล้านขึ้นไป", min: "10000000", max: "" },
];

// Quick search locations
const QUICK_LOCATIONS = [
  { label: "ชลบุรี", value: "ชลบุรี" },
  { label: "อมตะ", value: "อมตะ" },
  { label: "พานทอง", value: "พานทอง" },
  { label: "ศรีราชา", value: "ศรีราชา" },
  { label: "บ้านบึง", value: "บ้านบึง" },
  { label: "ต่ำกว่า 2 ล้าน", value: "price-0-2000000" },
  { label: "บ้านเดี่ยว", value: "บ้านเดี่ยว" },
  { label: "คอนโด", value: "คอนโด" },
];

export default function HomeSearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("buy");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[0]);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const priceRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) setIsPriceOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setIsTypeOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (activeTab === "buy") {
      // Default - no type param needed
    } else if (activeTab === "rent") {
      params.set("listingType", "rent");
    } else if (activeTab === "installment") {
      params.set("listingType", "rent");
      params.set("subListingType", "installment_only");
    }

    // Handle location - use free text search
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }

    if (propertyType) {
      params.set("propertyType", propertyType);
    }

    if (priceRange.min) params.set("priceMin", priceRange.min);
    if (priceRange.max) params.set("priceMax", priceRange.max);

    // Navigate to properties page with filters
    const queryString = params.toString();
    router.push(queryString ? `/properties?${queryString}` : "/properties");
  };

  const handleQuickSearch = (value: string) => {
    const params = new URLSearchParams();

    if (activeTab === "buy") {
      // Default - no type param needed
    } else if (activeTab === "rent") {
      params.set("listingType", "rent");
    } else if (activeTab === "installment") {
      params.set("listingType", "rent");
      params.set("subListingType", "installment_only");
    }

    // Check if it's a price quick search
    if (value.startsWith("price-")) {
      const parts = value.split("-");
      if (parts[1]) params.set("priceMin", parts[1]);
      if (parts[2]) params.set("priceMax", parts[2]);
    } else {
      // Check if it's a property type keyword
      const propertyTypeKeywords: Record<string, string> = {
        "บ้านเดี่ยว": "SPS-S-2CLASS-ID",
        "คอนโด": "SPS-CD-ID",
        "ทาวน์โฮม": "SPS-TH-2CLASS-ID",
      };

      if (propertyTypeKeywords[value]) {
        params.set("propertyType", propertyTypeKeywords[value]);
      } else {
        // It's a location
        params.set("location", value);
      }
    }

    const queryString = params.toString();
    router.push(queryString ? `/properties?${queryString}` : "/properties");
  };

  return (
    <div className="w-full mb-5 max-w-5xl mx-auto px-4 sm:px-0">
      {/* Tabs */}
      <div className="flex gap-1 mb-0 ml-2 sm:ml-4">
        {[
          { id: "buy", label: "ซื้อ", icon: Home },
          { id: "rent", label: "เช่า", icon: KeyRound },
          { id: "installment", label: "ผ่อนตรง", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-bold transition-all duration-200 ${activeTab === tab.id
              ? "bg-white text-blue-900 shadow-sm"
              : "bg-blue-900/40 text-white/80 hover:bg-blue-900/60 backdrop-blur-sm"
              }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Bar Container */}
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-3 sm:p-4 border border-slate-100 relative z-10">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">

          {/* Location Search - Simple Input (No Autocomplete) */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
              ทำเล / โครงการ
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="ค้นหาทำเล, จังหวัด, อำเภอ..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white focus:outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Property Type Dropdown */}
          <div className="relative lg:w-48" ref={typeRef}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
              ประเภททรัพย์
            </div>
            <button
              onClick={() => {
                setIsTypeOpen(!isTypeOpen);
                setIsPriceOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 transition-all duration-200 ${isTypeOpen ? "border-blue-200 bg-white ring-4 ring-blue-50" : "border-transparent"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className={`h-5 w-5 ${propertyType ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-semibold truncate ${propertyType ? 'text-slate-900' : 'text-slate-500'}`}>
                  {propertyType ? PROPERTY_TYPES.find(t => t.id === propertyType)?.label : 'ทุกประเภท'}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isTypeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTypeOpen && (
              <div className="absolute top-[calc(100%+10px)] left-0 w-full min-w-[220px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                <button
                  onClick={() => {
                    setPropertyType("");
                    setIsTypeOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-sm transition-colors ${!propertyType ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  ทุกประเภท
                </button>
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setPropertyType(type.id);
                      setIsTypeOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${propertyType === type.id ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Dropdown */}
          <div className="relative lg:w-48" ref={priceRef}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
              ช่วงราคา
            </div>
            <button
              onClick={() => {
                setIsPriceOpen(!isPriceOpen);
                setIsTypeOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 transition-all duration-200 ${isPriceOpen ? "border-blue-200 bg-white ring-4 ring-blue-50" : "border-transparent"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-sm font-semibold ${priceRange.min || priceRange.max ? 'text-slate-900' : 'text-slate-500'}`}>
                  {priceRange.label}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isPriceOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPriceOpen && (
              <div className="absolute top-[calc(100%+10px)] left-0 w-full min-w-[200px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                {PRICE_RANGES.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPriceRange(range);
                      setIsPriceOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${priceRange.label === range.label ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="lg:w-auto w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Search className="h-5 w-5" />
            <span>ค้นหา</span>
          </button>
        </div>
      </div>

      {/* Quick Search Buttons */}
      <div className="mt-4 px-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_LOCATIONS.map((item) => (
            <button
              key={item.value}
              onClick={() => handleQuickSearch(item.value)}
              className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/40 hover:border-white/50 transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
