import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseMonsterWaveOptions {
  prefersReducedMotion?: boolean;
}

export function useMonsterWave({ prefersReducedMotion = false }: UseMonsterWaveOptions = {}) {
  const [isWaving, setIsWaving] = useState(false);
  const [waveIndex, setWaveIndex] = useState(0);
  const [isHappy, setIsHappy] = useState(false);

  const isHoveredRef = useRef(false);
  const isTouchTriggerRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const endWaveAndTransitionToHappy = useCallback(() => {
    setIsWaving(false);
    setIsHappy(true);

    if (isTouchTriggerRef.current) {
      // On mobile tap, hold happy pose for 850ms then return to idle
      timerRef.current = window.setTimeout(() => {
        setIsHappy(false);
        isTouchTriggerRef.current = false;
      }, 850);
    } else {
      // On desktop hover: if pointer has already left during the wave, return to idle
      if (!isHoveredRef.current) {
        setIsHappy(false);
      }
    }
  }, []);

  const triggerWave = useCallback(
    (isTouch = false) => {
      if (prefersReducedMotion) return;
      if (isWaving || isHappy) return;

      clearTimer();
      isTouchTriggerRef.current = isTouch;
      if (!isTouch) isHoveredRef.current = true;

      setIsWaving(true);
      setWaveIndex(0);

      let currentStep = 0;
      const intervalId = window.setInterval(() => {
        currentStep++;
        if (currentStep >= 6) {
          window.clearInterval(intervalId);
          endWaveAndTransitionToHappy();
        } else {
          setWaveIndex(currentStep);
        }
      }, 130); // ~130ms per frame for a smooth, natural wave cycle (total ~780ms)

      timerRef.current = intervalId;
    },
    [isWaving, isHappy, prefersReducedMotion, endWaveAndTransitionToHappy]
  );

  const onHoverStart = useCallback(() => {
    isHoveredRef.current = true;
    if (!isWaving && !isHappy) {
      triggerWave(false);
    }
  }, [isWaving, isHappy, triggerWave]);

  const onHoverEnd = useCallback(() => {
    isHoveredRef.current = false;
    // When pointer leaves: if currently in happy pose, return to idle immediately
    if (isHappy && !isTouchTriggerRef.current) {
      setIsHappy(false);
    }
  }, [isHappy]);

  const onTouchTrigger = useCallback(() => {
    if (!isWaving && !isHappy) {
      triggerWave(true);
    }
  }, [isWaving, isHappy, triggerWave]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    isWaving,
    waveIndex,
    isHappy,
    triggerWave,
    onHoverStart,
    onHoverEnd,
    onTouchTrigger,
  };
}
