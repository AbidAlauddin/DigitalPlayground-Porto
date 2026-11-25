import { useState, useEffect, useRef } from 'react';
import type { EyeFrameKey } from './monsterAssets';

export interface UseMonsterBlinkOptions {
  isPaused?: boolean;
  prefersReducedMotion?: boolean;
}

export function useMonsterBlink({
  isPaused = false,
  prefersReducedMotion = false,
}: UseMonsterBlinkOptions = {}) {
  const [eyeState, setEyeState] = useState<EyeFrameKey>('open');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // If paused (e.g. waving or happy) or reduced motion, clear any pending blink timer
    if (isPaused || prefersReducedMotion) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const scheduleNextBlink = () => {
      // Random interval between 2.5s and 5.0s
      const delay = 2500 + Math.random() * 2500;

      timeoutRef.current = window.setTimeout(() => {
        if (!isMounted) return;

        // 10% chance for wink expression, 90% for normal close-eyes blink
        const isWink = Math.random() < 0.10;
        const targetState: EyeFrameKey = isWink ? 'wink' : 'close';
        const blinkDuration = isWink ? 200 : 140;

        setEyeState(targetState);

        // Revert back to open after blink duration
        timeoutRef.current = window.setTimeout(() => {
          if (!isMounted) return;
          setEyeState('open');
          scheduleNextBlink();
        }, blinkDuration);
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      isMounted = false;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPaused, prefersReducedMotion]);

  // If paused or reduced motion, guarantee 'open' state is returned
  const effectiveEyeState: EyeFrameKey = isPaused || prefersReducedMotion ? 'open' : eyeState;

  return { eyeState: effectiveEyeState, setEyeState };
}
