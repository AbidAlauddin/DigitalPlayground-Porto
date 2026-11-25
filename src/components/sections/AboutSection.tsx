import React, { Suspense, lazy } from 'react';
import { BottomUtilityRow } from '../layout/BottomUtilityRow';
import { PROFILE_DATA } from '../../data/profile';

const AboutWorkspaceCanvas = lazy(() => import('../../monster/components/AboutWorkspaceCanvas'));

interface AboutSectionProps {
  isActive?: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isActive = true }) => {
  return (
    <section
      id="about"
      data-section-index="1"
      className="portfolio-section"
    >
      {/* Top Eyebrow */}
      <div className="page-container flex items-center justify-between text-xs md:text-sm font-semibold tracking-wider text-stone-500 uppercase">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-stone-400 inline-block" />
          <span>What I Do &amp; Approach</span>
        </div>
        <span className="text-stone-400 tracking-widest font-mono text-xs">
          02 / 06
        </span>
      </div>

      {/* Reversed Two-Column Layout: Left = Cozy Monster Workspace, Right = Editorial Text */}
      <div className="section-content my-auto page-container grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
        {/* Left Column — Cozy Developer Workspace (Top on Mobile) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[320px] sm:max-w-[390px] md:max-w-[440px] lg:max-w-[520px] aspect-[1.08/1] lg:aspect-auto lg:h-[500px] xl:h-[540px] relative overflow-visible">
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
              <AboutWorkspaceCanvas isActive={isActive} className="w-full h-full" />
            </Suspense>
          </div>
        </div>

        {/* Right Column — Editorial Text Content */}
        <div className="lg:col-span-7 flex flex-col text-left space-y-4 md:space-y-6">
          <div className="space-y-1.5 md:space-y-2">
            <h2 className="text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-stone-900 leading-[1.05]">
              {PROFILE_DATA.bioHeadline}
            </h2>
            <p className="text-base sm:text-xl md:text-2xl font-medium text-stone-700 leading-snug max-w-2xl">
              I enjoy creating delightful, human-centered digital experiences.
            </p>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-stone-600 leading-relaxed max-w-xl">
            {PROFILE_DATA.bioSummary}
          </p>

          {/* 3 Core Principles - Clean Typography Column */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 pt-3 sm:pt-4 border-t border-stone-200">
            {PROFILE_DATA.philosophy.map((item, idx) => (
              <div key={idx} className="space-y-0.5 sm:space-y-1">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-teal-800 tracking-wider">
                  0{idx + 1}.
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unified Bottom Utility Row */}
      <BottomUtilityRow
        leftMetadata="CRAFT & PHILOSOPHY"
        rightMetadata="MODERN ENGINEERING"
      />
    </section>
  );
};

export default AboutSection;
