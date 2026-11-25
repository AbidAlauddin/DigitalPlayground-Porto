import React, { Suspense, lazy } from 'react';
import { BottomUtilityRow } from '../layout/BottomUtilityRow';
import { PROFILE_DATA } from '../../data/profile';

const HeroMonsterCanvas = lazy(() => import('../../monster/components/HeroMonsterCanvas'));

interface HeroSectionProps {
  onNavigate?: (index: number) => void;
  isActive?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  isActive = true,
}) => {
  const handleNavigateProjects = () => {
    if (onNavigate) {
      onNavigate(4);
    } else {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateContact = () => {
    if (onNavigate) {
      onNavigate(5);
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      data-section-index="0"
      className="portfolio-section"
    >
      {/* Top Section Intro / Eyebrow */}
      <div className="page-container flex items-center justify-between text-xs md:text-sm font-semibold tracking-wider text-stone-500 uppercase">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-stone-400 inline-block" />
          <span>{PROFILE_DATA.eyebrow}</span>
        </div>
        <span className="hidden sm:inline-block text-stone-400 tracking-widest font-mono text-xs">
          01 / 06
        </span>
      </div>

      {/* Main Centered Content Grid — optically balanced vertically */}
      <div className="section-content my-auto page-container grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 xl:gap-12 items-center pt-4 sm:pt-6 lg:pt-4 xl:pt-6">
        {/* Left / Primary Text Column — visually paired in height with the monster */}
        <div className="lg:col-span-6 flex flex-col justify-center text-left space-y-5 md:space-y-6 lg:pt-4">
          <div className="space-y-2.5 md:space-y-3">
            <div className="inline-flex items-center gap-2 text-teal-800 text-xs md:text-sm font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-teal-700 inline-block" aria-hidden="true" />
              <span>{PROFILE_DATA.role}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-[66px] font-extrabold tracking-tight text-stone-900 leading-[1.06]">
              Hello, my name&apos;s{' '}
              <span className="text-teal-900">{PROFILE_DATA.name.split(' ')[0]}</span>.
              <br />
              I build digital playgrounds.
            </h1>
          </div>

          <p className="max-w-lg text-base sm:text-lg text-stone-600 font-normal leading-relaxed">
            {PROFILE_DATA.tagline}
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleNavigateProjects}
              className="cursor-pointer inline-flex items-center gap-2.5 px-5 py-3 text-xs sm:text-sm font-bold tracking-wider uppercase text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <span>View Projects</span>
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={handleNavigateContact}
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold tracking-wider uppercase text-stone-800 bg-stone-100 hover:bg-stone-200/80 border border-stone-200/90 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
            >
              <span>Let&apos;s Talk</span>
            </button>
          </div>
        </div>

        {/* Right / Interactive 3D Fluffy Monster Stage with Full Animation Safe Area */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[600px] xl:max-w-[640px] aspect-[1.06/1] lg:aspect-auto lg:h-[580px] xl:h-[620px] lg:-my-8 relative overflow-visible">
            <Suspense
              fallback={
                <div
                  className="w-full h-full flex items-center justify-center rounded-full bg-stone-100/60 border border-stone-200/70"
                  aria-hidden="true"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-stone-300 border-t-teal-700 animate-spin" />
                </div>
              }
            >
              <HeroMonsterCanvas isActive={isActive} className="w-full h-full" />
            </Suspense>
          </div>
          <p className="hidden lg:block mt-2 text-[11px] font-mono tracking-wider uppercase text-stone-400 select-none">
            Move cursor or click mascot to say hi
          </p>
        </div>
      </div>

      {/* Unified Bottom Utility Row */}
      <BottomUtilityRow rightMetadata="EST. 2021" />
    </section>
  );
};

export default HeroSection;
