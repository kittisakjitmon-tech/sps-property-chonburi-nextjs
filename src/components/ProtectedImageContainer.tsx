'use client';

import { ReactNode } from 'react';

interface ProtectedImageContainerProps {
  children: ReactNode;
  propertyId?: string | null;
  className?: string;
  showWatermark?: boolean;
}

export default function ProtectedImageContainer({
  children,
  propertyId = null,
  className = '',
  showWatermark = true,
}: ProtectedImageContainerProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={`protected-image-container relative overflow-hidden ${className}`}
      onContextMenu={handleContextMenu}
    >
      {/* Image Container */}
      <div
        className="absolute inset-0 z-0 [&_img]:select-none [&_img]:[touch-action:none]"
        onDragStart={handleDragStart}
      >
        {children}
      </div>

      {/* Protection Layer */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none select-none"
        onContextMenu={handleContextMenu}
        aria-hidden
      />

      {/* Watermark Layer */}
      {showWatermark && (
        <div className="absolute inset-0 z-[2] pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -18deg,
                transparent,
                transparent 52px,
                rgba(255,255,255,0.22) 52px,
                rgba(255,255,255,0.22) 54px
              )`,
            }}
          />
          <div
            className="absolute right-2 bottom-2 left-2 text-right"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)' }}
          >
            <span className="text-[10px] sm:text-xs text-white font-semibold">
              SPS Property Solution
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
