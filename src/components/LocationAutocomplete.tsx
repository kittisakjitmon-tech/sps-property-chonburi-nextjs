'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';

interface Location {
  id: number;
  province: string;
  district: string;
  subDistrict: string;
  displayName: string;
}

interface LocationAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (location: Location) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  enableTypingAnimation?: boolean;
}

const TYPING_PHRASES = [
  'ค้นหาพื้นที่ จังหวัด อำเภอ...',
  'ค้นหาชลบุรี...',
  'ค้นหาฉะเชิงเทรา...',
  'ค้นหาระยอง...',
];

// Lazy-load thaiLocations only when autocomplete is used
let thaiLocations: Location[] | null = null;
let loadPromise: Promise<Location[]> | null = null;

async function loadLocations(): Promise<Location[]> {
  if (thaiLocations) return thaiLocations;
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/data/thaiLocations.json')
    .then((res) => res.json())
    .then((data) => {
      thaiLocations = data;
      return data;
    })
    .catch((err) => {
      console.error('Failed to load locations:', err);
      loadPromise = null;
      return [];
    });

  return loadPromise;
}

function searchLocations(query: string, locations: Location[]): Location[] {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  return locations.filter(
    (loc) =>
      loc.province.toLowerCase().includes(q) ||
      loc.district.toLowerCase().includes(q) ||
      loc.subDistrict.toLowerCase().includes(q) ||
      loc.displayName.toLowerCase().includes(q)
  );
}

export default function LocationAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'ค้นหาพื้นที่ จังหวัด อำเภอ ตำบล...',
  className = '',
  inputClassName = '',
  enableTypingAnimation = true,
}: LocationAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Lazy-load thaiLocations when component mounts
  useEffect(() => {
    loadLocations().then((locs) => {
      setLocations(locs);
    });
  }, []);

  // Typing animation for placeholder (Decoupled from searchQuery)
  const { displayText: typingPlaceholder, stop: stopTyping, start: startTyping } = useTypingPlaceholder(
    TYPING_PHRASES,
    100,
    50,
    2000
  );

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Strict Focus Logic
  useEffect(() => {
    if (enableTypingAnimation) {
      if (isFocused) {
        stopTyping();
      } else if (!searchQuery.trim()) {
        startTyping();
      }
    }
  }, [isFocused, searchQuery, enableTypingAnimation, stopTyping, startTyping]);

  // Filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const results = searchLocations(searchQuery, locations);
    setSuggestions(results.slice(0, 8));
    setIsOpen(results.length > 0);
    setHighlightIndex(-1);
  }, [searchQuery, locations]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchQuery(v);
    onChange?.(v);
  };

  const handleSelect = (location: Location) => {
    const display = location.displayName;
    setSearchQuery(display);
    onChange?.(display);
    onSelect?.(location);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0 && suggestions[highlightIndex]) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            stopTyping();
            if (searchQuery.trim() && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            if (!searchQuery.trim()) {
              startTyping();
            }
            // Delay to allow click on suggestion
            setTimeout(() => setIsOpen(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isFocused ? 'ค้นหาทำเล, จังหวัด, อำเภอ...' : (enableTypingAnimation && !searchQuery.trim() ? typingPlaceholder : placeholder)}
          autoComplete="off"
          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all border-0 ${inputClassName}`}
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 py-1 bg-white rounded-xl shadow-lg max-h-60 overflow-auto border border-slate-100"
          role="listbox"
        >
          {suggestions.map((loc, i) => (
            <li
              key={loc.id}
              role="option"
              aria-selected={i === highlightIndex}
              onMouseEnter={() => setHighlightIndex(i)}
              onClick={() => handleSelect(loc)}
              className={`px-4 py-2.5 cursor-pointer flex items-center gap-2 text-sm ${
                i === highlightIndex ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{loc.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
