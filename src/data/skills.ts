export interface SkillGroup {
  category: string;
  description: string;
  skills: string[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    category: 'Backend & Frameworks',
    description: 'Robust server-side architecture, MVC patterns, ORM data modeling, and RESTful APIs.',
    skills: ['PHP', 'Laravel', 'Blade', 'Livewire', 'REST APIs', 'Python', 'Flask'],
  },
  {
    category: 'Frontend & Client',
    description: 'Responsive user interfaces, component-driven design, and modern client tooling.',
    skills: ['React.js', 'TypeScript', 'JavaScript (ES6+)', 'Tailwind CSS', 'HTML5 & CSS3', 'Vite'],
  },
  {
    category: 'Database & Storage',
    description: 'Relational database schema design, migrations, data integrity, and query optimization.',
    skills: ['MySQL', 'PostgreSQL', 'SQLite', 'Supabase', 'Eloquent ORM'],
  },
  {
    category: 'Tools & Workflow',
    description: 'Version control, containerized local environments, cross-platform packaging, and API testing.',
    skills: ['Git & GitHub', 'Docker', 'Laravel Sail', 'Tauri', 'Composer & npm', 'Postman'],
  },
];
