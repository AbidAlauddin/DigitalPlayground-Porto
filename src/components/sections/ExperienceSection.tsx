import React, { Suspense, lazy } from 'react';
import { BottomUtilityRow } from '../layout/BottomUtilityRow';
import { EXPERIENCES } from '../../data/experience';

const CareerArchivistCanvas = lazy(() => import('../../monster/components/CareerArchivistCanvas'));

interface ExperienceSectionProps {
  isActive?: boolean;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ isActive = true }) => {
  return (
    <section
      id="experience"
      data-section-index="3"
      className="portfolio-section"
    >
      {/* Top Eyebrow */}
      <div className="page-container flex items-center justify-between text-xs md:text-sm font-semibold tracking-wider text-stone-500 uppercase">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-stone-400 inline-block" />
          <span>Professional Background</span>
        </div>
        <span className="text-stone-400 tracking-widest font-mono text-xs">
          04 / 06
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="section-content mt-3 sm:mt-4 mb-auto page-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Side: Editorial Timeline Content */}
        <div className="lg:col-span-8 flex flex-col text-left space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.08]">
              Impact & engineering leadership over the years.
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
              Chronological track record of architecting interactive systems, mentoring teams, and shipping production applications.
            </p>
          </div>

          {/* Minimalist Timeline List */}
          <div className="space-y-3 sm:space-y-3.5 pt-1">
            {EXPERIENCES.map((exp) => (
              <div
                key={exp.id}
                className="group p-3 sm:p-3.5 md:p-4 rounded-xl border border-stone-200 bg-white hover:border-teal-700/40 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1 sm:mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-stone-900">
                      {exp.role}
                    </h3>
                    <span className="text-xs text-stone-400">•</span>
                    <span className="text-xs sm:text-sm font-semibold text-teal-800">
                      {exp.company}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-stone-500">
                    {exp.period}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-2">
                  {exp.summary}
                </p>

                <ul className="space-y-0.5 sm:space-y-1">
                  {exp.highlights.slice(0, 2).map((item, hIdx) => (
                    <li
                      key={hIdx}
                      className="text-xs text-stone-500 flex items-start gap-2"
                    >
                      <span className="text-teal-700 font-bold leading-none mt-0.5">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: The Career Archivist 3D Scene */}
        <div className="lg:col-span-4 h-full flex items-center justify-center self-center my-auto overflow-visible">
          <div className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-none h-[380px] sm:h-[460px] lg:h-[540px] xl:h-[580px] flex items-center justify-center overflow-visible">
            <Suspense
              fallback={
                <div
                  className="w-full h-full flex items-center justify-center rounded-2xl bg-stone-100/50 border border-stone-200/60"
                  aria-hidden="true"
                >
                  <div className="w-9 h-9 rounded-full border-2 border-stone-300 border-t-teal-700 animate-spin" />
                </div>
              }
            >
              <CareerArchivistCanvas isActive={isActive} className="w-full h-full" />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Unified Bottom Utility Row */}
      <BottomUtilityRow
        leftMetadata="CAREER PROGRESSION"
        rightMetadata="2022 — PRESENT"
      />
    </section>
  );
};

export default ExperienceSection;
