'use client';

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-slide-up">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 px-5 py-4 flex items-center gap-3 min-w-[250px]">
        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
        <span className="text-slate-700 text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
