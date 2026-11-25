import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Navbar } from '../navigation/Navbar';
import { MobileMenu } from '../navigation/MobileMenu';
import { ScrollIndicator } from '../navigation/ScrollIndicator';
import { HeroSection } from '../sections/HeroSection';
import { SectionSkeleton } from '../sections/SectionSkeleton';
import {
  preloadSectionByIndex,
  scheduleIdleSectionPrefetch,
} from '../sections/sectionLoaders';
import { useSectionNavigation } from '../../hooks/useSectionNavigation';

// Lazy-load non-Hero sections to keep the initial client bundle lightweight and fast
const AboutSection = lazy(() =>
  import('../sections/AboutSection').then((m) => ({ default: m.AboutSection }))
);
const SkillsSection = lazy(() =>
  import('../sections/SkillsSection').then((m) => ({ default: m.SkillsSection }))
);
const ExperienceSection = lazy(() =>
  import('../sections/ExperienceSection').then((m) => ({ default: m.ExperienceSection }))
);
const ProjectsSection = lazy(() =>
  import('../sections/ProjectsSection').then((m) => ({ default: m.ProjectsSection }))
);
const ContactSection = lazy(() =>
  import('../sections/ContactSection').then((m) => ({ default: m.ContactSection }))
);

export const PortfolioShell: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { activeIndex, goToSection, containerRef, sliderRef, isDesktop } =
    useSectionNavigation({ isLocked: isMenuOpen });

  // Intelligent idle prefetch of downstream sections after Hero mounts
  useEffect(() => {
    const cancelIdlePrefetch = scheduleIdleSectionPrefetch();
    return () => cancelIdlePrefetch();
  }, []);

  // Preload neighboring sections when user approaches them
  useEffect(() => {
    preloadSectionByIndex(activeIndex + 1);
    preloadSectionByIndex(activeIndex + 2);
  }, [activeIndex]);

  return (
    /* Outer warm pastel background framing the viewport */
    <div className="portfolio-outer select-none">
      {/* Inner Main Canvas: Adaptive inset, smooth rounded corners & subtle shadow */}
      <main className="portfolio-shell">
        {/* Subtle Top Fade Overlay + Feathered Backdrop Blur */}
        <div className="navbar-fade-overlay" aria-hidden="true" />

        {/* Text-Only Navbar Fixed at Top of Main Area */}
        <Navbar
          activeIndex={activeIndex}
          onNavigate={goToSection}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />

        {/* Full-Screen Mobile Navigation Overlay */}
        <MobileMenu
          isOpen={isMenuOpen}
          activeIndex={activeIndex}
          onNavigate={goToSection}
          onClose={() => setIsMenuOpen(false)}
        />

        {/* Persistent Bottom-Left Scroll Indicator with Gentle Bounce */}
        <ScrollIndicator
          activeIndex={activeIndex}
          onNavigate={goToSection}
          isMenuOpen={isMenuOpen}
        />

        {/* Sliding Viewport for Desktop / Fluid Scroll for Mobile */}
        <div ref={containerRef} className="w-full h-full overflow-hidden">
          <div
            ref={sliderRef}
            className={`w-full h-full ${
              isDesktop
                ? 'will-change-transform'
                : isMenuOpen
                ? 'overflow-hidden'
                : 'overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth'
            }`}
          >
            {/* Section 01: Hero */}
            <div className="w-full h-full min-h-full snap-start shrink-0 overflow-y-auto lg:overflow-hidden">
              <HeroSection onNavigate={goToSection} isActive={activeIndex === 0} />
            </div>

            {/* Section 02: About */}
            <div className="w-full h-full min-h-full snap-start shrink-0 overflow-y-auto lg:overflow-hidden">
              <Suspense fallback={<SectionSkeleton indexLabel="02 / 06" />}>
                <AboutSection isActive={activeIndex === 1} />
              </Suspense>
            </div>

            {/* Section 03: Skills */}
            <div className="w-full h-full min-h-full snap-start shrink-0 overflow-y-auto lg:overflow-hidden">
              <Suspense fallback={<SectionSkeleton indexLabel="03 / 06" />}>
                <SkillsSection isActive={activeIndex === 2} />
              </Suspense>
            </div>

            {/* Section 04: Experience */}
            <div className="w-full h-full min-h-full snap-start shrink-0 overflow-y-auto lg:overflow-hidden">
              <Suspense fallback={<SectionSkeleton indexLabel="04 / 06" />}>
                <ExperienceSection isActive={activeIndex === 3} />
              </Suspense>
            </div>

            {/* Section 05: Projects */}
            <div className="w-full h-full min-h-full snap-start shrink-0 overflow-y-auto lg:overflow-hidden">
              <Suspense fallback={<SectionSkeleton indexLabel="05 / 06" />}>
                <ProjectsSection isActive={activeIndex === 4} />
              </Suspense>
            </div>

            {/* Section 06: Contact */}
            <div className="w-full h-full min-h-full snap-start shrink-0 overflow-y-auto lg:overflow-hidden">
              <Suspense fallback={<SectionSkeleton indexLabel="06 / 06" />}>
                <ContactSection isActive={activeIndex === 5} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortfolioShell;
