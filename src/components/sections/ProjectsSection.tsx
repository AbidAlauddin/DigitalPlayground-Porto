import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { BottomUtilityRow } from '../layout/BottomUtilityRow';
import { FEATURED_PROJECTS } from '../../data/projects';
import type { PaginationTargetNdc } from '../../monster/components/ShowcaseOperatorScene';

const ShowcaseOperatorCanvas = lazy(() => import('../../monster/components/ShowcaseOperatorCanvas'));

interface ProjectsSectionProps {
  isActive?: boolean;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ isActive = true }) => {
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [pressedPaginationIdx, setPressedPaginationIdx] = useState<number | null>(null);
  const [manualTriggerVersion, setManualTriggerVersion] = useState(0);

  // Shared coordinate wrapper spanning BOTH the Actions/Pagination row AND the Monster Floor Stage
  const operatorStageRef = useRef<HTMLDivElement | null>(null);
  const actionButtonsRef = useRef<HTMLDivElement | null>(null);
  const paginationTargetsRef = useRef<PaginationTargetNdc[]>([]);
  const sitAnchorNdcXRef = useRef<number>(-0.62);

  const safeIdx = Math.min(activeProjectIdx, Math.max(0, FEATURED_PROJECTS.length - 1));
  const currentProject = FEATURED_PROJECTS[safeIdx];

  // Dynamically measure EVERY rendered [data-project-pagination] DOM button + sitting anchor in shared NDC space
  const measureDynamicTargets = useCallback(() => {
    const stageEl = operatorStageRef.current;
    if (!stageEl) return;
    const stageRect = stageEl.getBoundingClientRect();
    if (stageRect.width <= 0 || stageRect.height <= 0) return;

    const btnEls = Array.from(
      stageEl.querySelectorAll<HTMLButtonElement>('[data-project-pagination]')
    );

    paginationTargetsRef.current = btnEls.map((btn, domOrderIdx) => {
      const parsedIdx = Number(btn.getAttribute('data-project-pagination'));
      const index = Number.isFinite(parsedIdx) ? parsedIdx : domOrderIdx;
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.65; // Lower-center touch contact point of the button
      const ndcX = ((cx - stageRect.left) / stageRect.width) * 2 - 1;
      const ndcY = -(((cy - stageRect.top) / stageRect.height) * 2 - 1);
      return { index, ndcX, ndcY };
    });

    // Measure sitting anchor directly beneath the left action buttons (Live Website / Source Code)
    const actionEl = actionButtonsRef.current;
    if (actionEl) {
      const ar = actionEl.getBoundingClientRect();
      if (ar.width > 0) {
        const sitCenterX = ar.left + ar.width * 0.45;
        const rawNdcX = ((sitCenterX - stageRect.left) / stageRect.width) * 2 - 1;
        sitAnchorNdcXRef.current = Math.max(-0.85, Math.min(0.2, rawNdcX));
      }
    }
  }, []);

  // Re-measure on mount, ResizeObserver, DOM mutation (dynamic project count), window resize, or active project shift
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => measureDynamicTargets());
    const stageEl = operatorStageRef.current;
    let resizeObs: ResizeObserver | null = null;
    let mutObs: MutationObserver | null = null;
    if (stageEl && typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(() => measureDynamicTargets());
      resizeObs.observe(stageEl);
    }
    if (stageEl && typeof MutationObserver !== 'undefined') {
      mutObs = new MutationObserver(() => measureDynamicTargets());
      mutObs.observe(stageEl, { childList: true, subtree: true });
    }
    window.addEventListener('resize', measureDynamicTargets, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      resizeObs?.disconnect();
      mutObs?.disconnect();
      window.removeEventListener('resize', measureDynamicTargets);
    };
  }, [measureDynamicTargets, safeIdx]);

  const getPaginationTargets = useCallback(() => paginationTargetsRef.current, []);
  const getSitAnchorNdcX = useCallback(() => sitAnchorNdcXRef.current, []);

  // Manual user interaction: immediately overrides & cancels automatic sequence safely
  const handleManualSelect = useCallback((nextIdx: number) => {
    setActiveProjectIdx(nextIdx);
    setPressedPaginationIdx(null);
    setManualTriggerVersion((v) => v + 1);
  }, []);

  const handlePrev = () => {
    const nextIdx = safeIdx === 0 ? FEATURED_PROJECTS.length - 1 : safeIdx - 1;
    handleManualSelect(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = safeIdx === FEATURED_PROJECTS.length - 1 ? 0 : safeIdx + 1;
    handleManualSelect(nextIdx);
  };

  // Called by ShowcaseOperatorScene at the exact moment the monster's gloved hand taps button `idx`
  const handleOperatorPress = useCallback((idx: number) => {
    if (idx >= 0 && idx < FEATURED_PROJECTS.length) {
      setActiveProjectIdx(idx);
    }
  }, []);

  const getDisplayUrl = () => {
    if (currentProject.demoUrl) {
      try {
        return new URL(currentProject.demoUrl).hostname;
      } catch {
        return currentProject.demoUrl.replace(/^https?:\/\//, '');
      }
    }
    if (currentProject.repoUrl) {
      try {
        const u = new URL(currentProject.repoUrl);
        return u.hostname + u.pathname;
      } catch {
        return currentProject.repoUrl.replace(/^https?:\/\//, '');
      }
    }
    return 'portfolio.internal';
  };

  const formatNum = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <section
      id="projects"
      data-section-index="4"
      className="portfolio-section"
    >
      {/* Top Eyebrow */}
      <div className="page-container flex items-center justify-between text-xs md:text-sm font-semibold tracking-wider text-stone-500 uppercase">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-stone-400 inline-block" />
          <span>Selected Creations</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-stone-400">
          <span className="font-bold text-stone-900">{formatNum(safeIdx + 1)}</span>
          <span>/</span>
          <span>{formatNum(FEATURED_PROJECTS.length)}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="section-content my-auto page-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Side: Active Project Details + Shared Actions/Pagination/Operator Stage */}
        <div className="lg:col-span-6 flex flex-col text-left space-y-3.5 sm:space-y-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-800 tracking-wider uppercase">
                {currentProject.category} — {currentProject.year}
              </span>
              {currentProject.projectType && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200/70 rounded">
                  {currentProject.projectType}
                </span>
              )}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.1]">
              {currentProject.title}
            </h2>
            <p className="text-sm sm:text-base font-medium text-stone-700">
              {currentProject.subtitle}
            </p>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed max-w-lg">
            {currentProject.description}
          </p>

          {/* Tech Badges */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {currentProject.technologies.map((tech, tIdx) => (
              <span
                key={tIdx}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 text-stone-800 border border-stone-200"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Shared Stage Wrapper: Actions + Dynamic Pagination + Overlay 3D Operator Canvas */}
          <div ref={operatorStageRef} className="relative pt-1 overflow-visible">
            {/* Row 1: Action Buttons + Dynamic Existing Pagination (z-30 & pointer-events-auto guarantees 100% manual clickability) */}
            <div className="relative z-30 pointer-events-auto flex flex-wrap items-center gap-3">
              <div ref={actionButtonsRef} className="flex flex-wrap items-center gap-2.5">
                {currentProject.demoUrl && (
                  <a
                    href={currentProject.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-bold tracking-wider uppercase text-white bg-teal-800 hover:bg-teal-900 rounded-md transition-colors"
                  >
                    <span>Live Website</span>
                    <span>↗</span>
                  </a>
                )}
                {currentProject.repoUrl && (
                  <a
                    href={currentProject.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-bold tracking-wider uppercase text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                  >
                    <span>Source Code</span>
                    <span>↗</span>
                  </a>
                )}
              </div>

              {/* Dynamic Pagination Buttons (Single Source of Truth via [data-project-pagination]) */}
              <div className="relative z-30 pointer-events-auto ml-auto flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="relative z-30 pointer-events-auto cursor-pointer w-7 h-7 flex items-center justify-center text-xs font-mono font-bold rounded text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                  aria-label="Previous project"
                >
                  ‹
                </button>

                {FEATURED_PROJECTS.map((proj, pIdx) => {
                  const isPressed = pressedPaginationIdx === pIdx;
                  const isSelected = safeIdx === pIdx;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      data-project-pagination={pIdx}
                      onClick={() => handleManualSelect(pIdx)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`relative z-30 pointer-events-auto cursor-pointer px-2.5 py-1 text-xs font-mono font-bold rounded transition-all duration-150 ${
                        isSelected
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-400 hover:text-stone-800'
                      } ${isPressed ? 'scale-[0.86] translate-y-[2px] ring-2 ring-teal-700/40' : ''}`}
                      aria-label={`View project ${proj.title}`}
                    >
                      {formatNum(pIdx + 1)}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleNext}
                  className="relative z-30 pointer-events-auto cursor-pointer w-7 h-7 flex items-center justify-center text-xs font-mono font-bold rounded text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                  aria-label="Next project"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Row 2: Floor Space Beneath Actions & Pagination for Sitting, Standing & Walking */}
            <div className="w-full mt-5 sm:mt-1 h-[185px] sm:h-[195px] lg:h-[210px] pointer-events-none" aria-hidden="true" />

            {/* Full-Stage Overlay 3D Canvas — pointer-events-none so it NEVER blocks pagination or action buttons */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
              <Suspense fallback={null}>
                <ShowcaseOperatorCanvas
                  isActive={isActive}
                  stageContainerRef={operatorStageRef}
                  activeProjectIdx={safeIdx}
                  manualTriggerVersion={manualTriggerVersion}
                  getPaginationTargets={getPaginationTargets}
                  getSitAnchorNdcX={getSitAnchorNdcX}
                  onPressButton={handleOperatorPress}
                  onPressVisualChange={setPressedPaginationIdx}
                  className="w-full h-full"
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Right Side: Project Visual Showcase Box (Existing Preview Preserved) */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
          <div className="w-full aspect-16/10 rounded-2xl bg-stone-100 border border-stone-200/90 flex flex-col overflow-hidden relative shadow-sm">
            {/* Browser / Monitor Header Bar */}
            <div className="w-full h-8 sm:h-9 px-3.5 bg-stone-200/60 border-b border-stone-200/80 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
              </div>

              <div className="max-w-[200px] sm:max-w-[240px] truncate px-3 py-0.5 rounded-full bg-white/80 border border-stone-200/70 text-[11px] font-mono text-stone-600 flex items-center gap-1.5 shadow-2xs">
                <svg className="w-2.5 h-2.5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="truncate">{getDisplayUrl()}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">
                  {currentProject.demoUrl ? 'Live' : 'Archived'}
                </span>
              </div>
            </div>

            {/* Display Canvas Body */}
            {currentProject.image ? (
              <div className="relative flex-1 w-full overflow-hidden bg-stone-900 group">
                <img
                  src={currentProject.image}
                  alt={`${currentProject.title} Preview`}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                {currentProject.demoUrl && (
                  <a
                    href={currentProject.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-stone-950/0 hover:bg-stone-950/25 transition-all flex items-center justify-center opacity-0 hover:opacity-100"
                    aria-label={`Open ${currentProject.title} live website`}
                  >
                    <span className="px-4 py-2 bg-stone-900/90 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                      <span>Visit Live Site</span>
                      <span>↗</span>
                    </span>
                  </a>
                )}
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col justify-between p-6 bg-stone-50/50">
                <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                  <span className="font-bold tracking-wider">PROJECT PREVIEW</span>
                  <span>{currentProject.metrics}</span>
                </div>

                <div className="my-auto flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                    {currentProject.category}
                  </span>
                  <p className="text-xl md:text-2xl font-bold text-stone-800">
                    {currentProject.title}
                  </p>
                  <p className="text-xs text-stone-500 max-w-sm">
                    {currentProject.subtitle}
                  </p>
                </div>

                <div className="w-full flex items-center justify-between text-[11px] font-mono text-stone-400">
                  <span>STAGE READY</span>
                  <span>{currentProject.year}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Bottom Utility Row */}
      <BottomUtilityRow
        leftMetadata="FEATURED WORKS"
        rightMetadata="PRODUCTION DEPLOYMENTS"
      />
    </section>
  );
};
