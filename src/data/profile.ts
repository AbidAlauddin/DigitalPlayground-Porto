export interface ProfileData {
  name: string;
  role: string;
  eyebrow: string;
  tagline: string;
  bioHeadline: string;
  bioSummary: string;
  philosophy: {
    title: string;
    description: string;
  }[];
  socials: {
    label: string;
    href: string;
  }[];
}

export const PROFILE_DATA: ProfileData = {
  name: 'ABID ALAUDDIN',
  role: 'FULL STACK DEVELOPER',
  eyebrow: 'Personal Portfolio',
  tagline: 'Building practical, modern web applications with robust Laravel backends and responsive client ecosystems.',
  bioHeadline: 'Think. Build. Solve.',
  bioSummary:
    'I am a Full Stack Developer based in Semarang, Indonesia, studying Information Systems at Universitas Negeri Semarang. I specialize in backend development with PHP and Laravel, paired with modern React, TypeScript, and desktop tools like Tauri to create reliable software that solves real-world challenges.',
  philosophy: [
    {
      title: 'Reliable Architecture',
      description: 'Clean, maintainable code structured around proven MVC patterns and robust relational schemas.',
    },
    {
      title: 'Practical Problem-Solving',
      description: 'Designing systems that address concrete domain needs, from educational LMS to enterprise HR tools.',
    },
    {
      title: 'Continuous Exploration',
      description: 'A fast learner continuously expanding my toolchain from Laravel to React, TypeScript, and Tauri.',
    },
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/AbidAlauddin' },
    { label: 'Instagram', href: 'https://www.instagram.com/abiiidal' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/abidalauddin' },
  ],
};
