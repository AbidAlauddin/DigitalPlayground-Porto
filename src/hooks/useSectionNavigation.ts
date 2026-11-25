import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { NAV_ITEMS } from '../data/navigation';

gsap.registerPlugin(Observer);

export interface UseSectionNavigationReturn {
  activeIndex: number;
  goToSection: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  isDesktop: boolean;
}

export interface UseSectionNavigationOptions {
  isLocked?: boolean;
}

export function useSectionNavigation(
  options: UseSectionNavigationOptions = {}
): UseSectionNavigationReturn {
  const { isLocked = false } = options;
  const isLockedRef = useRef(isLocked);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  const activeIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // Sync refs with props & state
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Check reduced motion preference
  const isReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Core navigation function
  const goToSection = useCallback((targetIndex: number) => {
    const total = NAV_ITEMS.length;
    if (targetIndex < 0 || targetIndex >= total) return;
    if (isAnimatingRef.current && targetIndex === activeIndexRef.current) return;

    const desktopMode = window.innerWidth >= 1024;

    if (desktopMode && sliderRef.current) {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      const duration = isReducedMotion() ? 0.05 : 0.85;
      const ease = isReducedMotion() ? 'none' : 'power2.inOut';
      const sectionHeight = containerRef.current?.clientHeight || window.innerHeight;

      gsap.to(sliderRef.current, {
        y: -targetIndex * sectionHeight,
        duration,
        ease,
        overwrite: 'auto',
        onComplete: () => {
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 200);
        },
      });

      setActiveIndex(targetIndex);
      const targetItem = NAV_ITEMS[targetIndex];
      if (targetItem) {
        window.history.replaceState(null, '', `#${targetItem.id}`);
      }
    } else {
      // Mobile / tablet fluid scroll
      setActiveIndex(targetIndex);
      const targetItem = NAV_ITEMS[targetIndex];
      if (targetItem) {
        const el = document.getElementById(targetItem.id);
        if (el) {
          el.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth' });
        }
        window.history.replaceState(null, '', `#${targetItem.id}`);
      }
    }
  }, [isReducedMotion]);

  // Initial setup: Responsive check & initial hash reading
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      // Re-align slider position on resize using exact pixel height
      if (desktop && sliderRef.current) {
        const sectionHeight = containerRef.current?.clientHeight || window.innerHeight;
        gsap.set(sliderRef.current, {
          y: -activeIndexRef.current * sectionHeight,
        });
      } else if (!desktop && sliderRef.current) {
        gsap.set(sliderRef.current, { clearProps: 'transform' });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial URL Hash Handling
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const foundIdx = NAV_ITEMS.findIndex((item) => item.id === hash);
      if (foundIdx !== -1) {
        // Small delay to ensure layout height is computed
        setTimeout(() => {
          goToSection(foundIdx);
        }, 50);
      }
    }

    // Hash change event listener
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '');
      const foundIdx = NAV_ITEMS.findIndex((item) => item.id === currentHash);
      if (foundIdx !== -1 && foundIdx !== activeIndexRef.current) {
        goToSection(foundIdx);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [goToSection]);

  // GSAP Observer for desktop scroll gestures
  useEffect(() => {
    if (!isDesktop) return;

    let observerInstance: Observer | null = null;

    const ctx = gsap.context(() => {
      observerInstance = Observer.create({
        target: window,
        type: 'wheel,touch,pointer',
        wheelSpeed: -1,
        tolerance: 20,
        preventDefault: true,
        onDown: () => {
          if (isLockedRef.current) return;
          if (!isAnimatingRef.current && activeIndexRef.current > 0) {
            goToSection(activeIndexRef.current - 1);
          }
        },
        onUp: () => {
          if (isLockedRef.current) return;
          if (!isAnimatingRef.current && activeIndexRef.current < NAV_ITEMS.length - 1) {
            goToSection(activeIndexRef.current + 1);
          }
        },
      });
    });

    return () => {
      if (observerInstance) observerInstance.kill();
      ctx.revert();
    };
  }, [isDesktop, goToSection]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if navigation is locked (e.g. mobile menu open)
      if (isLockedRef.current) return;

      // Do not trigger if typing in an input or textarea
      const targetTag = (document.activeElement?.tagName || '').toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          if (activeIndexRef.current < NAV_ITEMS.length - 1) {
            goToSection(activeIndexRef.current + 1);
          }
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          if (activeIndexRef.current > 0) {
            goToSection(activeIndexRef.current - 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          goToSection(0);
          break;
        case 'End':
          e.preventDefault();
          goToSection(NAV_ITEMS.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToSection]);

  // Mobile IntersectionObserver to sync navbar on manual touch scroll
  useEffect(() => {
    if (isDesktop) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isLockedRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            const foundIdx = NAV_ITEMS.findIndex((item) => item.id === sectionId);
            if (foundIdx !== -1) {
              setActiveIndex(foundIdx);
              window.history.replaceState(null, '', `#${sectionId}`);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isDesktop]);

  return {
    activeIndex,
    goToSection,
    containerRef,
    sliderRef,
    isDesktop,
  };
}

export default useSectionNavigation;
