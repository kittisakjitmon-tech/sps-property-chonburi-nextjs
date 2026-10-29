'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, KeyRound, Sparkles, Search, MapPin } from "lucide-react";
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

  const createSearchParams = () => {
    const params = new URLSearchParams();

    if (activeTab === "buy") {
      params.set("listingType", "sale");
    } else if (activeTab === "rent") {
      params.set("listingType", "rent");
    } else if (activeTab === "installment") {
      params.set("listingType", "rent");
      params.set("subListingType", "installment_only");
    }

    return params;
  };

  const handleSearch = () => {
    const params = createSearchParams();
    const query = searchQuery.trim();

    if (query) params.set("q", query);
    if (propertyType) params.set("propertyType", propertyType);
    if (priceRange.min || priceRange.max) {
      params.set("priceRange", `${priceRange.min}-${priceRange.max}`);
    }

    const queryString = params.toString();
    router.push(queryString ? `/properties?${queryString}` : "/properties");
  };

  const handleQuickSearch = (value: string) => {
    const params = createSearchParams();

    if (value.startsWith("price-")) {
      const [, min = "", max = ""] = value.split("-");
      params.set("priceRange", `${min}-${max}`);
    } else {
      const propertyTypeKeywords: Record<string, string> = {
        "บ้านเดี่ยว": "SPS-S-2CLASS-ID",
        "คอนโด": "SPS-CD-ID",
        "ทาวน์โฮม": "SPS-TH-2CLASS-ID",
      };

      if (propertyTypeKeywords[value]) {
        params.set("propertyType", propertyTypeKeywords[value]);
      } else {
        params.set("location", value);
      }
    }

    const queryString = params.toString();
    router.push(queryString ? `/properties?${queryString}` : "/properties");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-0">
      <div className="flex gap-1" role="group" aria-label="ประเภทการค้นหา">
        {[
          { id: "buy", label: "ซื้อ", icon: Home },
          { id: "rent", label: "เช่า", icon: KeyRound },
          { id: "installment", label: "ผ่อนตรง", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 sm:px-5 rounded-t-xl font-bold transition-colors text-sm ${activeTab === tab.id ? "bg-white text-blue-900 shadow-sm" : "bg-blue-900/50 text-white hover:bg-blue-900/70"}`}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />{tab.label}
          </button>
        ))}
      </div>

      <form
        className="bg-white rounded-2xl sm:rounded-[1.5rem] shadow-2xl p-2.5 sm:p-3 border border-slate-100 relative z-10"
        onSubmit={(event) => { event.preventDefault(); handleSearch(); }}
      >
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="col-span-2 sm:flex-1 min-w-0 relative">
            <label htmlFor="home-search-location" className="sr-only">ค้นหาทำเลหรือชื่อโครงการ</label>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id="home-search-location"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ทำเลหรือชื่อโครงการ"
              className="w-full min-h-[48px] pl-10 pr-3 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white focus:outline-none transition-all text-base sm:text-sm font-medium"
            />
          </div>

          <label htmlFor="home-property-type" className="sr-only">ประเภททรัพย์</label>
          <select
            id="home-property-type"
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value)}
            className="min-w-0 sm:w-36 min-h-[48px] px-3 rounded-xl bg-slate-50 border-2 border-transparent text-sm font-medium text-slate-700 focus:border-blue-200 focus:outline-none"
          >
            <option value="">ทุกประเภท</option>
            {PROPERTY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>

          <label htmlFor="home-price-range" className="sr-only">ช่วงราคา</label>
          <select
            id="home-price-range"
            value={`${priceRange.min}-${priceRange.max}`}
            onChange={(event) => {
              const selected = PRICE_RANGES.find((range) => `${range.min}-${range.max}` === event.target.value);
              if (selected) setPriceRange(selected);
            }}
            className="min-w-0 sm:w-36 min-h-[48px] px-3 rounded-xl bg-slate-50 border-2 border-transparent text-sm font-medium text-slate-700 focus:border-blue-200 focus:outline-none"
          >
            {PRICE_RANGES.map((range) => <option key={range.label} value={`${range.min}-${range.max}`}>{range.label}</option>)}
          </select>

          <button type="submit" className="col-span-2 sm:col-span-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors shadow-sm text-sm">
            <Search className="h-4 w-4" aria-hidden="true" />ค้นหา
          </button>
        </div>
      </form>

      <div className="mt-2 px-1" aria-label="ค้นหายอดนิยม">
        <div className="flex flex-nowrap sm:flex-wrap gap-2 justify-start sm:justify-center overflow-x-auto pb-1">
          {QUICK_LOCATIONS.slice(0, 6).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleQuickSearch(item.value)}
              className="shrink-0 min-h-[44px] px-4 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-medium hover:bg-white/30 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
