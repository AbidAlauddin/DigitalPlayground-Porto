import React, { Suspense, lazy } from 'react';
import { BottomUtilityRow } from '../layout/BottomUtilityRow';
import { SKILL_GROUPS } from '../../data/skills';

const SkillBuilderCanvas = lazy(() => import('../../monster/components/SkillBuilderCanvas'));

interface SkillsSectionProps {
  isActive?: boolean;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ isActive = true }) => {
  return (
    <section
      id="skills"
      data-section-index="2"
      className="portfolio-section"
    >
      {/* Top Eyebrow */}
      <div className="page-container flex items-center justify-between text-xs md:text-sm font-semibold tracking-wider text-stone-500 uppercase">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-stone-400 inline-block" />
          <span>Technical Capabilities</span>
        </div>
        <span className="text-stone-400 tracking-widest font-mono text-xs">
          03 / 06
        </span>
      </div>

      {/* Main Content Layout */}
      <div className="section-content my-auto page-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headline and The Skill Builder Interactive Monster */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5 text-left">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.1]">
              Tools, stacks &amp; craft engineered with precision.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md">
              A comprehensive toolchain selected for high performance, developer velocity, and refined visual interaction.
            </p>
          </div>

          {/* The Skill Builder Horizontal Walking Stage */}
          <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] aspect-[1.58/1] relative overflow-visible">
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
              <SkillBuilderCanvas isActive={isActive} className="w-full h-full" />
            </Suspense>
          </div>
        </div>

        {/* Right Column: 4 Clean Skill Categories */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SKILL_GROUPS.map((group, idx) => (
            <div
              key={idx}
              className="space-y-3 p-5 rounded-xl bg-stone-50/60 border border-stone-200/80 transition-all hover:bg-stone-50 hover:border-stone-300"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 tracking-tight">
                  {group.category}
                </h3>
                <span className="text-[11px] font-mono text-stone-400 font-bold">
                  0{idx + 1}
                </span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                {group.description}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {group.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-stone-200 text-stone-800 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Bottom Utility Row */}
      <BottomUtilityRow
        leftMetadata="FULL-STACK TOOLCHAIN"
        rightMetadata="TYPESAFE & OPTIMIZED"
      />
    </section>
  );
};

export default SkillsSection;
