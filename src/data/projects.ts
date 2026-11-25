export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  description: string;
  technologies: string[];
  metrics: string;
  demoUrl?: string;
  repoUrl?: string;
  image?: string;
  projectType?: string;
  hidden?: boolean;
}

export const ALL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-toekoni',
    title: 'Toekoni',
    subtitle: 'Digital Showcase & Directory for Local MSMEs',
    category: 'Full-Stack & MSME Platform',
    year: '2026',
    description:
      'A digital showcase and promotion platform developed for local MSMEs in Kecamatan Sapuran, Kabupaten Wonosobo through the UNNES GIAT 16 collaborative initiative. Features a categorized product catalog, verified business directory, and direct contact integration.',
    technologies: ['Laravel', 'PHP 8', 'Livewire 3', 'Blade', 'Tailwind CSS', 'MySQL'],
    metrics: '31 MSMEs Registered • 39 Local Products',
    demoUrl: 'https://toekoni.id/',
    image: '/projects/toekoni-preview.webp',
    projectType: 'Collaborative Project (UNNES GIAT 16)',
  },
  {
    id: 'proj-nalar',
    title: 'Nalar',
    subtitle: 'AI-Powered Learning Management System for Indonesian Schools',
    category: 'Full-Stack & EdTech',
    year: '2026',
    description:
      'A web-based Learning Management System designed for Indonesian schools (SD, SMP, SMA) to assist teachers in preparing learning materials, generating quiz banks, and explaining answers with integrated AI assistance.',
    technologies: ['Laravel', 'PHP', 'Blade', 'Fortify', 'MySQL', 'Docker'],
    metrics: 'AI Question Bank & Assessment',
    demoUrl: 'https://nalar.ab1dal.com',
    repoUrl: 'https://github.com/AbidAlauddin/Nalar',
    image: '/projects/nalar.webp',
    projectType: 'Academic Final Project',
  },
  {
    id: 'proj-ecoquiz',
    title: 'EcoQuiz',
    subtitle: 'Interactive Digital Economics Learning & Case-Based Quiz Platform',
    category: 'EdTech & Interactive Quiz',
    year: '2026',
    description:
      'A web-based economics learning platform for high school (SMA/SMK) students combining 8 structured economics modules, real-world case examples, an 80-question multiple-choice assessment bank with automated feedback, study recommendations, and a live student leaderboard.',
    technologies: ['Laravel', 'PHP 8', 'Blade', 'Tailwind CSS', 'MySQL', 'Vite'],
    metrics: '8 Economics Modules • 80 Case-Based Quiz Questions',
    demoUrl: 'https://ecoquiz.ab1dal.com',
    repoUrl: 'https://github.com/AbidAlauddin/EcoQuiz',
    image: '/projects/ecoquiz.webp',
    projectType: 'Interactive EdTech Platform',
  },
  {
    id: 'proj-simora',
    title: 'SIMORA',
    subtitle: 'Operational Vehicle Borrowing, Real-Time Fleet GPS & Office Inventory System',
    category: 'Internal Enterprise Operations',
    year: '2026',
    description:
      'An integrated internal office operations platform for managing official vehicle borrowing schedules, real-time branch fleet GPS tracking via Leaflet maps, operational supply requests, office inventory records, reimbursement claims, and automated WhatsApp notifications.',
    technologies: ['Laravel 13', 'Livewire 4', 'Volt', 'PHP 8.3', 'Tailwind CSS', 'Leaflet.js'],
    metrics: 'Real-Time Fleet GPS • Multi-Role Operations & WhatsApp Webhook',
    repoUrl: 'https://github.com/AbidAlauddin/InternalSystemsOffice',
    image: '/projects/simora-preview.webp',
    projectType: 'Enterprise Operational System',
  },
  {
    id: 'proj-hcis',
    title: 'HCIS',
    subtitle: 'Desktop Human Capital Information System & Talent Mapping Platform',
    category: 'Desktop & Enterprise HR',
    year: '2026',
    description:
      'A cross-platform desktop HR application for employee profile management, talent mapping (strengths, weaknesses, and development recommendations), career path planning, annual KPI evaluation, and leadership program tracking (BLDP/ILDP/ALDP) with Excel export and JSON backup.',
    technologies: ['Tauri v2', 'React 19', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Prisma'],
    metrics: 'Desktop App • Talent Mapping, KPI & Excel Export',
    repoUrl: 'https://github.com/AbidAlauddin/HCIS',
    projectType: 'Desktop Enterprise System',
    hidden: true,
  },
  {
    id: 'proj-rekap-inventaris',
    title: 'Rekap Inventaris',
    subtitle: 'Internal Office Inventory, Procurement & Budget Realization Desktop App',
    category: 'Desktop & Office Operations',
    year: '2026',
    description:
      'A desktop internal office recap and financial inventory application built with Tauri and React. Features transaction and procurement tracking, vendor and account directories, budget realization analytics, monthly cashflow visualizations, and multi-sheet Excel and PDF reporting.',
    technologies: ['Tauri v2', 'React 19', 'TypeScript', 'Supabase', 'Prisma', 'Recharts', 'ExcelJS'],
    metrics: 'Multi-Sheet Excel & PDF Export • Budget & Vendor Tracking',
    repoUrl: 'https://github.com/AbidAlauddin/Rekap_TauriApp',
    projectType: 'Desktop Internal Tool',
    hidden: true,
  },
  {
    id: 'proj-heyjob',
    title: 'Hey Job (Portal Alumni)',
    subtitle: 'Modern Jobseeker Platform & Alumni Career Network',
    category: 'Career Platform & Web',
    year: '2025',
    description:
      'A comprehensive job recruitment and alumni networking ecosystem connecting university graduates with partner companies. Features smart job search with location/category filters, application tracking, and mentorship forums.',
    technologies: ['Laravel 12', 'Livewire 3', 'PHP 8.2', 'MySQL', 'Tailwind CSS'],
    metrics: 'Reactive Livewire SPA & Job Matching',
    repoUrl: 'https://github.com/AbidAlauddin/PortalAlumni',
    projectType: 'University Career Platform',
  },
  {
    id: 'proj-itask',
    title: 'iTask',
    subtitle: 'Personal Task & Daily Productivity Management Web Application',
    category: 'Productivity & Task Manager',
    year: '2024',
    description:
      'A clean web-based task and daily workflow manager featuring a dedicated My Day view, customizable task lists and categories, due-date tracking, completion status filtering, user profile management, and a responsive light/dark mode interface.',
    technologies: ['Laravel 10', 'PHP 8.1', 'Blade', 'Tailwind CSS', 'MySQL'],
    metrics: 'My Day Workflow • Custom Lists & Light/Dark Theme',
    repoUrl: 'https://github.com/AbidAlauddin/iTask',
    image: '/projects/itask-preview.webp',
    projectType: 'Software Engineering Project',
    hidden: true,
  },
  {
    id: 'proj-spk-beasiswa',
    title: 'SPK Beasiswa SAW-ROC',
    subtitle: 'Scholarship Decision Support System via SAW & ROC Methods',
    category: 'Decision Support System',
    year: '2024',
    description:
      'A decision support system implementing Simple Additive Weighting (SAW) combined with automatic criteria weighting via Rank Order Centroid (ROC) to rank and determine scholarship recipient eligibility.',
    technologies: ['Python 3', 'Flask', 'SQLite', 'Bootstrap', 'HTML5'],
    metrics: 'Automated ROC Weighting & Multi-Criteria SAW',
    repoUrl: 'https://github.com/AbidAlauddin/SPK-Beasiswa-Menggunakan-SAW-ROC',
    image: '/projects/beasiswa-preview.webp',
    projectType: 'Decision Support Research',
  },
];

export const FEATURED_PROJECTS: ProjectItem[] = ALL_PROJECTS.filter((project) => !project.hidden);
