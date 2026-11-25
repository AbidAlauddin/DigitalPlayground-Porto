import React from 'react';
import { NAV_ITEMS } from '../../data/navigation';

export interface ScrollIndicatorProps {
  activeIndex: number;
  totalSections?: number;
  onNavigate: (index: number) => void;
  isMenuOpen?: boolean;
}

export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  activeIndex,
  totalSections = NAV_ITEMS.length,
  onNavigate,
  isMenuOpen = false,
}) => {
  const isLastSection = activeIndex >= totalSections - 1;

  const handleClick = () => {
    if (isLastSection) {
      onNavigate(0);
    } else {
      onNavigate(activeIndex + 1);
    }
  };

  return (
    <div
      className={`absolute bottom-[var(--section-bottom-inset)] left-0 right-0 z-30 pointer-events-none transition-opacity duration-300 h-8 flex items-center ${
        isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        paddingLeft: 'var(--content-padding-x)',
        paddingRight: 'var(--content-padding-x)',
      }}
      aria-hidden={isMenuOpen}
    >
      <div className="page-container flex items-center justify-center md:justify-start h-8">
        <button
          type="button"
          onClick={handleClick}
          aria-label={
            isLastSection
              ? 'Scroll to top (Home section)'
              : 'Scroll to next section'
          }
          className="group pointer-events-auto flex items-center gap-2.5 md:gap-3 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 rounded-sm h-8"
        >
          {/* Circular Arrow Icon with Directional Gentle Bounce */}
          <span
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full border border-stone-300 group-hover:border-stone-800 flex items-center justify-center transition-colors shrink-0 ${
              isLastSection ? 'scroll-bounce-up' : 'scroll-bounce-down'
            }`}
          >
            <svg
              className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-500 ease-in-out ${
                isLastSection ? 'rotate-180' : 'rotate-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </span>

          {/* Consistent Two-Line Typography: SCROLL / DOWN or SCROLL / UP */}
          <div className="flex flex-col text-left leading-[1.05] tracking-widest font-bold uppercase select-none text-[10px] sm:text-[11px] md:text-xs min-w-[48px] md:min-w-[54px]">
            <span>SCROLL</span>
            <span className="transition-opacity duration-300">
              {isLastSection ? 'UP' : 'DOWN'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ScrollIndicator;
