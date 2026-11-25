export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
}

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp-1',
    role: 'Information Systems Student & Developer',
    company: 'Universitas Negeri Semarang',
    period: '2022 — Present',
    location: 'Semarang, Indonesia',
    summary: 'Pursuing Information Systems degree while building web and software engineering projects across curriculum and independent research.',
    highlights: [
      'Engineered full-stack educational platforms including Nalar (AI-assisted LMS) and EcoQuiz using Laravel and MySQL.',
      'Developed web-based decision support systems (SPK) implementing multi-criteria algorithms such as SAW and ROC.',
      'Collaborated on student recruitment and alumni networking initiatives through the Portal Alumni (Hey Job) platform.',
    ],
  },
  {
    id: 'exp-2',
    role: 'Full-Stack & Desktop Software Developer',
    company: 'Independent & Academic Projects',
    period: '2023 — Present',
    location: 'Semarang, Indonesia',
    summary: 'Designing and shipping full-stack web applications and cross-platform desktop systems with modern toolchains.',
    highlights: [
      'Architected the HCIS Talent Mapping System desktop application with Tauri, React, TypeScript, and Supabase.',
      'Constructed complete full-stack e-commerce architectures (eBake) with React 18, Redux Toolkit, Stripe, and Strapi CMS.',
      'Built interactive educational simulators (MYOB Smart-Guide) featuring guided self-assessment and troubleshooting.',
    ],
  },
  {
    id: 'exp-3',
    role: 'Open-Source & Web Technology Explorer',
    company: 'GitHub & Personal Lab',
    period: '2021 — Present',
    location: 'Remote',
    summary: 'Continuously maintaining public repositories, exploring bleeding-edge web frameworks, and refining developer workflows.',
    highlights: [
      'Authored and maintained 14 public repositories spanning Laravel, Python Flask, TypeScript, and desktop Tauri apps.',
      'Adopted containerized development workflows utilizing Docker, Laravel Sail, and Vite asset pipelines.',
    ],
  },
];
