import React from 'react';

export type MonsterSection = 'home' | 'about' | 'skills' | 'experience' | 'projects' | 'contact';
export type MonsterVariant = 'hero' | 'companion' | 'card' | 'closing';
export type MonsterSize = 'sm' | 'md' | 'lg' | 'xl';
export type MonsterPosition = 'center' | 'left' | 'right';

export interface MonsterPlaceholderProps {
  section: MonsterSection;
  variant?: MonsterVariant;
  size?: MonsterSize;
  position?: MonsterPosition;
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses: Record<MonsterSize, string> = {
  sm: 'w-24 h-24 md:w-32 md:h-32',
  md: 'w-44 h-44 md:w-56 md:h-56',
  lg: 'w-56 h-56 md:w-72 md:h-72 lg:w-84 lg:h-84',
  xl: 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]',
};

/**
 * MonsterPlaceholder component
 * 
 * Provides a dedicated, responsive, non-shifting space for the fluffy monster 3D mascot.
 * Per specifications: does NOT render borders, text, emojis, or substitute images to users.
 * Acts as an invisible structural staging container ready for 3D/PNG monster integration.
 */
export const MonsterPlaceholder: React.FC<MonsterPlaceholderProps> = ({
  section,
  size = 'md',
  position = 'center',
  className = '',
  children,
}) => {
  const sizeClass = sizeClasses[size];

  const positionClass =
    position === 'left'
      ? 'self-start mr-auto'
      : position === 'right'
        ? 'self-end ml-auto'
        : 'mx-auto';

  const positionStrategy = className.includes('absolute') ? '' : 'relative';

  return (
    <div
      data-monster-section={section}
      aria-hidden="true"
      className={`monster-placeholder-container ${positionStrategy} flex items-center justify-center shrink-0 pointer-events-none select-none transition-transform duration-500 ${sizeClass} ${positionClass} ${className}`}
    >
      {/* Container reserved for Three.js Canvas / 3D Model portal in Phase 04 */}
      {children}
    </div>
  );
};

export default MonsterPlaceholder;
