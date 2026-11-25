import React, { useEffect } from 'react';
import { NAV_ITEMS, type NavItem } from '../../data/navigation';
import { preloadSectionByIndex } from '../sections/sectionLoaders';

export interface NavbarProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeIndex,
  onNavigate,
  isMenuOpen,
  setIsMenuOpen,
}) => {
  // Automatically close mobile menu if resized to desktop breakpoint (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen, setIsMenuOpen]);

  const handleBrandClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    onNavigate(0);
  };

  return (
    <header className="navbar-header">
      <nav
        aria-label="Main Navigation"
        className="page-container flex items-center justify-between gap-4 pointer-events-auto"
      >
        {/* Brand Name / Title - Clean Text Only */}
        <button
          type="button"
          onClick={handleBrandClick}
          className="text-stone-900 font-extrabold text-sm md:text-base tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-sm"
        >
          THE DIGITAL PLAYGROUND.
        </button>

        {/* Desktop Text-Only Navigation Links (Hidden on mobile and tablet) */}
        <ul className="hidden lg:flex items-center gap-6 lg:gap-8 xl:gap-10">
          {NAV_ITEMS.map((item: NavItem) => {
            const isActive = activeIndex === item.index;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate(item.index)}
                  onMouseEnter={() => preloadSectionByIndex(item.index)}
                  className={`cursor-pointer text-xs md:text-sm tracking-widest uppercase font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-sm py-1 ${
                    isActive
                      ? 'text-stone-900 opacity-100 scale-105'
                      : 'text-stone-600 opacity-40 hover:opacity-85'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Mobile & Tablet Hamburger / Close Animated Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation-menu"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="flex lg:hidden relative w-11 h-11 items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-sm text-stone-900"
        >
          <div className="w-5 h-4 relative flex flex-col justify-between" aria-hidden="true">
            <span
              className={`w-full h-0.5 bg-stone-900 rounded-full transition-transform duration-300 ease-in-out origin-center ${
                isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
              }`}
            />
            <span
              className={`w-full h-0.5 bg-stone-900 rounded-full transition-opacity duration-200 ease-in-out ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`w-full h-0.5 bg-stone-900 rounded-full transition-transform duration-300 ease-in-out origin-center ${
                isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
              }`}
            />
          </div>
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
