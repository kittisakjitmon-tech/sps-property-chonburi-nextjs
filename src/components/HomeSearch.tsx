'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Building2, ChevronDown, KeyRound, Sparkles } from "lucide-react";
import { PROPERTY_TYPES } from "@/constants/propertyTypes";
import LocationAutocomplete from "./LocationAutocomplete";

const PRICE_RANGES = [
  { label: "ทุกราคา", min: "", max: "" },
  { label: "ไม่เกิน 1 ล้าน", min: "", max: "1000000" },
  { label: "1 - 2 ล้าน", min: "1000000", max: "2000000" },
  { label: "2 - 3 ล้าน", min: "2000000", max: "3000000" },
  { label: "3 - 5 ล้าน", min: "3000000", max: "5000000" },
  { label: "5 - 10 ล้าน", min: "5000000", max: "10000000" },
  { label: "10 ล้านขึ้นไป", min: "10000000", max: "" },
];

interface LocationData {
  id: number;
  province: string;
  district: string;
  subDistrict: string;
  displayName: string;
}

export default function HomeSearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("buy");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
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
      params.set("type", "rent");
    } else if (activeTab === "installment") {
      params.set("type", "rent");
      params.set("subListingType", "installment_only");
    }

    // Handle location - use district/province from selected location or free text
    if (selectedLocation) {
      // Use selected location's district
      if (selectedLocation.district) {
        params.set("location", selectedLocation.district);
      } else {
        params.set("location", selectedLocation.province);
      }
    } else if (searchQuery.trim()) {
      // Use free text search
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

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setSearchQuery(location.displayName);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-0">
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
            className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-blue-900 shadow-lg"
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

          {/* Location Search with Autocomplete */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
              ทำเล / โครงการ
            </div>
            <LocationAutocomplete
              value={searchQuery}
              onChange={(v) => {
                setSearchQuery(v);
                // Clear selected location if text doesn't match
                if (selectedLocation && v !== selectedLocation.displayName) {
                  setSelectedLocation(null);
                }
              }}
              onSelect={handleLocationSelect}
              placeholder="ค้นหาทำเล, จังหวัด, อำเภอ..."
              inputClassName="!bg-slate-50 !rounded-2xl !py-4 border-2 border-transparent focus:!border-blue-200"
              enableTypingAnimation={true}
            />
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
              className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 transition-all duration-200 ${
                isTypeOpen ? "border-blue-200 bg-white ring-4 ring-blue-50" : "border-transparent"
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
              className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 transition-all duration-200 ${
                isPriceOpen ? "border-blue-200 bg-white ring-4 ring-blue-50" : "border-transparent"
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
            className="lg:w-auto w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors shadow-lg"
          >
            <span>ค้นหา</span>
          </button>
        </div>
      </div>
    </div>
  );
}
