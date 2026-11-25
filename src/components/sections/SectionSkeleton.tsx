import React from 'react';

interface SectionSkeletonProps {
  indexLabel?: string;
}

export const SectionSkeleton: React.FC<SectionSkeletonProps> = ({ indexLabel }) => {
  return (
    <div className="portfolio-section" aria-busy="true" aria-label="Loading section content">
      {/* Top Eyebrow Placeholder */}
      <div className="page-container flex items-center justify-between text-xs md:text-sm font-semibold tracking-wider text-stone-300 uppercase">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-stone-200 inline-block" />
          <span className="w-36 h-3 bg-stone-200/80 rounded animate-pulse" />
        </div>
        {indexLabel && (
          <span className="text-stone-300 tracking-widest font-mono text-xs">
            {indexLabel}
          </span>
        )}
      </div>

      {/* Center Ambient Indicator */}
      <div className="page-container flex-1 flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-teal-500/60 animate-spin" />
      </div>

      {/* Bottom Utility Space Placeholder */}
      <div className="page-container h-6" />
    </div>
  );
};

export default SectionSkeleton;
