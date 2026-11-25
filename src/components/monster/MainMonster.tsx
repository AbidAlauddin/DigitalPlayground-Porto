import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MONSTER_ASSETS, preloadMonsterAssets } from './monsterAssets';
import { useMonsterBlink } from './useMonsterBlink';
import { useMonsterWave } from './useMonsterWave';
import { MonsterRenderer } from './MonsterRenderer';

export type MonsterSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MainMonsterProps {
  size?: MonsterSize;
  className?: string;
  onClick?: () => void;
  hidden?: boolean;
}

const sizeClasses: Record<MonsterSize, string> = {
  sm: 'w-24 h-24 md:w-32 md:h-32',
  md: 'w-44 h-44 md:w-56 md:h-56',
  lg: 'w-56 h-56 md:w-72 md:h-72 lg:w-84 lg:h-84',
  xl: 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[440px] lg:h-[440px]',
};

export const MainMonster: React.FC<MainMonsterProps> = ({
  size = 'xl',
  className = '',
  onClick,
  hidden = false,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [, setAssetsLoaded] = useState(false);

  // Touch tracking for accurate tap vs scroll distinction
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Subscribe to prefers-reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Preload and decode all monster frames into memory
  useEffect(() => {
    let isMounted = true;
    preloadMonsterAssets().then(() => {
      if (isMounted) setAssetsLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Waving animation controller (highest interaction priority)
  const {
    isWaving,
    waveIndex,
    isHappy,
    triggerWave,
    onHoverStart,
    onHoverEnd,
    onTouchTrigger,
  } = useMonsterWave({ prefersReducedMotion });

  // Blinking animation controller (active in idle)
  const { eyeState } = useMonsterBlink({
    isPaused: hidden || isWaving || isHappy,
    prefersReducedMotion,
  });

  // Touch event handlers (strictly ignoring swipes/scrolls)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    touchStartPos.current = null;

    // Only trigger if movement is under 12px (genuine tap, not scroll)
    if (Math.hypot(dx, dy) < 12) {
      onTouchTrigger();
      onClick?.();
    }
  };

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerWave(false);
        onClick?.();
      }
    },
    [triggerWave, onClick]
  );

  // Determine current frame key, fallback source, and idle status
  let frameKey: string;
  let fallbackSrc: string;
  let isIdle: boolean;

  if (isWaving) {
    frameKey = `wave_${waveIndex}`;
    fallbackSrc = MONSTER_ASSETS.waving[waveIndex] || MONSTER_ASSETS.waving[0];
    isIdle = false;
  } else if (isHappy) {
    frameKey = 'happy';
    fallbackSrc = MONSTER_ASSETS.happy;
    isIdle = false;
  } else {
    frameKey = `blink_${eyeState}`;
    fallbackSrc = MONSTER_ASSETS.blinking[eyeState];
    isIdle = true;
  }

  const sizeClass = sizeClasses[size];

  if (hidden) {
    return (
      <div
        className={`invisible pointer-events-none select-none ${sizeClass} ${className}`}
        aria-hidden="true"
        data-testid="main-monster"
        data-monster-state="hidden"
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="The Digital Playground fluffy monster mascot. Press Enter or click to interact."
      onPointerEnter={onHoverStart}
      onPointerLeave={onHoverEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/50 focus-visible:ring-offset-4 rounded-3xl transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${sizeClass} ${className}`}
      data-testid="main-monster"
      data-monster-state={isWaving ? 'waving' : isHappy ? 'happy' : 'idle'}
      data-frame-key={frameKey}
    >
      <MonsterRenderer
        frameKey={frameKey}
        fallbackSrc={fallbackSrc}
        isIdle={isIdle}
        alt="Fluffy monster mascot"
      />
    </div>
  );
};

export default MainMonster;
