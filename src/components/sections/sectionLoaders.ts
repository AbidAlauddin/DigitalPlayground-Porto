/**
 * Dynamic section module loaders with intelligent idle and interactive prefetching.
 */

export const loadSection = {
  about: () => import('./AboutSection').then((m) => ({ default: m.AboutSection })),
  skills: () => import('./SkillsSection').then((m) => ({ default: m.SkillsSection })),
  experience: () => import('./ExperienceSection').then((m) => ({ default: m.ExperienceSection })),
  projects: () => import('./ProjectsSection').then((m) => ({ default: m.ProjectsSection })),
  contact: () => import('./ContactSection').then((m) => ({ default: m.ContactSection })),
};

const prefetchedIndices = new Set<number>();

export const preloadSectionByIndex = (index: number): void => {
  if (prefetchedIndices.has(index)) return;
  prefetchedIndices.add(index);

  switch (index) {
    case 1:
      void loadSection.about();
      break;
    case 2:
      void loadSection.skills();
      break;
    case 3:
      void loadSection.experience();
      break;
    case 4:
      void loadSection.projects();
      break;
    case 5:
      void loadSection.contact();
      break;
    default:
      break;
  }
};

/**
 * Schedule staggered prefetching of subsequent sections during browser idle time
 * so navigation feels instantaneous while keeping initial page load ultra-fast.
 */
export const scheduleIdleSectionPrefetch = (): (() => void) => {
  const timers: number[] = [];

  const prefetchOrder = [1, 2, 3, 4, 5];
  let delay = 1200; // Allow Hero to completely mount and settle first

  prefetchOrder.forEach((idx) => {
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => preloadSectionByIndex(idx), { timeout: 2000 });
      } else {
        preloadSectionByIndex(idx);
      }
    }, delay);
    timers.push(timer);
    delay += 900; // Stagger downloads by 900ms to keep network clear
  });

  return () => {
    timers.forEach((t) => clearTimeout(t));
  };
};
