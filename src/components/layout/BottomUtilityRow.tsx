import React from 'react';

export interface BottomUtilityRowProps {
  leftMetadata?: React.ReactNode;
  rightMetadata?: React.ReactNode;
  hasBorderTop?: boolean;
  className?: string;
}

export const BottomUtilityRow: React.FC<BottomUtilityRowProps> = ({
  leftMetadata,
  rightMetadata,
  hasBorderTop = false,
  className = '',
}) => {
  return (
    <footer
      className={`page-container flex items-center justify-between text-xs text-stone-400 font-mono tracking-wider min-h-[32px] h-8 relative select-none z-10 ${
        hasBorderTop ? 'border-t border-stone-200/60' : ''
      } mb-10 sm:mb-11 md:mb-0 ${className}`}
    >
      {/* Desktop: Dedicated Reserved Left Slot for the Persistent Scroll Indicator */}
      <div className="hidden md:block w-56 shrink-0 h-8" aria-hidden="true" />

      {/* Section Left/Center Metadata */}
      {leftMetadata ? (
        <div className="flex items-center h-8 leading-none text-stone-400 font-mono text-[11px] sm:text-xs tracking-wider">
          {leftMetadata}
        </div>
      ) : (
        <div className="hidden md:block" aria-hidden="true" />
      )}

      {/* Section Right Metadata */}
      {rightMetadata && (
        <div className="ml-auto flex items-center h-8 leading-none text-stone-400 font-mono text-[11px] sm:text-xs tracking-wider">
          {rightMetadata}
        </div>
      )}
    </footer>
  );
};

export default BottomUtilityRow;
