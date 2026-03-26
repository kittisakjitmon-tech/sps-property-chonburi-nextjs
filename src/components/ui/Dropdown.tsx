"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'เลือก...',
  label,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 transition-all duration-200 ${
          isOpen ? 'border-blue-200 bg-white ring-4 ring-blue-50' : 'border-transparent'
        }`}
      >
        <span className={`text-sm font-semibold truncate ${value ? 'text-slate-900' : 'text-slate-500'}`}>
          {displayText}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+10px)] left-0 w-full min-w-[200px] bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`w-full text-left px-5 py-3 text-sm transition-colors ${!value ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-5 py-3 text-sm transition-colors ${value === option.value ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
