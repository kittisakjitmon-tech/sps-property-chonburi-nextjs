"use client";

import { useId } from 'react';
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

/** ใช้ select มาตรฐานเพื่อรองรับคีย์บอร์ด หน้าจอสัมผัส และโปรแกรมอ่านหน้าจอ */
export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'เลือก...',
  label,
  className = '',
}: DropdownProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const normalizedOptions = options.filter((option, index) =>
    option.value !== '' && options.findIndex((item) => item.value === option.value) === index
  );

  return (
    <div className={`relative ${className}`}>
      {label && <label id={labelId} htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label ? undefined : placeholder}
        className="w-full min-h-[44px] min-w-[112px] appearance-none cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </div>
  );
}
