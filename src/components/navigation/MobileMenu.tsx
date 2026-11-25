import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { NAV_ITEMS, type NavItem } from '../../data/navigation';
import { preloadSectionByIndex } from '../sections/sectionLoaders';

export interface MobileMenuProps {
  isOpen: boolean;
  activeIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  activeIndex,
  onNavigate,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Preload downstream sections when user opens mobile menu
  useEffect(() => {
    if (isOpen) {
      [1, 2, 3, 4, 5].forEach(preloadSectionByIndex);
    }
  }, [isOpen]);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Keyboard navigation & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!menuRef.current) return;
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus active item or first item on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const activeBtn = menuRef.current?.querySelector<HTMLButtonElement>(
          'button[aria-current="page"]'
        );
        if (activeBtn) {
          activeBtn.focus();
        } else {
          const firstBtn = menuRef.current?.querySelector<HTMLButtonElement>('button');
          firstBtn?.focus();
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const overlayVariants: Variants = {
    closed: {
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0.05 : 0.25,
        ease: 'easeInOut',
      },
    },
    open: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.05 : 0.3,
        ease: 'easeInOut',
      },
    },
  };

  const listVariants: Variants = {
    closed: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.02,
        staggerDirection: -1,
      },
    },
    open: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    closed: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 12,
      transition: {
        duration: prefersReducedMotion ? 0.05 : 0.2,
        ease: 'easeOut',
      },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.05 : 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          id="mobile-navigation-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          variants={overlayVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="absolute inset-0 z-40 bg-[#FCFBF9] flex flex-col justify-center px-6 sm:px-12 md:px-16 overflow-y-auto select-none pointer-events-auto"
          style={{ borderRadius: 'inherit' }}
        >
          <div className="w-full max-w-lg mx-auto py-20 flex flex-col justify-center my-auto">
            <motion.ul
              variants={listVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col gap-3 sm:gap-5 md:gap-6"
            >
              {NAV_ITEMS.map((item: NavItem) => {
                const isActive = activeIndex === item.index;
                return (
                  <motion.li key={item.id} variants={itemVariants} className="w-full">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        requestAnimationFrame(() => {
                          onNavigate(item.index);
                        });
                      }}
                      className={`group flex items-baseline gap-4 sm:gap-6 w-full text-left py-2.5 sm:py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-sm cursor-pointer transition-colors duration-300 ${
                        isActive
                          ? 'text-stone-900'
                          : 'text-stone-400 hover:text-stone-700'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span
                        className={`font-mono text-xs sm:text-sm tracking-widest transition-colors duration-300 ${
                          isActive
                            ? 'text-stone-900 font-bold'
                            : 'text-stone-400 group-hover:text-stone-600'
                        }`}
                      >
                        {String(item.index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wider uppercase transition-transform duration-300 ${
                          isActive
                            ? 'translate-x-1 sm:translate-x-2'
                            : 'group-hover:translate-x-1'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
